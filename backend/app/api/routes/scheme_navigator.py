"""HTTP routes for the Scheme Navigator.

This module only adapts HTTP <-> the deterministic feature functions. No
eligibility logic lives here -- see
``app.features.scheme_navigator.evaluator`` for that.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.features.scheme_navigator.chat import chat
from app.features.scheme_navigator.evaluator import evaluate_all
from app.features.scheme_navigator.explainer import explain
from app.features.scheme_navigator.questionnaire import build_questionnaire
from app.features.scheme_navigator.rules import RULES
from app.features.scheme_navigator.schemas import (
    ChatRequest,
    ChatResponse,
    EvaluationRequest,
    EvaluationResponse,
    ExplanationRequest,
    ExplanationResponse,
    QuestionnaireField,
)
from app.integrations.ai.client import GroqClient, LLMClient, LLMUnavailableError

router = APIRouter(prefix="/api/scheme-navigator", tags=["scheme-navigator"])


def get_llm_client() -> LLMClient | None:
    """Provides the explainer's model client, or ``None`` when unconfigured.

    Declared as a dependency so tests can override it with a stub and never
    reach the network.
    """

    try:
        return GroqClient()
    except LLMUnavailableError:
        return None


@router.get("/questionnaire", response_model=list[QuestionnaireField])
def get_questionnaire() -> list[QuestionnaireField]:
    """Returns only the questions actually needed by the currently loaded
    scheme rules, in a stable display order."""

    return build_questionnaire(RULES)


@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate(request: EvaluationRequest) -> EvaluationResponse:
    """Evaluates the submitted answers against every loaded scheme rule.

    Any field a rule needs that is absent from ``answers`` yields a
    ``missing_information`` result for that scheme rather than a guess.
    """

    return evaluate_all(RULES, request.answers)


@router.post("/explain", response_model=ExplanationResponse)
def explain_result(
    request: ExplanationRequest,
    client: Annotated[LLMClient | None, Depends(get_llm_client)],
) -> ExplanationResponse:
    """Rephrases an already-decided result in plain language.

    The status is decided by the evaluator and only described here. If the
    model is unconfigured or unreachable, this returns a deterministic
    explanation rather than an error.
    """

    if not any(rule.id == request.result.rule_id for rule in RULES):
        raise HTTPException(status_code=404, detail="Unknown scheme rule")

    return explain(request.result, client)


@router.post("/chat", response_model=ChatResponse)
def chat_turn(
    request: ChatRequest,
    client: Annotated[LLMClient | None, Depends(get_llm_client)],
) -> ChatResponse:
    """Answers a scoped question about the loaded schemes and this app.

    Degrades to a canned reply when the model is unconfigured or
    unreachable, so the chat panel never surfaces a server error.
    """

    return chat(request.messages, request.answers, request.results, client)
