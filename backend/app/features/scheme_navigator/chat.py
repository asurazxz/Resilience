"""Scoped assistant for questions about the Scheme Navigator.

A free-text box is much easier to misuse than the explainer's single
button, so the constraints are tighter, not looser:

- the assistant may discuss only the four loaded schemes and how to use
  this app, and is told to decline anything else;
- it must never assert eligibility, and never compute or estimate money --
  the deterministic evaluator owns both;
- it sees the curated snippets for every loaded rule and nothing beyond
  them, so it cannot invent scheme facts nobody reviewed.

Unlike ``explainer.py``, this **does** receive the user's questionnaire
answers, because questions like "why didn't I match WIS?" are unanswerable
without them. That is a deliberate product decision recorded in
documentation/features/scheme-navigator.md, not an oversight -- and it is
scoped to this module. The explainer's stricter policy is unchanged.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app.features.scheme_navigator.fields import FIELD_REGISTRY
from app.features.scheme_navigator.questionnaire import (
    build_questionnaire,
    get_required_field_keys,
)
from app.features.scheme_navigator.rules import RULES
from app.features.scheme_navigator.schemas import (
    ChatMessage,
    ChatResponse,
    SchemeResult,
    SchemeStatus,
)
from app.features.scheme_navigator.sources import (
    COMCARE_HOTLINE,
    SUPPORT_GO_WHERE_URL,
    snippets_for,
)
from app.integrations.ai.client import LLMClient, LLMUnavailableError

FALLBACK_REPLY = (
    "Here is where to get an answer on that:\n\n"
    f"• SupportGoWhere ({SUPPORT_GO_WHERE_URL}) — lists government support "
    "and can check what you might get\n"
    f"• ComCare Call {COMCARE_HOTLINE} — if you would rather speak to someone\n"
    "• Your results on this page link to each scheme's official site"
)

SYSTEM_PROMPT = f"""You are a helper inside "Resilience", an app for Singapore \
platform workers with irregular weekly earnings. You help people understand their \
screening results and find government support that might be relevant to them.

You answer in one of two ways. Work out which from what they asked.

1. ABOUT THEM. They ask what applies to their own situation -- "what can I get?", \
"am I eligible for anything?", "why did I match this?", "why didn't I?". Their \
questionnaire answers and their screening results are in the message. Use them.
   - Go through every scheme the screening matched, and give each one a short line \
saying what it is and which of their own answers it turned on ("your household \
income per person is $400, which is within ComCare's guideline").
   - If a scheme did not match, say which of their answers fell outside it.
   - If something has not been answered yet, say which answer is missing rather \
than guessing.
   - Take the matched or not-matched outcome from the results given to you. Never \
work it out yourself, and never re-check their numbers against a threshold.
   - IF THE QUESTIONNAIRE IS NOT FINISHED and they ask what they can get: use what \
they have already told you, say plainly that you cannot see the full picture yet, \
then name the specific questions still unanswered and ask them to fill those in \
and run the check. Name the actual questions from the list given to you -- never \
say only "fill in the form". If they have answered nothing at all, say what the \
questionnaire will work out for them and ask them to start it.
   - Never guess, assume, or average an answer they have not given, and never \
treat a blank answer as a zero or a no.

2. GENERAL. They ask what a scheme is, or what support exists, without reference \
to themselves -- "what is ComCare?", "what help is there for gig workers?". Answer \
like a good search result: say plainly what it is, who it is broadly for, and how \
someone gets it, then give the official link. Two to four sentences. Do not pull in \
their personal answers for these -- they did not ask about themselves.

If a general question turns personal ("...and would I get it?"), answer the \
general part, then point them at their own results rather than judging it yourself.

Hard rules:
- Never tell the person they are eligible or ineligible for anything. A separate \
rules engine produced their result, it is pre-screening only, and only the \
relevant agency decides. Say "may be relevant" or "did not match the simplified \
check".
- Never calculate, estimate, compare, or project any amount of money, benefit \
value, or payout. If asked, say plainly that you cannot work out figures, and \
point to the official source.
- Never give financial, budgeting, tax, legal, or investment advice, even if asked \
directly. Say that is outside what this app does.
- For the schemes listed in the message, rely on the source extracts given.
- For any scheme NOT listed in the message, you may share general, widely known \
information -- but you must say in the same breath that this app has not checked \
or verified that scheme, and point the person to SupportGoWhere \
({SUPPORT_GO_WHERE_URL}) to confirm. Never invent specific criteria, amounts, \
dates, or quotas for these. If you are not confident, say you are not sure and \
send them to SupportGoWhere rather than guessing.
- If asked about anything unrelated to Singapore government support or this app, \
briefly say it is outside what you can help with, and offer what you can help \
with instead.
- Never end on a dead end. If you cannot answer -- because you do not know, \
because it is outside your scope, or because the information is not in front of \
you -- always give the person somewhere real to go in the same reply: the \
relevant scheme's official site, SupportGoWhere ({SUPPORT_GO_WHERE_URL}), or \
ComCare Call on {COMCARE_HOTLINE} if they would rather talk to a person. Say \
what you can't do in one short clause, then spend the rest of the reply on where \
they can get an answer.
- Never describe yourself as unavailable, broken, or offline, and never blame a \
technical problem. The person came here for help with money, and a status report \
is no use to them.
- Keep it tight. A general answer is two to four sentences of plain prose. Plain, \
warm, everyday language, and no jargon the person did not use first.
- Lay a personal answer out so it can be skimmed, not read as a wall of text. One \
scheme per line, each starting with "• ", the scheme name first, then why. Put a \
blank line between the ones that may be relevant and the ones that did not match. \
No preamble before the list beyond one short lead-in line.
- Never apologise for how you are answering, and never talk about yourself, the \
model, or your own wording. The person wants the answer, not commentary on how it \
was produced.

You are talking to the person whose answers these are, so referring to their own \
answers back to them is fine."""

RESPONSE_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "reply": {
            "type": "string",
            "description": (
                "Plain language. Two to four sentences for a general "
                "question; one short line per scheme for a personal one."
            ),
        }
    },
    "required": ["reply"],
    "additionalProperties": False,
}

# How many prior turns to replay. Enough for follow-up questions to make
# sense, bounded so the prompt cannot grow without limit.
_MAX_HISTORY_TURNS = 8


def _render_answers(answers: dict[str, object]) -> list[str]:
    """Renders answers using their questionnaire labels.

    Raw keys like ``household_income_per_capita`` are less legible to the
    model than the question the person actually saw.
    """

    lines: list[str] = []
    for key, value in answers.items():
        if value is None:
            continue
        field = FIELD_REGISTRY.get(key)
        label = field.label if field else key.replace("_", " ")
        if isinstance(value, bool):
            rendered = "Yes" if value else "No"
        elif field and field.options:
            rendered = next(
                (o.label for o in field.options if o.value == value), str(value)
            )
        else:
            rendered = str(value)
        lines.append(f"- {label} {rendered}")
    return lines


def unanswered_questions(answers: dict[str, object]) -> list[str]:
    """Questionnaire labels the person has not filled in yet.

    Derived from the fields the loaded rules actually reference, so it stays
    correct as schemes are added, and rendered as the question they saw
    rather than the field key.
    """

    missing = [
        key
        for key in get_required_field_keys(RULES)
        if answers.get(key) is None or answers.get(key) == ""
    ]
    ordered = [f.key for f in build_questionnaire(RULES) if f.key in missing]
    return [FIELD_REGISTRY[key].label for key in ordered]


def build_chat_prompt(
    messages: list[ChatMessage],
    answers: dict[str, object],
    results: list[SchemeResult],
) -> str:
    """Renders the user-turn prompt. Pure, so tests can assert on it exactly."""

    lines: list[str] = []

    if results:
        lines.append("This person's screening results:")
        for result in results:
            lines.append(f"- {result.name} ({result.agency}): {result.status.value}")
            # The evaluator's own reasons, so "why do I get this?" is answered
            # by reporting them rather than by the model re-deriving the
            # outcome from the person's raw figures.
            if result.matched_facts:
                lines.append("  met: " + "; ".join(result.matched_facts))
            if result.unmatched_reasons:
                lines.append(
                    "  did not meet: " + "; ".join(result.unmatched_reasons)
                )
            if result.missing_fields:
                lines.append(
                    "  still unanswered: "
                    + ", ".join(f.replace("_", " ") for f in result.missing_fields)
                )
        lines.append("")

    answer_lines = _render_answers(answers)
    if answer_lines:
        lines.append("What they told the questionnaire:")
        lines += answer_lines
        lines.append("")

    # Name what is still blank, so an incomplete questionnaire produces a
    # specific "answer these two" rather than a vague "fill in the form".
    unanswered = unanswered_questions(answers)
    if unanswered:
        lines.append(
            "Not answered yet — they have NOT finished the questionnaire:"
        )
        lines += [f"- {label}" for label in unanswered]
        if not results:
            lines.append(
                "They have also not run the check yet, so there are no results."
            )
        lines.append("")

    rule_ids = [r.rule_id for r in results] or [rule.id for rule in RULES]
    by_id = {rule.id: rule for rule in RULES}
    extracts: list[str] = []
    for rule_id in rule_ids:
        rule = by_id.get(rule_id)
        snippets = snippets_for(rule_id)
        if not (rule and snippets):
            continue
        extracts.append(f"{rule.name} — official page: {rule.support_go_where_url}")
        extracts += [f"  - {snippet.text}" for snippet in snippets]
    if extracts:
        lines.append(
            "Checked information on these schemes. Use this, and give the "
            "official page link when you talk about one:"
        )
        lines += extracts
        lines.append("")

    history = messages[-_MAX_HISTORY_TURNS:]
    if len(history) > 1:
        lines.append("Conversation so far:")
        for message in history[:-1]:
            speaker = "Them" if message.role == "user" else "You"
            lines.append(f"{speaker}: {message.content}")
        lines.append("")

    latest = history[-1].content if history else ""
    lines.append(f"Their question: {latest}")
    lines.append("Answer it, following your rules.")
    return "\n".join(lines)


def _results_summary(results: list[SchemeResult]) -> str | None:
    """Explains the person's results from the evaluator alone.

    "Why did I match this?" needs no model: the rules engine already
    produced the reasons. Without this the fallback throws that away and
    answers a question about someone's money with a generic signpost, even
    though the app is holding the actual answer.
    """

    if not results:
        return None

    matched = [r for r in results if r.status is SchemeStatus.MATCHED]
    not_matched = [r for r in results if r.status is SchemeStatus.NOT_MATCHED]
    incomplete = [
        r for r in results if r.status is SchemeStatus.MISSING_INFORMATION
    ]

    sections: list[str] = []

    if matched:
        block = ["Based on your answers, these may be relevant:", ""]
        for result in matched:
            block.append(f"• {result.name}")
            for fact in result.matched_facts[:3]:
                block.append(f"   ✓ {fact}")
            block.append("")
        sections.append("\n".join(block).rstrip())

    if not_matched:
        block = ["These did not match the simplified check:", ""]
        for result in not_matched:
            # "needs" makes clear these are criteria not met, rather than
            # reading as reasons the scheme did match.
            needs = "; ".join(result.unmatched_reasons[:2])
            block.append(f"• {result.name} — needs: {needs}")
        sections.append("\n".join(block))

    if incomplete:
        block = ["Still need a few answers before I can check these:", ""]
        for result in incomplete:
            readable = ", ".join(
                f.replace("_", " ") for f in result.missing_fields[:3]
            )
            block.append(f"• {result.name} — {readable}")
        sections.append("\n".join(block))

    return "\n\n".join(sections) if sections else None


def _fallback(results: list[SchemeResult] | None = None) -> ChatResponse:
    """Answers from the evaluator where possible, and always routes onward.

    No apology and no mention of the model: this answer comes from the
    rules engine, which is the authoritative part of the system. Leading
    with "I can't answer in my own words" would frame the more reliable
    answer as the degraded one.
    """

    summary = _results_summary(results or [])
    if summary:
        reply = (
            f"{summary}\n\n"
            "This is pre-screening, not a decision — each scheme above links "
            "to its official page.\n"
            f"More support: SupportGoWhere ({SUPPORT_GO_WHERE_URL})\n"
            f"Prefer to speak to someone? ComCare Call {COMCARE_HOTLINE}"
        )
    else:
        reply = FALLBACK_REPLY

    return ChatResponse(
        reply=reply,
        is_ai_generated=False,
        generated_at=datetime.now(UTC),
    )


def chat(
    messages: list[ChatMessage],
    answers: dict[str, object],
    results: list[SchemeResult],
    client: LLMClient | None,
) -> ChatResponse:
    """Answers the latest message, degrading rather than failing."""

    if client is None or not messages:
        return _fallback(results)

    try:
        payload = client.complete_json(
            system=SYSTEM_PROMPT,
            user=build_chat_prompt(messages, answers, results),
            schema=RESPONSE_SCHEMA,
        )
    except LLMUnavailableError:
        return _fallback(results)

    reply = str(payload.get("reply") or "").strip()
    if not reply:
        return _fallback(results)

    return ChatResponse(
        reply=reply,
        is_ai_generated=True,
        generated_at=datetime.now(UTC),
    )
