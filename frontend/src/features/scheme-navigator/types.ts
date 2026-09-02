// Mirrors backend/app/features/scheme_navigator/schemas.py. Keep the two in
// sync by hand for now; promote to a generated OpenAPI client once FastAPI
// endpoints stabilise (see contracts/openapi/).

export type FieldType = "number" | "boolean" | "select" | "date";

export interface SelectOption {
  value: string;
  label: string;
}

export interface QuestionnaireField {
  key: string;
  label: string;
  field_type: FieldType;
  help_text: string | null;
  unit: string | null;
  options: SelectOption[] | null;
  min_value: number | null;
  max_value: number | null;
}

export type SchemeStatus = "matched" | "not_matched" | "missing_information";

export interface SchemeResult {
  rule_id: string;
  name: string;
  agency: string;
  status: SchemeStatus;
  matched_facts: string[];
  unmatched_reasons: string[];
  missing_fields: string[];
  official_source_url: string;
  application_url: string;
  last_reviewed_date: string;
  simplified_note: string;
}

export interface EvaluationResponse {
  generated_at: string;
  results: SchemeResult[];
}

export interface ExplanationResponse {
  summary: string;
  next_steps: string[];
  source_urls: string[];
  // False when the backend's deterministic fallback produced this text, so
  // the UI never labels a template as AI-written.
  is_ai_generated: boolean;
  generated_at: string;
}

export type AnswerValue = string | number | boolean | null;
export type Answers = Record<string, AnswerValue>;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  is_ai_generated: boolean;
  generated_at: string;
}
