import { Link } from "react-router-dom";

import { useFoundation } from "../foundation-input/FoundationContext";
import { CHART_SERIES } from "../../lib/chartTheme";
import { FinancialScoreDial } from "./FinancialScoreDial";
import {
  FINANCIAL_SCORE_COMPONENT_LINKS,
  useFinancialScore,
  type FinancialScore,
  type FinancialScoreComponent,
  type FinancialScoreMissingInput,
} from "./financialScore";

function ComponentRow({ component }: { component: FinancialScoreComponent }) {
  const scored = component.status === "scored";
  const fraction = component.maxPoints > 0 ? Math.max(0, Math.min(1, component.points / component.maxPoints)) : 0;
  return (
    <li className={scored ? "" : "opacity-60"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="body-text ink-heading">{component.label}</span>
        {scored && <span className="mono-label">{component.points}/{component.maxPoints}</span>}
      </div>
      {scored ? (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} aria-hidden="true">
          <div className="h-full rounded-full" style={{ background: CHART_SERIES, width: `${fraction * 100}%` }} />
        </div>
      ) : null}
      <p className="mt-3 body-text">{component.detail}</p>
    </li>
  );
}

/**
 * When the score only reflects some of the components (the rest lack data),
 * a bare "100" next to "Steady" reads as a contradiction. This spells out
 * the partial basis in plain language, e.g. "Based on 2 of 3 areas. Add the
 * missing one for a full picture."
 */
function partialBasisNote(score: FinancialScore): string | null {
  if (score.score === null || score.scoredMaxPoints >= 100) return null;
  const scoredCount = score.components.filter((component) => component.status === "scored").length;
  const totalCount = score.components.length;
  const missingCount = totalCount - scoredCount;
  const missingPhrase = missingCount === 1 ? "the missing one" : `the missing ${missingCount}`;
  return `Based on ${scoredCount} of ${totalCount} areas. Add ${missingPhrase} for a full picture.`;
}

function MissingInputsChecklist({ items }: { items: FinancialScoreMissingInput[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <p className="mono-label">What's still needed</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li className="flex items-center justify-between gap-3" key={item.id}>
            <span className="body-text">{item.label}</span>
            <Link className="button-secondary shrink-0" style={{ minHeight: "auto", padding: "6px 14px", fontSize: "14px" }} to={item.route}>
              {item.action}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FinancialScoreCard() {
  // Keyed off stable, data-derived facts that actually change when the
  // user's foundation data does -- never off `syncedAt`, which the server
  // regenerates on every bootstrap response even when nothing changed and
  // would otherwise cause a refetch storm on every context refresh.
  const { data } = useFoundation();
  const refetchKey = [
    data.transactions.length,
    data.profile.emergencyFundBalanceCents,
    data.recurringWorkCosts.length,
    data.essentialExpenses.length,
    data.profile.onboardingCompleted,
  ].join(":");
  const { score, loading, failed } = useFinancialScore(refetchKey);
  const basisNote = score ? partialBasisNote(score) : null;
  const missingInputs = score?.missingInputs ?? [];

  return (
    <section className="card">
      <p className="eyebrow">Your financial score</p>
      {loading ? (
        <p className="mt-6 body-text" role="status">Loading your score…</p>
      ) : score === null || score.score === null ? (
        <div className="mt-6">
          <p className="body-text prose">Not enough information yet to calculate a score.</p>
          <p className="mt-3 body-text prose">Add your first transaction and the pieces below will start filling in.</p>
          <Link className="button-primary mt-6 inline-flex" to="/transactions/new">Add transaction</Link>
          <MissingInputsChecklist items={missingInputs} />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
          <FinancialScoreDial band={score.band} basisNote={basisNote ?? undefined} maxPoints={score.scoredMaxPoints} score={score.score} />
          <ul className="space-y-6">
            {score.components.map((component) => (
              <ComponentRow component={component} key={component.id} />
            ))}
          </ul>
        </div>
      )}
      {score && score.score !== null ? <MissingInputsChecklist items={missingInputs} /> : null}
      {score?.nextStep ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="body-text">{score.nextStep}</p>
          {score.components.find((component) => component.status !== "scored" || component.points < component.maxPoints) ? (
            <Link
              className="button-secondary shrink-0"
              to={FINANCIAL_SCORE_COMPONENT_LINKS[
                score.components.find((component) => component.status !== "scored" || component.points < component.maxPoints)!.id
              ]}
            >
              Take a look
            </Link>
          ) : null}
        </div>
      ) : null}
      {failed ? (
        <p className="mt-6 body-text prose" role="status">
          We could not load your score right now. The rest of your figures below are still up to date.
        </p>
      ) : null}
    </section>
  );
}
