import { ExplanationPanel } from "./ExplanationPanel";
import type { SchemeResult } from "./types";

interface ResultsListProps {
  results: SchemeResult[];
}

const STATUS_LABEL: Record<SchemeResult["status"], string> = {
  matched: "Potentially relevant",
  missing_information: "Needs more information",
  not_matched: "Not currently matched",
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
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        This is pre-screening based on simplified rules, not an eligibility decision.
        Always confirm through the official source before applying.
      </p>

      {sorted.map((result) => (
        <article
          key={result.rule_id}
          className={`rounded-lg border p-4 ${STATUS_STYLE[result.status]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{result.name}</h3>
              <p className="text-xs text-slate-500">{result.agency}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[result.status]}`}
            >
              {STATUS_LABEL[result.status]}
            </span>
          </div>

          {result.status === "missing_information" && result.missing_fields.length > 0 && (
            <p className="mt-2 text-sm text-amber-800">
              Answer the remaining question(s) above to check this scheme.
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
                <li key={reason}>Does not currently meet: {reason}</li>
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
              Official source
            </a>
            {result.status === "matched" && (
              <a
                className="font-medium text-emerald-800 underline"
                href={result.application_url}
                target="_blank"
                rel="noreferrer"
              >
                Apply through official channel
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Rule last reviewed {result.last_reviewed_date}
          </p>
        </article>
      ))}
    </div>
  );
}
