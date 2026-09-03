import type {
  Answers,
  ChatMessage,
  ChatResponse,
  EvaluationResponse,
  ExplanationResponse,
  QuestionnaireField,
  SchemeResult,
} from "./types";
import { apiRequest } from "../../lib/api";

export function fetchQuestionnaire(): Promise<QuestionnaireField[]> {
  return apiRequest<QuestionnaireField[]>("/scheme-navigator/questionnaire");
}

export function evaluateAnswers(answers: Answers): Promise<EvaluationResponse> {
  return apiRequest<EvaluationResponse>("/scheme-navigator/evaluate", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function explainResult(result: SchemeResult, answers: Answers): Promise<ExplanationResponse> {
  return apiRequest<ExplanationResponse>("/scheme-navigator/explain", {
    method: "POST",
    body: JSON.stringify({ ruleId: result.rule_id, answers }),
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
