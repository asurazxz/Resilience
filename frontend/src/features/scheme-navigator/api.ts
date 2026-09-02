import type {
  Answers,
  ChatMessage,
  ChatResponse,
  EvaluationResponse,
  ExplanationResponse,
  QuestionnaireField,
  SchemeResult,
} from "./types";

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function fetchQuestionnaire(): Promise<QuestionnaireField[]> {
  const response = await fetch(`${API_BASE_URL}/api/scheme-navigator/questionnaire`);
  if (!response.ok) {
    throw new Error(`Failed to load questionnaire (${response.status})`);
  }
  return (await response.json()) as QuestionnaireField[];
}

export async function evaluateAnswers(answers: Answers): Promise<EvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scheme-navigator/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    throw new Error(`Failed to evaluate answers (${response.status})`);
  }
  return (await response.json()) as EvaluationResponse;
}

export async function explainResult(result: SchemeResult): Promise<ExplanationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scheme-navigator/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  });
  if (!response.ok) {
    throw new Error(`Failed to explain result (${response.status})`);
  }
  return (await response.json()) as ExplanationResponse;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  answers: Answers,
  results: SchemeResult[],
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scheme-navigator/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, answers, results }),
  });
  if (!response.ok) {
    throw new Error(`Chat request failed (${response.status})`);
  }
  return (await response.json()) as ChatResponse;
}
