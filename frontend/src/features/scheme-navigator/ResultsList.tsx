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

// Non-color cues distinguish status: badge copy, an icon glyph, and a
// distinct badge surface step (never color alone -- chromatic accents are
// reserved for full-bleed tiles, not small inline status text).
const STATUS_BADGE_LABEL: Record<SchemeResult["status"], string> = {
  matched: "Matched",
  missing_information: "Info needed",
  not_matched: "Not matched",
};

const STATUS_ICON: Record<SchemeResult["status"], string> = {
  matched: "✓",
  missing_information: "?",
  not_matched: "–",
};

const STATUS_BADGE_BACKGROUND: Record<SchemeResult["status"], string> = {
  matched: "var(--surface-mist)",
  missing_information: "rgba(255, 255, 255, 0.2)",
  not_matched: "rgba(255, 255, 255, 0.08)",
};

const STATUS_BADGE_COLOR: Record<SchemeResult["status"], string> = {
  matched: "var(--color-onyx)",
  missing_information: "var(--color-pure)",
  not_matched: "var(--color-ash)",
};

export function ResultsList({ results }: ResultsListProps) {
  // Order: matched first (the useful answer), then what still needs
  // information, then non-matches last -- shown for transparency, not hidden.
  const order: SchemeResult["status"][] = ["matched", "missing_information", "not_matched"];
  const sorted = [...results].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <section className="space-y-6" aria-labelledby="scheme-results-title">
      <h2 id="scheme-results-title" className="display-lg">Your results</h2>
      <p className="body-text prose">
        These are pointers based on simplified rules. Open a scheme for the reason and official next step.
      </p>

      {sorted.map((result) => (
        <details key={result.rule_id} className="card group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="min-w-0">
              {/* The scheme name is the one thing in this block that gets
                  White; everything else stays Ash body copy. */}
              <h3 className="body-text" style={{ color: "var(--color-pure)", fontWeight: 500 }}>
                {result.name}
              </h3>
              <p className="mono-label mt-3">{result.agency}</p>
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <span
                className="badge"
                style={{
                  background: STATUS_BADGE_BACKGROUND[result.status],
                  color: STATUS_BADGE_COLOR[result.status],
                }}
              >
                <span aria-hidden="true" className="mr-1">{STATUS_ICON[result.status]}</span>
                {STATUS_BADGE_LABEL[result.status]}
                <span className="sr-only"> ({STATUS_LABEL[result.status]})</span>
              </span>
              <span
                className="mono-label group-open:rotate-180"
                aria-hidden="true"
                style={{ transition: "transform var(--motion-quick)" }}
              >
                ⌄
              </span>
            </span>
          </summary>

          {/* 24px between the blocks inside the card so long result text does
              not run together as a wall. */}
          <div className="divider mt-6 space-y-6 border-t pt-6">
            {result.status === "missing_information" && result.missing_fields.length > 0 && (
              <p className="body-text prose">
                Answer the remaining question above to check this scheme more accurately.
              </p>
            )}

            {result.matched_facts.length > 0 && (
              <ul className="body-text prose list-inside list-disc space-y-3">
                {result.matched_facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            )}

            {result.status === "not_matched" && result.unmatched_reasons.length > 0 && (
              <ul className="body-text prose list-inside list-disc space-y-3">
                {result.unmatched_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}

            <p className="mono-label prose italic">{result.simplified_note}</p>

            <ExplanationPanel result={result} />

            <div className="flex flex-wrap gap-6 text-sm">
              {/* Links stay White + underline: Cobalt is not allowed to colour
                  text below 24px, and Ash would not read as a link. */}
              <a
                className="body-text underline"
                style={{ color: "var(--color-pure)" }}
                href={result.official_source_url}
                target="_blank"
                rel="noreferrer"
              >
                Read the official details
              </a>
              {result.status === "matched" && (
                <a
                  className="body-text underline"
                  style={{ color: "var(--color-pure)" }}
                  href={result.application_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Go to the official application
                </a>
              )}
            </div>
            <p className="mono-label">
              Rule last reviewed {result.last_reviewed_date}
            </p>
          </div>
        </details>
      ))}
    </section>
  );
}
