import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  HttpResilienceJarApi,
  readCachedSummary,
  ResilienceJarApiError,
  type ResilienceJarApi,
} from "./api.ts";
import {
  centsToDollars,
  dollarsToCents,
  formatMoney,
  recommendationExplanation,
  singaporeToday,
  visualFillPercent,
  weeklyToMonthlyCents,
} from "./model.ts";
import { ProgressLineChart } from "./ProgressLineChart.tsx";
import type {
  Contribution,
  Goal,
  JarSummary,
  RecommendationMethod,
} from "./types.ts";
import "./resilienceJar.css";

interface ResilienceJarPageProps {
  api?: ResilienceJarApi;
  view?: "jar" | "plan";
  onNavigate?: (path: "/resilience-jar" | "/resilience-jar/plan") => void;
}

export function ResilienceJarPage({
  api,
  view = "jar",
  onNavigate,
}: ResilienceJarPageProps) {
  const client = useMemo(() => api ?? new HttpResilienceJarApi(), [api]);
  const [summary, setSummary] = useState<JarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );
  const [weeklyTarget, setWeeklyTarget] = useState("0.00");
  const [goalMode, setGoalMode] = useState<Goal["mode"]>("coverage");
  const [goalAmount, setGoalAmount] = useState("1000.00");
  const [goalWeeks, setGoalWeeks] = useState("4");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(singaporeToday());
  const [contributionNote, setContributionNote] = useState("");
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState(singaporeToday());
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [editingContributionId, setEditingContributionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = readCachedSummary();
        if (active) {
          setSummary(cached);
          if (cached) syncPlanForms(cached);
          setError(cached ? null : "No cached Jar summary is available offline.");
          setLoading(false);
        }
        return;
      }
      try {
        const next = await client.getSummary();
        if (active) {
          setSummary(next);
          syncPlanForms(next);
        }
      } catch (requestError) {
        const cached = readCachedSummary();
        if (active) {
          setSummary(cached);
          if (cached) syncPlanForms(cached);
          setError(
            cached
              ? "Showing your last saved view because the latest data could not be loaded."
              : errorMessage(requestError),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    function updateConnection() {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (!isOffline) void load();
    }

    void load();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      active = false;
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, [client]);

  function syncPlanForms(next: JarSummary) {
    setWeeklyTarget(centsToDollars(next.plan.weekly_target_cents));
    setGoalMode(next.plan.goal.mode);
    if (next.plan.goal.mode === "amount") {
      setGoalAmount(centsToDollars(next.plan.goal.amount_cents));
    } else {
      setGoalWeeks(String(next.plan.goal.weeks));
    }
  }

  async function updateMethod(method: RecommendationMethod) {
    await runMutation(async () => client.patchPlan({ recommendation_method: method }));
  }

  async function acceptRecommendation() {
    const amount = summary?.recommendation.amount_cents;
    if (amount === null || amount === undefined) return;
    await runMutation(async () => client.patchPlan({ weekly_target_cents: amount }));
  }

  async function saveWeeklyTarget(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(weeklyTarget);
    if (cents === null) {
      setError("Enter a weekly target with no more than two decimal places.");
      return;
    }
    await runMutation(async () => client.patchPlan({ weekly_target_cents: cents }));
  }

  async function saveGoal(event: FormEvent) {
    event.preventDefault();
    let goal: Goal;
    if (goalMode === "amount") {
      const cents = dollarsToCents(goalAmount);
      if (cents === null || cents <= 0) {
        setError("Enter a goal amount greater than zero.");
        return;
      }
      goal = { mode: "amount", amount_cents: cents };
    } else {
      const weeks = Number(goalWeeks);
      if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) {
        setError("Choose a whole number of weeks from 1 to 52.");
        return;
      }
      goal = { mode: "coverage", weeks };
    }
    await runMutation(async () => client.patchPlan({ goal }));
  }

  async function togglePause() {
    if (!summary) return;
    await runMutation(async () =>
      client.patchPlan({
        status: summary.plan.status === "active" ? "paused" : "active",
      }),
    );
  }

  async function saveContribution(event: FormEvent) {
    event.preventDefault();
    const amountCents = dollarsToCents(contributionAmount);
    if (amountCents === null || amountCents <= 0) {
      setError("Enter a contribution greater than zero.");
      return;
    }
    const payload = {
      amount_cents: amountCents,
      contribution_date: contributionDate,
      note: contributionNote,
    };
    await runMutation(async () => {
      if (editingContributionId) {
        await client.updateContribution(editingContributionId, payload);
      } else {
        await client.createContribution(payload);
      }
      const next = await client.getSummary();
      clearContributionForm();
      return next;
    });
  }

  async function saveWithdrawal(event: FormEvent) {
    event.preventDefault();
    const amountCents = dollarsToCents(withdrawalAmount);
    const trackedBalance = summary?.progress.contribution_total_cents ?? 0;
    if (amountCents === null || amountCents <= 0) {
      setError("Enter a withdrawal greater than zero.");
      return;
    }
    if (amountCents > trackedBalance) {
      setError("The withdrawal cannot exceed your tracked Jar balance.");
      return;
    }
    await runMutation(async () => {
      await client.createWithdrawal({
        amount_cents: amountCents,
        contribution_date: withdrawalDate,
        note: withdrawalNote,
      });
      const next = await client.getSummary();
      setWithdrawalOpen(false);
      setWithdrawalAmount("");
      setWithdrawalDate(singaporeToday());
      setWithdrawalNote("");
      return next;
    });
  }

  function editContribution(contribution: Contribution) {
    setEditingContributionId(contribution.id);
    setContributionAmount(centsToDollars(contribution.amount_cents));
    setContributionDate(contribution.contribution_date);
    setContributionNote(contribution.note ?? "");
  }

  async function deleteContribution(contribution: Contribution) {
    const entryLabel =
      contribution.entry_type === "withdrawal" ? "withdrawal" : "contribution";
    const confirmed = window.confirm(
      `Delete the ${formatMoney(contribution.amount_cents)} ${entryLabel}?`,
    );
    if (!confirmed) return;
    await runMutation(async () => {
      await client.deleteContribution(contribution.id);
      if (editingContributionId === contribution.id) clearContributionForm();
      return client.getSummary();
    });
  }

  function clearContributionForm() {
    setEditingContributionId(null);
    setContributionAmount("");
    setContributionDate(singaporeToday());
    setContributionNote("");
  }

  async function runMutation(action: () => Promise<JarSummary>) {
    if (offline) {
      setError("Changes are online-only. Reconnect before updating your Jar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const next = await action();
      setSummary(next);
      syncPlanForms(next);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !summary) {
    return <main className="jar-page jar-state">Loading your Resilience Jar…</main>;
  }

  if (!summary) {
    return (
      <main className="jar-page jar-state" role="alert">
        <h1>Resilience Jar</h1>
        <p>{error ?? "Your Jar could not be loaded."}</p>
      </main>
    );
  }

  const progress = summary.progress;
  const fillPercent = visualFillPercent(progress.progress_percent);
  const isPaused = summary.plan.status === "paused";
  const isOverGoal = (progress.progress_percent ?? 0) > 100;
  const mutationsDisabled = saving || offline;
  const goalNeedsReview = summary.goal_review.status === "expenses_changed";
  const previousMonthlyExpenses =
    summary.goal_review.previous_weekly_expenses_cents === null
      ? null
      : weeklyToMonthlyCents(
          summary.goal_review.previous_weekly_expenses_cents,
        );
  const currentMonthlyExpenses =
    summary.goal_review.current_weekly_expenses_cents === null
      ? null
      : weeklyToMonthlyCents(
          summary.goal_review.current_weekly_expenses_cents,
        );

  return (
    <main className="jar-page">
      <header className="jar-heading">
        <div>
          <p className="jar-eyebrow">
            {view === "jar" ? "Habit Builder" : "Resilience Jar"}
          </p>
          <h1>{view === "jar" ? "Resilience Jar" : "Plan settings"}</h1>
          <p>
            {view === "jar"
              ? "Build your buffer one deliberate contribution at a time."
              : "Choose how your weekly target and longer-term goal should work."}
          </p>
        </div>
        {view === "jar" ? (
          <button
            className="jar-button jar-button-secondary"
            disabled={mutationsDisabled}
            onClick={() => void togglePause()}
            type="button"
          >
            {isPaused ? "Resume plan" : "Pause plan"}
          </button>
        ) : (
          <button
            className="jar-back-link"
            onClick={() => onNavigate?.("/resilience-jar")}
            type="button"
          >
            <span aria-hidden="true">←</span> Back to Jar
          </button>
        )}
      </header>

      {offline && (
        <p className="jar-banner" role="status">
          Offline: showing the last saved view. Changes are available after reconnecting.
        </p>
      )}
      {isPaused && (
        <p className="jar-banner" role="status">
          Your weekly prompts are paused. Your target, goal, and contribution history are unchanged.
        </p>
      )}
      {error && (
        <p className="jar-error" role="alert">
          {error}
        </p>
      )}
      {goalNeedsReview && (
        <section
          className="jar-goal-alert"
          role="alert"
          aria-labelledby="jar-goal-alert-title"
        >
          <span className="jar-goal-alert-icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong id="jar-goal-alert-title">
              Your essential expenses changed
            </strong>
            {previousMonthlyExpenses !== null &&
              currentMonthlyExpenses !== null && (
                <p>
                  They changed from about {formatMoney(previousMonthlyExpenses)} to{" "}
                  {formatMoney(currentMonthlyExpenses)} per month since you last saved this goal.
                </p>
              )}
            {view === "jar" ? (
              <button
                className="jar-alert-action"
                onClick={() => onNavigate?.("/resilience-jar/plan")}
                type="button"
              >
                Review goal
              </button>
            ) : (
              <p className="jar-goal-alert-guidance">
                Review the goal below and save it to confirm the updated expense amount.
              </p>
            )}
          </div>
        </section>
      )}

      <section
        className="jar-overview"
        aria-labelledby="jar-progress-title"
        hidden={view !== "jar"}
      >
        <div
          className="jar-visual"
          role="progressbar"
          aria-labelledby="jar-progress-title"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fillPercent)}
          aria-valuetext={
            progress.progress_percent === null
              ? "Goal percentage unavailable"
              : `${progress.progress_percent}% of goal, ${formatMoney(progress.contribution_total_cents)} tracked`
          }
        >
          <div className="jar-visual-fill" style={{ height: `${fillPercent}%` }} />
          <span>
            {progress.progress_percent === null
              ? "—"
              : `${progress.progress_percent}%`}
          </span>
        </div>
        <div className="jar-progress-copy">
          <p className="jar-eyebrow" id="jar-progress-title">
            Contribution progress
          </p>
          <div className="jar-progress-metrics">
            <div>
              <span>Saved in Jar</span>
              <strong>{formatMoney(progress.contribution_total_cents)}</strong>
            </div>
            <div className="jar-goal-amount">
              <span>Goal amount</span>
              <strong>{formatMoney(progress.goal_target_cents)}</strong>
              <small>
                {summary.plan.goal.mode === "coverage"
                  ? `${summary.plan.goal.weeks} weeks of essential expenses`
                  : "Your chosen amount"}
              </small>
            </div>
          </div>
          {isOverGoal && <p className="jar-goal-passed">Goal passed</p>}
          {progress.coverage_days === null ? (
            <p className="jar-muted">
              Add weekly essential expenses to see days and weeks of coverage.
            </p>
          ) : (
            <p>
              About {progress.coverage_days} days ({progress.coverage_weeks} weeks) of essential expenses.
            </p>
          )}
          <p className="jar-muted">Existing emergency savings are not included here.</p>
          <div className="jar-plan-strip">
            <div>
              <span>Weekly target</span>
              <strong>{formatMoney(summary.plan.weekly_target_cents)}</strong>
            </div>
            <div>
              <span>Goal</span>
              <strong>
                {summary.plan.goal.mode === "coverage"
                  ? `${summary.plan.goal.weeks} weeks`
                  : formatMoney(summary.plan.goal.amount_cents)}
              </strong>
            </div>
            <button
              className="jar-text-link"
              onClick={() => onNavigate?.("/resilience-jar/plan")}
              type="button"
            >
              Edit plan
            </button>
          </div>
        </div>
      </section>

      <section className="jar-insights" hidden={view !== "jar"} aria-label="Goal outlook">
        <article className="jar-card jar-projection">
          <p className="jar-eyebrow">Projected completion</p>
          <ProjectionCopy summary={summary} />
        </article>
        <article className="jar-card jar-milestones">
          <h2>Milestones</h2>
          {summary.milestones.length === 0 ? (
            <p className="jar-muted">Set a goal amount to see your milestones.</p>
          ) : (
            <ol>
              {summary.milestones.map((milestone) => (
                <li className={milestone.reached ? "is-reached" : ""} key={milestone.percentage}>
                  <span aria-hidden="true">{milestone.reached ? "✓" : milestone.percentage}</span>
                  <div>
                    <strong>{milestone.percentage}%</strong>
                    <small>{formatMoney(milestone.target_cents)}</small>
                  </div>
                  <em>{milestone.reached ? "Reached" : "Ahead"}</em>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>

      <section className="jar-card jar-chart-card" hidden={view !== "jar"}>
        <ProgressLineChart
          contributions={summary.contributions}
          goalTargetCents={progress.goal_target_cents}
        />
      </section>

      <div className="jar-grid" hidden={view !== "plan"}>
        <section className="jar-card" aria-labelledby="jar-suggestion-title">
          <h2 id="jar-suggestion-title">Weekly suggestion</h2>
          <label htmlFor="jar-method">Calculation method</label>
          <select
            id="jar-method"
            value={summary.plan.recommendation_method}
            disabled={mutationsDisabled}
            onChange={(event) =>
              void updateMethod(event.target.value as RecommendationMethod)
            }
          >
            <option value="conservative_4_week">Conservative four-week</option>
            <option value="latest_week">Latest completed week</option>
          </select>
          <p className="jar-muted">
            {recommendationExplanation(summary.plan.recommendation_method)}
          </p>
          {isPaused ? (
            <p role="status">
              Recommendation prompts are paused. Resume when you want a new weekly prompt.
            </p>
          ) : summary.recommendation.status === "insufficient_data" ? (
            <p role="status">
              Add a completed income week to receive a suggestion. You can still set a target manually.
            </p>
          ) : (
            <div className="jar-suggestion">
              <span>Suggested</span>
              <strong>{formatMoney(summary.recommendation.amount_cents)}</strong>
              <button
                className="jar-button"
                type="button"
                disabled={mutationsDisabled}
                onClick={() => void acceptRecommendation()}
              >
                Use this target
              </button>
            </div>
          )}

          <form onSubmit={(event) => void saveWeeklyTarget(event)}>
            <label htmlFor="jar-weekly-target">Your active weekly target (SGD)</label>
            <div className="jar-inline-form">
              <input
                id="jar-weekly-target"
                inputMode="decimal"
                value={weeklyTarget}
                onChange={(event) => setWeeklyTarget(event.target.value)}
              />
              <button className="jar-button" disabled={mutationsDisabled} type="submit">
                Save target
              </button>
            </div>
          </form>
        </section>

        <section className="jar-card" aria-labelledby="jar-goal-title">
          <h2 id="jar-goal-title">Jar goal</h2>
          <form onSubmit={(event) => void saveGoal(event)}>
            <fieldset>
              <legend>Set the goal by</legend>
              <label className="jar-radio">
                <input
                  checked={goalMode === "coverage"}
                  name="goal-mode"
                  type="radio"
                  onChange={() => setGoalMode("coverage")}
                />
                Essential-expense coverage
              </label>
              <label className="jar-radio">
                <input
                  checked={goalMode === "amount"}
                  name="goal-mode"
                  type="radio"
                  onChange={() => setGoalMode("amount")}
                />
                Dollar amount
              </label>
            </fieldset>
            {goalMode === "coverage" ? (
              <label>
                Whole weeks
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={goalWeeks}
                  onChange={(event) => setGoalWeeks(event.target.value)}
                />
              </label>
            ) : (
              <label>
                Goal amount (SGD)
                <input
                  inputMode="decimal"
                  value={goalAmount}
                  onChange={(event) => setGoalAmount(event.target.value)}
                />
              </label>
            )}
            <button className="jar-button" disabled={mutationsDisabled} type="submit">
              Save goal
            </button>
          </form>
          {goalMode === "coverage" &&
            (summary.weekly_essential_expenses_cents === null ||
              summary.weekly_essential_expenses_cents <= 0) && (
              <p className="jar-muted" role="status">
                Your coverage goal is saved, but its dollar value needs essential-expense data.
              </p>
            )}
        </section>
      </div>

      <section
        className="jar-card jar-contributions"
        aria-labelledby="jar-contributions-title"
        hidden={view !== "jar"}
      >
        <div className="jar-contribution-heading">
          <div>
            <h2 id="jar-contributions-title">Track your Jar</h2>
            <p className="jar-disclaimer">
              Resilience only tracks amounts you report. It never holds, transfers, or withdraws money.
            </p>
          </div>
          <button
            className="jar-button jar-button-withdraw"
            disabled={mutationsDisabled || progress.contribution_total_cents <= 0}
            onClick={() => setWithdrawalOpen((open) => !open)}
            type="button"
          >
            {withdrawalOpen ? "Cancel withdrawal" : "Use emergency funds"}
          </button>
        </div>

        {withdrawalOpen && (
          <form
            className="jar-withdrawal-form"
            onSubmit={(event) => void saveWithdrawal(event)}
          >
            <div className="jar-withdrawal-intro">
              <strong>Record emergency funds used</strong>
              <span>
                This reduces your tracked balance. It does not move money from any account.
              </span>
            </div>
            <label>
              Amount (SGD)
              <input
                required
                inputMode="decimal"
                value={withdrawalAmount}
                onChange={(event) => setWithdrawalAmount(event.target.value)}
              />
            </label>
            <label>
              Date
              <input
                required
                type="date"
                max={singaporeToday()}
                value={withdrawalDate}
                onChange={(event) => setWithdrawalDate(event.target.value)}
              />
            </label>
            <label>
              Reason (optional)
              <input
                maxLength={200}
                value={withdrawalNote}
                onChange={(event) => setWithdrawalNote(event.target.value)}
              />
            </label>
            <button className="jar-button jar-button-withdraw" disabled={mutationsDisabled} type="submit">
              Record withdrawal
            </button>
          </form>
        )}

        <div>
          <h3>Add contribution</h3>
          <p className="jar-disclaimer">
            Only money added to this Jar is counted. Existing savings are excluded.
          </p>
        </div>
        <form className="jar-contribution-form" onSubmit={(event) => void saveContribution(event)}>
          <label>
            Amount (SGD)
            <input
              required
              inputMode="decimal"
              value={contributionAmount}
              onChange={(event) => setContributionAmount(event.target.value)}
            />
          </label>
          <label>
            Date
            <input
              required
              type="date"
              max={singaporeToday()}
              value={contributionDate}
              onChange={(event) => setContributionDate(event.target.value)}
            />
          </label>
          <label>
            Note (optional)
            <input
              maxLength={200}
              value={contributionNote}
              onChange={(event) => setContributionNote(event.target.value)}
            />
          </label>
          <div className="jar-form-actions">
            <button className="jar-button" disabled={mutationsDisabled} type="submit">
              {editingContributionId ? "Save changes" : "Add contribution"}
            </button>
            {editingContributionId && (
              <button
                className="jar-button jar-button-secondary"
                type="button"
                onClick={clearContributionForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {summary.contributions.length === 0 ? (
          <p className="jar-empty">No contributions yet. Your first entry can be any positive amount.</p>
        ) : (
          <ul className="jar-contribution-list">
            {summary.contributions.map((contribution) => (
              <li className={`jar-entry jar-entry-${contribution.entry_type}`} key={contribution.id}>
                <div>
                  <span className="jar-entry-type">
                    {contribution.entry_type === "withdrawal" ? "Withdrawal" : "Contribution"}
                  </span>
                  <strong>
                    {contribution.entry_type === "withdrawal" ? "−" : "+"}
                    {formatMoney(contribution.amount_cents)}
                  </strong>
                  <span>{formatDate(contribution.contribution_date)}</span>
                  {contribution.note && <span>{contribution.note}</span>}
                </div>
                <div className="jar-list-actions">
                  {contribution.entry_type === "deposit" && (
                    <button
                      type="button"
                      disabled={mutationsDisabled}
                      onClick={() => editContribution(contribution)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={mutationsDisabled}
                    onClick={() => void deleteContribution(contribution)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </main>
  );
}

function ProjectionCopy({ summary }: { summary: JarSummary }) {
  const projection = summary.completion_projection;
  if (projection.status === "projected" && projection.projected_date) {
    return (
      <>
        <strong className="jar-projection-date">{formatDate(projection.projected_date)}</strong>
        <p>
          About {projection.weeks_remaining} {projection.weeks_remaining === 1 ? "week" : "weeks"} away at your current weekly target.
        </p>
        <p className="jar-muted">{formatMoney(projection.remaining_cents)} left to reach your goal.</p>
      </>
    );
  }
  if (projection.status === "complete") {
    return <><strong className="jar-projection-date">Goal reached</strong><p>Your tracked balance has met this goal.</p></>;
  }
  if (projection.status === "paused") {
    return <><strong className="jar-projection-date">Projection paused</strong><p>Resume your plan to calculate a completion date.</p></>;
  }
  if (projection.status === "no_weekly_target") {
    return <><strong className="jar-projection-date">Target needed</strong><p>Set a weekly target to calculate a completion date.</p></>;
  }
  return <><strong className="jar-projection-date">Not available</strong><p>Add essential-expense data or use an amount goal to calculate a date.</p></>;
}

function errorMessage(error: unknown): string {
  if (error instanceof ResilienceJarApiError) {
    const firstFieldError = Object.values(error.body.field_errors)[0];
    return firstFieldError ?? error.body.message;
  }
  return error instanceof Error
    ? error.message
    : "The Resilience Jar could not be updated.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}
