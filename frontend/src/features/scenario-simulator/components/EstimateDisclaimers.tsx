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
    <section aria-labelledby="scenario-disclaimers-heading" className="card">
      <span className="mono-label">ESTIMATE</span>
      <h2
        id="scenario-disclaimers-heading"
        className="subheading mt-2"
      >
        About these numbers
      </h2>
      <ul className="mt-4 space-y-3 prose">
        {disclaimers.map((disclaimer) => (
          <li key={disclaimer} className="body-text-sm">
            {disclaimer}
          </li>
        ))}
      </ul>
    </section>
  );
}
