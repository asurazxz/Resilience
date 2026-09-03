import { useState } from "react";

import { explainResult } from "./api";
import type { ExplanationResponse, SchemeResult } from "./types";
import { useChatContext } from "./ChatContext";
import { ApiError } from "../../lib/api";

interface ExplanationPanelProps {
  result: SchemeResult;
}

export function ExplanationPanel({ result }: ExplanationPanelProps) {
  const { answers } = useChatContext();
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleExplain() {
    setLoading(true);
    setErrorMessage(null);
    try {
      setExplanation(await explainResult(result, answers));
    } catch (cause) {
      setErrorMessage(explainErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  if (!explanation) {
    return (
      <div>
        <button type="button" onClick={handleExplain} disabled={loading} className="button-secondary">
          {loading ? "Explaining..." : "Explain this in plain language"}
        </button>
        {errorMessage && (
          <p className="mono-label prose mt-3" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // Labelled honestly either way, with a badge as the primary (non-color)
  // cue: the backend falls back to a written template when no model is
  // configured, and that is not AI-written.
  return (
    <div
      className="space-y-6 rounded-lg p-6"
      style={{ background: "var(--surface-obsidian-button)" }}
    >
      {/* The provenance badge is the honest AI / rule-based cue and stays a
          full-contrast Ivory badge, not a faded label. */}
      <span className="badge">
        {explanation.is_ai_generated ? "AI generated" : "Rule-based"}
      </span>

      <p className="body-text prose">{explanation.summary}</p>

      {explanation.next_steps.length > 0 && (
        <ul className="body-text prose list-inside list-disc space-y-3">
          {explanation.next_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      )}

      <p className="mono-label prose">
        {explanation.is_ai_generated
          ? "AI-written explanation of a rules-based result. It does not decide eligibility, and it can be wrong — check the official source."
          : "Standard explanation of a rules-based result. It does not decide eligibility — check the official source."}
      </p>
    </div>
  );
}

function explainErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    const fieldMessage = cause.fieldErrors?.[0]?.message;
    if (fieldMessage) return fieldMessage;
    if (cause.status === 404) {
      return "This scheme's explanation is not available right now.";
    }
    if (cause.status >= 500) {
      return "The explanation service is having trouble. Please try again shortly.";
    }
    return cause.message || "Could not load an explanation right now.";
  }
  return "Could not load an explanation right now. Check your connection and try again.";
}
