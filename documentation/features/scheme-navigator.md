# Scheme Navigator — Questionnaire & Deterministic Evaluator

**Updated:** 2026-09-03
**Status:** Integrated on `dev`
**Scope:** Dynamic questionnaire, deterministic rule evaluator, grounded AI explainer, and global chat widget.

## User-visible scope

A user answers a short questionnaire (only the fields the loaded scheme rules actually need — not a fixed per-scheme form) and sees, per scheme: status (potentially relevant / needs more information / not currently matched), the matched facts or unmatched reasons, an official-source link, an application link, the rule's last-reviewed date, and an explicit "simplified prototype approximation, not a decision" disclaimer.

Each result also offers "Explain this in plain language", which returns a short summary plus two or three next steps. The panel states whether the text was AI-written or came from the built-in template, and repeats that it does not decide eligibility.

Deferred: persistence — answers and results are in-memory client state and are lost on refresh — plus MyInfo pre-fill and any prefill from the user's own Income Reality figures.

A circular bot avatar sits bottom-right on every screen, opening a chat panel. The panel greets the person and offers two or three one-tap suggestions derived from their actual results ("Why didn't I match WIS?", "What other support might be available to me?"), so they are not facing a blank box.

The panel can switch between its corner view and a nearly full-window view without losing the conversation.
Scheme results themselves are compact summaries and reveal reasons, explanations, and official links only when opened.

## The chatbot answers in two modes

The system prompt defines two shapes and lets the model pick from the question:

**Personal** — "what can I get?", "why do I get ComCare?", "why didn't I match WIS?". The prompt carries the person's questionnaire answers (rendered under the question labels they actually saw) and the evaluator's results, including its `matched_facts` and `unmatched_reasons`. The reply gives one short line per scheme, each naming the answer that turned it on. **The prompt supplies the reasons so the model reports them rather than re-deriving the outcome** — without `matched_facts` it would have to check their figures against thresholds itself, which is exactly what the safety boundary forbids.

**General** — "what is ComCare?", "what help is there for gig workers?". Answer-box shaped: two to four sentences on what it is, who it is broadly for, how to get it, then the official link. The prompt tells it not to pull personal answers into these, because the person did not ask about themselves.

**Personal, questionnaire unfinished.** The widget publishes answers as they are typed, so someone can ask "what can I get?" halfway through. `unanswered_questions()` derives what is still blank from the fields the loaded rules reference and renders them as the questions the person actually saw, and the prompt lists them. The instruction is to use what they have already given, say the picture is incomplete, then name the specific outstanding questions — never just "fill in the form" — and never to read a blank answer as a zero or a "no".

`test_system_prompt_defines_both_answering_modes` and `test_prompt_carries_the_reasons_a_scheme_matched` pin these.

## Scheme facts come from SupportGoWhere

`CURATED_SOURCES` holds short factual summaries read from each scheme's page on SupportGoWhere, the government's own aggregator, each carrying that page's URL and a `retrieved_on` date. `SchemeRule.support_go_where_url` holds the canonical page so answers can link precisely rather than at the site root.

These were **read in a browser, not fetched server-side** — SupportGoWhere is a JavaScript app, so an `httpx` GET returns an empty shell. Runtime retrieval would need a headless browser in the backend, which is disproportionate here; curation gives grounded answers with no runtime dependency, no latency, and a human review step. The cost is that the snapshot goes stale: re-read the pages and update `retrieved_on` alongside the thresholds.

`test_every_rule_links_to_support_go_where` and `test_every_rule_has_curated_sources` stop a scheme being added without either.

> **Corrected 2026-09-02:** the ComCare threshold was `$700` per capita, guessed when the rule was written. SupportGoWhere states **$800 and below**. The old figure produced false negatives for anyone between $700 and $800 — telling people they did not match when they may well have qualified. WIS's thresholds were checked at the same time and were already correct.

## The chatbot may discuss schemes the app has not verified

**This reverses the feature's original grounding rule, deliberately, on the product owner's instruction (2026-09-02.)** The chatbot was first built to answer only from `CURATED_SOURCES`. It is now permitted to discuss *any* Singapore government support scheme, which means speaking from the model's own knowledge about schemes nobody on this team has curated or reviewed.

What still holds, unchanged:
- It must never assert eligibility, for any scheme, curated or not.
- It must never calculate, estimate, or project any monetary amount.
- It must never give financial, budgeting, tax, legal, or investment advice.

What was added to contain the widening:
- For anything outside the loaded schemes it must say **in the same reply** that this app has not checked or verified it, and point to SupportGoWhere.
- It is told never to invent specific criteria, amounts, dates, or quotas for uncurated schemes, and to say it is unsure rather than guess.
- The chat panel carries a permanent footer saying anything outside the screened schemes is unverified.

`test_system_prompt_constrains_talk_about_uncurated_schemes` pins those three instructions in place, so deleting them fails the suite. **But note what that test does and does not prove:** it proves the instructions are present, not that the model obeys them. See the limitations section.

## The chatbot's context policy differs from the explainer's — deliberately

These are two features with two policies, and they must not be merged:

| | Explainer | Chatbot |
|---|---|---|
| Sees the user's answers | **No** | **Yes** |
| Sees the decided results | Yes | Yes |
| Sees curated snippets | For that one rule | For every loaded rule |

The chatbot needs the answers because its most likely question is "why didn't I match WIS?", which is unanswerable without them. That is a conscious privacy trade — the person's income, age, and household figures go to the model on every turn — chosen by the product owner on 2026-09-02 with the exposure understood.

The explainer's stricter policy was **not** relaxed to accommodate this. `test_chatbot_and_explainer_keep_separate_context_policies` asserts the split directly, so a later refactor that unifies the two prompts fails the suite rather than silently widening what the explainer sends.

Everything else in the boundary below applies to the chatbot too: no eligibility claims, no monetary calculation, curated sources only, and a deterministic fallback on any failure. `ChatMessage.role` is a `Literal["user", "assistant"]`, so a client cannot inject a `system` turn (returns 422).

## "Why am I eligible?" does not need the model

The evaluator already produced `matched_facts` and `unmatched_reasons`. When the model is unreachable — outage, exhausted quota, no key — `_results_summary()` builds the answer from those directly: one line per scheme, each naming the criteria that decided it, still framed as pre-screening and still routing onward.

This was a real defect, found on 2026-09-02 by someone asking the running app "why am I eligible?" and getting generic signpost text. The app was holding the exact answer and throwing it away because the *rephrasing* layer was down. It inverted the architecture's own principle: deterministic logic owns the reasoning, the model only rephrases it — so losing the model should cost polish, not the answer.

`test_no_client_still_explains_the_results` and `test_unreachable_model_still_explains_the_results` cover it. The generic reply now appears only when there is genuinely nothing to explain (no results yet).

## No dead ends

Someone using this app is looking for money they may be entitled to. "The assistant is unavailable" is a status report about our infrastructure and is worthless to them, so every path where the app cannot answer — model unreachable, quota exhausted, question out of scope, model simply doesn't know, or the browser request failing outright — routes to somewhere real instead: the scheme's official page, SupportGoWhere, or ComCare Call. The system prompt carries the same rule, so the model behaves this way too rather than only the fallbacks.

Contact details live in `sources.py` beside the curated snippets, because they are curated official references and carry the same verification obligation.

`COMCARE_HOTLINE` (1800-222-0000) was verified against MSF's own ComCare and contact pages on 2026-09-02, recorded in `CONTACTS_VERIFIED_ON`. Re-confirm periodically — unlike a stale scheme threshold, a wrong hotline number sends someone nowhere at the moment they need help.

## The AI safety boundary

The evaluator decides; the LLM only rephrases. Four things enforce that:

1. `POST /explain` takes an already-decided `SchemeResult`. The model is never given the user's answers, so it cannot re-derive the outcome. `test_prompt_withholds_the_users_answers` asserts this against distinctive sentinel values. The rule's *published criteria* are in the prompt — they are the same clauses the results UI already shows, and the explanation is meaningless without them.
2. `ExplanationResponse` has **no status field**. There is structurally nowhere for a model-authored eligibility claim to land (`test_explanation_cannot_carry_a_status`).
3. The model sees only `CURATED_SOURCES` snippets for that `rule_id`. It has no tools, no retrieval, and no network of its own.
4. Every failure — no API key, network error, refusal, unparseable JSON, blank summary — returns the deterministic fallback with `is_ai_generated: false`. The endpoint has no path that 500s because the LLM was unavailable.

## Interfaces added in the explainer pass

**Backend**
- `sources.py` — `CURATED_SOURCES`: hand-written prototype summaries per `rule_id`, each with `source_url` and `retrieved_on`. Not verbatim official text and not verified current policy.
- `explainer.py` — `build_prompt()` (pure) and `explain(result, client)`. Holds `SYSTEM_PROMPT`, the response JSON schema, and the fallback copy.
- `app/integrations/ai/client.py` — the provider-neutral `LLMClient` protocol plus the current Groq client. Transport only: no rules, no prompt content.

- `chat.py` — `build_chat_prompt()` (pure) and `chat()`, holding the assistant's tighter system prompt and its canned fallback. History is capped at 8 turns so the prompt cannot grow without bound.

**API**
- `POST /api/v1/scheme-navigator/explain` `{ result: SchemeResult }` → `ExplanationResponse { summary, next_steps, source_urls, is_ai_generated, generated_at }`. Unknown `rule_id` → 404.
- `POST /api/v1/scheme-navigator/chat` `{ messages, answers, results }` → `ChatResponse { reply, is_ai_generated, generated_at }`. Never 500s on model failure; the panel is usable before the questionnaire is submitted.

**Frontend**
- `ChatWidget.tsx` — fixed bottom-right avatar launcher and panel. The avatar is an inline SVG bot in a circle, with no binary asset or external request. Suggestion chips are derived client-side from results already in state.
- `ChatContext.tsx` — carries `answers` and `results` from the Scheme Navigator out to the shell-mounted widget, so the questionnaire's state does not have to be lifted into the shell. The widget also works when another route has published no questionnaire context.

**Shared-shell integration.** `ChatProvider` and `ChatWidget` are mounted in `frontend/src/app/App.tsx`, so the widget is present on every route. Feature implementation remains under `features/scheme-navigator/`.

**Model call:** Groq through the official `groq` SDK, chat completions, no tools, not streamed — `complete_json` must return one fully parsed object, so a stream would only be reassembled before parsing anyway.

Three properties of the configured model, each confirmed against the live API rather than assumed, shape `GroqClient`:

- It is a reasoning model. `reasoning_format="parsed"` puts the chain of thought in a separate field so `content` holds only the answer; left at the default it arrives inline as a `<think>…</think>` block that would break every JSON parse. Both are handled — the field is requested, and a stray block is stripped.
- `response_format={"type": "json_object"}` is rejected for this model at `reasoning_effort="default"`, because the raw generation opens with reasoning prose. So the schema is described in the system prompt and the parsed result is shape-checked in the client instead.
- Reasoning consumes the completion budget before the answer starts, hence `MAX_COMPLETION_TOKENS = 8192`.

A stray ```` ```json ```` fence is also stripped before parsing. Absorbing all of this is the transport layer's job, so the callers keep one provider-neutral schema. The SDK is constructed with the key from settings rather than from the ambient environment, so an unconfigured deployment fails cleanly as `LLMUnavailableError` at construction rather than surfacing later as a request error.

The provider has changed several times over this project. On each swap only `client.py`, the settings module, the route import and the requirements changed. `explainer.py`, `chat.py`, the prompts and every test were untouched and the suite passed unchanged. That is the `LLMClient` protocol earning its place — and it is why no document outside this section should name a vendor.

**Configuration:** `GROQ_API_KEY`, `GROQ_MODEL` and `GROQ_BASE_URL`, all optional, read by `backend/app/core/settings.py` from the process environment falling back to `backend/.env`. That file is gitignored and holds the real key; the tracked `backend/.env.example` carries placeholders only. With no key the feature runs entirely on its deterministic fallbacks, which is the state the UI has been verified in.

## Current assumptions (reversible)

- Scheme thresholds (WIS, ComCare, SkillsFuture Credit, CDC Vouchers) are simplified numeric approximations of real 2025/2026 parameters, not verified current rules. Each rule's `simplified_note` states this, and it is surfaced in every API result and in the UI.
- Questionnaire fields are answered directly by the user (for example `monthly_income` and `household_income_per_capita`) rather than sourced from Income Reality. A future adapter may prefill these values without changing the deterministic evaluator.
- `spouse_annual_income` is asked unconditionally with "enter 0 if not married" guidance, rather than a conditional follow-up field, to keep the evaluator simple for this prototype pass.

## Interfaces

**Backend** (`backend/app/features/scheme_navigator/`):
- `fields.py` — `FIELD_REGISTRY`: every field a rule can reference (label, type, options, help text).
- `rules.py` — `RULES`: versioned `SchemeRule` list (WIS, ComCare, SkillsFuture Credit, CDC Vouchers), each with `official_source_url`, `effective_date`, `last_reviewed_date`, `rule_version`, `simplified_note`.
- `questionnaire.py` — `build_questionnaire(rules)`: derives the deduplicated, ordered field list actually needed by the loaded rules.
- `evaluator.py` — `evaluate_rule` / `evaluate_all`: pure functions, no FastAPI/DB/LLM dependency. Missing-required-field always yields `missing_information`, never a guessed `not_matched`.

**API** (`backend/app/api/routes/scheme_navigator.py`):
- `GET /api/v1/scheme-navigator/questionnaire` → `QuestionnaireField[]`
- `POST /api/v1/scheme-navigator/evaluate` `{ answers: {...} }` → `EvaluationResponse { generated_at, results: SchemeResult[] }`

**Frontend** (`frontend/src/features/scheme-navigator/`):
- `types.ts` — hand-mirrors the backend Pydantic schemas.
- `api.ts` — calls the shared `src/lib/api.ts` client, so these routes get the same `/api/v1` prefix, bearer token, 401 retry and error envelope as every other feature. Request bodies are typed against the generated OpenAPI schemas, after a `ruleId`/`rule_id` mismatch shipped undetected.
- `QuestionnaireForm.tsx` — renders whatever fields the backend returns, dispatching on `field_type`.
- `ResultsList.tsx` — matched-first ordering, disclaimer banner, official/application links.
- `SchemeNavigator.tsx` — container: loads questionnaire, holds answer state, calls evaluate, clears stale results when an answer changes.

No persistence layer yet: answers and results live only in React state for this pass.

## Tests performed

- `backend/tests/unit/test_scheme_navigator_evaluator.py` (41 assertions across matched, not-matched, missing-information — including "missing takes priority over a false field" and `None`-as-missing — and boundary values for income/age/annual-value on both sides of each threshold, plus full operator coverage via a synthetic rule).
- `backend/tests/unit/test_scheme_navigator_questionnaire.py` (dedup across rules, unknown-field-key raises, real-rule field set matches expectation, stable preferred ordering).
- `backend/tests/integration/test_scheme_navigator_api.py` (health, questionnaire shape, evaluate-with-no-answers → all missing, evaluate-with-full-answers → all four schemes matched, plus `/explain` with a stubbed client, `/explain` with no client configured, and unknown-rule → 404).
- `backend/tests/unit/test_scheme_navigator_explainer.py` (prompt carries the outcome, every curated snippet, and the simplified note; prompt withholds the user's answers; response cannot carry a status; model output used when present; blank summary and blank steps handled; fallback covers all three statuses and never claims eligibility). The LLM is a stub in every test — no test touches the network.
- The integrated backend and frontend suites pass; see the [root README](../../README.md#tests) for the commands.
- Verified end to end on 2026-09-02 with `/health`, questionnaire, evaluation, explanation fallbacks, and the browser UI at `:5173`; the production PWA build passes.

## Known limitations / follow-up

- Scheme thresholds need review against current official sources before any non-prototype use.
- `CURATED_SOURCES` snippets are hand-written prototype summaries, not verified quotations from the official pages. They need review by someone checking the live sources before any non-prototype use.
- **The chatbot's guardrails are prompt-level, and prompts are not a security boundary.** The system prompt forbids eligibility claims, monetary calculation, and off-topic answers, and the prompt tests pin that those instructions stay present — but no test proves the model *obeys* them, and none can. Because the live call has never succeeded (below), the assistant's actual adherence under adversarial questions is entirely unverified. Try to break it before demoing.
- **This risk grew when the chatbot was allowed to discuss uncurated schemes.** Previously a hallucinated scheme fact was impossible by construction, because the model had only reviewed snippets to work from; that structural guarantee is now gone and has been replaced by an instruction asking the model to self-declare uncertainty. Self-declared uncertainty is exactly the thing language models are least reliable at. The realistic failure is a confident, plausible, wrong statement about a scheme's criteria, delivered to someone deciding whether to apply for financial support. Before the demo, deliberately ask it about a scheme that is *not* one of the four and check it both flags itself as unverified and does not invent criteria.
- **A live model-generated explanation or chat response has not been part of the integrated verification.** The transport and response parsing are unit-tested with stubs, and no-key or provider failures use deterministic fallbacks. Re-test the configured model from an unrestricted network before the demo.
- No database persistence of answers, goals, or rule versions — in-memory only.
- Conditional/dependent questions (e.g. only ask `spouse_annual_income` if married) are not modelled; simplified per assumption above.
- Frontend contract/routing coverage is part of the integrated test suite; dedicated Scheme Navigator component interaction tests remain a follow-up.
