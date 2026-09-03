import type {
  Answers,
  ChatMessage,
  ChatResponse,
  EvaluationResponse,
  ExplanationResponse,
  QuestionnaireField,
  SchemeResult,
} from "./types";
import type { components } from "../../types/api.generated";
import { apiRequest } from "../../lib/api";

// Request bodies are typed against the generated OpenAPI schemas so a
// field-name drift from the backend (e.g. rule_id vs ruleId) fails the
// TypeScript build instead of silently 422ing at runtime.
type EvaluationRequest = components["schemas"]["EvaluationRequest"];
type ExplanationRequest = components["schemas"]["ExplanationRequest"];

export function fetchQuestionnaire(): Promise<QuestionnaireField[]> {
  return apiRequest<QuestionnaireField[]>("/scheme-navigator/questionnaire");
}

export function evaluateAnswers(answers: Answers): Promise<EvaluationResponse> {
  const body: EvaluationRequest = { answers };
  return apiRequest<EvaluationResponse>("/scheme-navigator/evaluate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function explainResult(result: SchemeResult, answers: Answers): Promise<ExplanationResponse> {
  const body: ExplanationRequest = { rule_id: result.rule_id, answers };
  return apiRequest<ExplanationResponse>("/scheme-navigator/explain", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function sendChatMessage(
  messages: ChatMessage[],
  answers: Answers,
  results: SchemeResult[],
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/scheme-navigator/chat", {
    method: "POST",
    body: JSON.stringify({ messages, answers, results }),
  });
}
