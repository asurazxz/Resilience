/**
 * Estimate and non-advice notices. These are a safety boundary, not decoration:
 * results must never read as a prediction or as financial advice.
 */

export interface EstimateDisclaimersProps {
  disclaimers: string[];
}

export function EstimateDisclaimers({ disclaimers }: EstimateDisclaimersProps) {
  if (disclaimers.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="scenario-disclaimers-heading"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <h2 id="scenario-disclaimers-heading" className="text-sm font-semibold text-slate-900">
        About these numbers
      </h2>
      <ul className="mt-2 space-y-1">
        {disclaimers.map((disclaimer) => (
          <li key={disclaimer} className="text-xs leading-relaxed text-slate-600">
            {disclaimer}
          </li>
        ))}
      </ul>
    </section>
  );
}
