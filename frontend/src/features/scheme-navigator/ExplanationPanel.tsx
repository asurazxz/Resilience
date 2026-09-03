import { useState } from "react";

import { explainResult } from "./api";
import type { ExplanationResponse, SchemeResult } from "./types";
import { useChatContext } from "./ChatContext";

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
    } catch {
      setErrorMessage("Could not load an explanation right now.");
    } finally {
      setLoading(false);
    }
  }

  if (!explanation) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={handleExplain}
          disabled={loading}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
        >
          {loading ? "Explaining..." : "Explain this in plain language"}
        </button>
        {errorMessage && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded border border-slate-200 bg-white/70 p-3">
      <p className="text-sm text-slate-800">{explanation.summary}</p>

      {explanation.next_steps.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          {explanation.next_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      )}

      {/* Labelled honestly either way: the backend falls back to a written
          template when no model is configured, and that is not AI-written. */}
      <p className="mt-2 text-xs text-slate-500">
        {explanation.is_ai_generated
          ? "AI-written explanation of a rules-based result. It does not decide eligibility, and it can be wrong — check the official source."
          : "Standard explanation of a rules-based result. It does not decide eligibility — check the official source."}
      </p>
    </div>
  );
}
