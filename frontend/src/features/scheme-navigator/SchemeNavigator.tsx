import { useEffect, useState } from "react";

import { evaluateAnswers, fetchQuestionnaire } from "./api";
import { useChatContext } from "./ChatContext";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { ResultsList } from "./ResultsList";
import type { Answers, QuestionnaireField, SchemeResult } from "./types";

type LoadState = "loading" | "ready" | "error";

export function SchemeNavigator() {
  const { publish } = useChatContext();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [fields, setFields] = useState<QuestionnaireField[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<SchemeResult[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchQuestionnaire()
      .then((loadedFields) => {
        if (cancelled) return;
        setFields(loadedFields);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Publish outward so the shell-level chat widget can see what is on
  // screen. One effect covers both change paths (editing and submitting).
  useEffect(() => {
    publish(answers, results);
  }, [answers, results, publish]);

  function handleAnswerChange(key: string, value: Answers[string]) {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    // Answers changed, so the last set of results no longer reflects the
    // current form -- clear them rather than show a stale match.
    setResults(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await evaluateAnswers(answers);
      setResults(response.results);
    } catch {
      setErrorMessage("Could not check schemes right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page mx-auto max-w-2xl py-8">
      <header className="mb-10">
        <p className="eyebrow">Government support</p>
        <h1 className="display-lg mt-3">Find schemes worth checking</h1>
        <p className="body-text prose mt-6">
          Answer a few questions. We will show which official schemes may be worth a closer look.
          The relevant agency makes the final decision.
        </p>
      </header>

      {loadState === "loading" && (
        <p className="body-text">Loading questionnaire...</p>
      )}

      {loadState === "error" && (
        <div className="card space-y-6">
          <span className="badge">Error</span>
          <p className="body-text prose">
            The scheme questions could not be loaded. Please try again after checking your connection.
          </p>
        </div>
      )}

      {loadState === "ready" && (
        <div className="space-y-10">
          <div className="card">
            <QuestionnaireForm
              fields={fields}
              answers={answers}
              onChange={handleAnswerChange}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>

          {errorMessage && (
            <div className="card space-y-6">
              <span className="badge">Error</span>
              <p className="body-text prose">{errorMessage}</p>
            </div>
          )}

          {results && <ResultsList results={results} />}
        </div>
      )}
    </main>
  );
}
