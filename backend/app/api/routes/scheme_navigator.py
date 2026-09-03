"""HTTP routes for the Scheme Navigator.

This module only adapts HTTP <-> the deterministic feature functions. No
eligibility logic lives here -- see
``app.features.scheme_navigator.evaluator`` for that.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from ...core.auth import current_user_id
from ...core.errors import DomainError
from ...features.scheme_navigator.chat import chat
from ...features.scheme_navigator.evaluator import evaluate_all
from ...features.scheme_navigator.explainer import explain
from ...features.scheme_navigator.questionnaire import build_questionnaire
from ...features.scheme_navigator.rules import RULES
from ...features.scheme_navigator.schemas import (
    ChatRequest,
    ChatResponse,
    EvaluationRequest,
    EvaluationResponse,
    ExplanationRequest,
    ExplanationResponse,
    QuestionnaireField,
)
from ...integrations.ai.client import GeminiClient, LLMClient, LLMUnavailableError

router = APIRouter(prefix="/scheme-navigator", tags=["scheme-navigator"])


def get_llm_client() -> LLMClient | None:
    """Provides the explainer's model client, or ``None`` when unconfigured.

    Declared as a dependency so tests can override it with a stub and never
    reach the network.
    """

    try:
        return GeminiClient()
    except LLMUnavailableError:
        return None


@router.get("/questionnaire", response_model=list[QuestionnaireField])
def get_questionnaire(
    _user_id: Annotated[UUID, Depends(current_user_id)],
) -> list[QuestionnaireField]:
    """Returns only the questions actually needed by the currently loaded
    scheme rules, in a stable display order."""

    return build_questionnaire(RULES)


@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate(
    request: EvaluationRequest,
    _user_id: Annotated[UUID, Depends(current_user_id)],
) -> EvaluationResponse:
    """Evaluates the submitted answers against every loaded scheme rule.

    Any field a rule needs that is absent from ``answers`` yields a
    ``missing_information`` result for that scheme rather than a guess.
    """

    return evaluate_all(RULES, request.answers)


@router.post("/explain", response_model=ExplanationResponse)
def explain_result(
    request: ExplanationRequest,
    client: Annotated[LLMClient | None, Depends(get_llm_client)],
    _user_id: Annotated[UUID, Depends(current_user_id)],
) -> ExplanationResponse:
    """Rephrases an already-decided result in plain language.

    The status is decided by the evaluator and only described here. If the
    model is unconfigured or unreachable, this returns a deterministic
    explanation rather than an error.
    """

    results = evaluate_all(RULES, request.answers).results
    result = next((item for item in results if item.rule_id == request.rule_id), None)
    if result is None:
        raise DomainError(404, "SCHEME_RULE_NOT_FOUND", "Unknown scheme rule")
    return explain(result, client)


@router.post("/chat", response_model=ChatResponse)
def chat_turn(
    request: ChatRequest,
    client: Annotated[LLMClient | None, Depends(get_llm_client)],
    _user_id: Annotated[UUID, Depends(current_user_id)],
) -> ChatResponse:
    """Answers a scoped question about the loaded schemes and this app.

    Degrades to a canned reply when the model is unconfigured or
    unreachable, so the chat panel never surfaces a server error.
    """

    # Client results are display state, not an authority boundary. Rebuild them
    # from the submitted answers before they can influence a model prompt.
    results = evaluate_all(RULES, request.answers).results
    return chat(request.messages, request.answers, results, client)
