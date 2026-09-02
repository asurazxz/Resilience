import { ExplanationPanel } from "./ExplanationPanel";
import type { SchemeResult } from "./types";

interface ResultsListProps {
  results: SchemeResult[];
}

const STATUS_LABEL: Record<SchemeResult["status"], string> = {
  matched: "Worth checking",
  missing_information: "Answer needed",
  not_matched: "May not fit",
};

const STATUS_STYLE: Record<SchemeResult["status"], string> = {
  matched: "border-emerald-300 bg-emerald-50",
  missing_information: "border-amber-300 bg-amber-50",
  not_matched: "border-slate-200 bg-slate-50",
};

const STATUS_BADGE: Record<SchemeResult["status"], string> = {
  matched: "bg-emerald-700 text-white",
  missing_information: "bg-amber-600 text-white",
  not_matched: "bg-slate-400 text-white",
};

export function ResultsList({ results }: ResultsListProps) {
  // Order: matched first (the useful answer), then what still needs
  // information, then non-matches last -- shown for transparency, not hidden.
  const order: SchemeResult["status"][] = ["matched", "missing_information", "not_matched"];
  const sorted = [...results].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <section className="space-y-3" aria-labelledby="scheme-results-title">
      <h2 id="scheme-results-title" className="text-2xl font-bold">Your results</h2>
      <p className="text-xs text-slate-500">
        These are pointers based on simplified rules. Open a scheme for the reason and official next step.
      </p>

      {sorted.map((result) => (
        <details
          key={result.rule_id}
          className={`group rounded-xl border ${STATUS_STYLE[result.status]}`}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">{result.name}</h3>
              <p className="text-xs text-slate-500">{result.agency}</p>
            </div>
            <span className="flex items-center gap-2">
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[result.status]}`}>{STATUS_LABEL[result.status]}</span>
              <span className="font-bold text-slate-500 group-open:rotate-180" aria-hidden="true">⌄</span>
            </span>
          </summary>

          <div className="border-t border-black/10 px-4 pb-4">

          {result.status === "missing_information" && result.missing_fields.length > 0 && (
            <p className="mt-2 text-sm text-amber-800">
              Answer the remaining question above to check this scheme more accurately.
            </p>
          )}

          {result.matched_facts.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
              {result.matched_facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}

          {result.status === "not_matched" && result.unmatched_reasons.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-slate-500">
              {result.unmatched_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs italic text-slate-500">{result.simplified_note}</p>

          <ExplanationPanel result={result} />

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a
              className="font-medium text-emerald-800 underline"
              href={result.official_source_url}
              target="_blank"
              rel="noreferrer"
            >
              Read the official details
            </a>
            {result.status === "matched" && (
              <a
                className="font-medium text-emerald-800 underline"
                href={result.application_url}
                target="_blank"
                rel="noreferrer"
              >
                Go to the official application
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Rule last reviewed {result.last_reviewed_date}
          </p>
          </div>
        </details>
      ))}
    </section>
  );
}
