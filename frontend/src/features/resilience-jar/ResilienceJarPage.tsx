import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  HttpResilienceJarApi,
  readCachedSummary,
  type ResilienceJarApi,
} from "./api.ts";
import { ApiError } from "../../lib/api";
import {
  centsToDollars,
  coverageGoalLabel,
  DEFAULT_COVERAGE_GOAL_WEEKS,
  dollarsToCents,
  formatMoney,
  monthlyTargetToWeeklyCents,
  recommendationExplanation,
  singaporeToday,
  weeklyToMonthlyCents,
  weeklyTargetToMonthlyCents,
} from "./model.ts";
import { ProgressLineChart } from "./ProgressLineChart.tsx";
import type {
  Contribution,
  Goal,
  JarSummary,
  RecommendationMethod,
  TargetFrequency,
} from "./types.ts";
import "./resilienceJar.css";

interface ResilienceJarPageProps {
  api?: ResilienceJarApi;
  view?: "jar" | "plan";
  startWithEmergencyUse?: boolean;
  onNavigate?: (path: "/resilience-jar" | "/resilience-jar/plan") => void;
}

export function ResilienceJarPage({
  api,
  view = "jar",
  startWithEmergencyUse = false,
  onNavigate,
}: ResilienceJarPageProps) {
  const client = useMemo(() => api ?? new HttpResilienceJarApi(), [api]);
  const [summary, setSummary] = useState<JarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );
  const [targetAmount, setTargetAmount] = useState("0.00");
  const [targetFrequency, setTargetFrequency] =
    useState<TargetFrequency>("weekly");
  const [goalMode, setGoalMode] = useState<Goal["mode"]>("coverage");
  const [goalAmount, setGoalAmount] = useState("1000.00");
  const [goalWeeks, setGoalWeeks] = useState(String(DEFAULT_COVERAGE_GOAL_WEEKS));
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(singaporeToday());
  const [contributionNote, setContributionNote] = useState("");
  const [withdrawalOpen, setWithdrawalOpen] = useState(startWithEmergencyUse);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState(singaporeToday());
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [editingContributionId, setEditingContributionId] = useState<
    string | null
  >(null);
  const [openingBalanceOpen, setOpeningBalanceOpen] = useState(false);
  const [openingBalanceAmount, setOpeningBalanceAmount] = useState("0.00");
  const activityRef = useRef<HTMLElement>(null);
  const didFocusEmergencyUse = useRef(false);

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
          setError(cached ? null : "No cached emergency fund summary is available offline.");
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

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 4_000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!summary || !startWithEmergencyUse || didFocusEmergencyUse.current) return;
    didFocusEmergencyUse.current = true;
    setWithdrawalOpen(true);
    activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [startWithEmergencyUse, summary]);

  function syncPlanForms(next: JarSummary) {
    setTargetAmount(centsToDollars(next.plan.target_amount_cents));
    setTargetFrequency(next.plan.target_frequency);
    setGoalMode(next.plan.goal.mode);
    if (next.plan.goal.mode === "amount") {
      setGoalAmount(centsToDollars(next.plan.goal.amount_cents));
    } else {
      setGoalWeeks(String(next.plan.goal.weeks));
    }
  }

  function previewTargetFrequency(nextFrequency: TargetFrequency) {
    const enteredCents = dollarsToCents(targetAmount);
    if (enteredCents !== null) {
      const weeklyEquivalent =
        targetFrequency === "monthly"
          ? monthlyTargetToWeeklyCents(enteredCents)
          : enteredCents;
      const nextAmount =
        nextFrequency === "monthly"
          ? weeklyTargetToMonthlyCents(weeklyEquivalent)
          : weeklyEquivalent;
      setTargetAmount(centsToDollars(nextAmount));
    }
    setTargetFrequency(nextFrequency);
  }

  async function updateMethod(method: RecommendationMethod) {
    await runMutation(async () => client.patchPlan({ recommendation_method: method }));
  }

  async function acceptRecommendation() {
    const amount = summary?.recommendation.amount_cents;
    if (amount === null || amount === undefined) return;
    const selectedAmount =
      targetFrequency === "monthly"
        ? weeklyTargetToMonthlyCents(amount)
        : amount;
    await runMutation(
      async () =>
        client.patchPlan({
          target_frequency: targetFrequency,
          target_amount_cents: selectedAmount,
        }),
      `${targetFrequency === "monthly" ? "Monthly" : "Weekly"} target updated to ${formatMoney(selectedAmount)}.`,
    );
  }

  async function saveTarget(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(targetAmount);
    if (cents === null) {
      setError("Enter a target with no more than two decimal places.");
      return;
    }
    await runMutation(
      async () =>
        client.patchPlan({
          target_frequency: targetFrequency,
          target_amount_cents: cents,
        }),
      `${targetFrequency === "monthly" ? "Monthly" : "Weekly"} target updated to ${formatMoney(cents)}.`,
    );
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
    const confirmation =
      goal.mode === "amount"
        ? `Goal updated to ${formatMoney(goal.amount_cents)}.`
        : summary?.weekly_essential_expenses_cents
          ? `Goal updated to ${goal.weeks} weeks of essential expenses (${formatMoney(summary.weekly_essential_expenses_cents * goal.weeks)}).`
          : `Goal updated to ${goal.weeks} weeks of essential expenses.`;
    await runMutation(async () => client.patchPlan({ goal }), confirmation);
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
      setError("The withdrawal cannot exceed your tracked emergency fund balance.");
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

  async function saveOpeningBalance(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(openingBalanceAmount);
    if (cents === null || cents < 0) {
      setError("Enter a starting balance of zero or more, with no more than two decimal places.");
      return;
    }
    await runMutation(
      async () => client.setOpeningBalance(cents),
      `Starting balance set to ${formatMoney(cents)}.`,
    );
    setOpeningBalanceOpen(false);
  }

  function clearContributionForm() {
    setEditingContributionId(null);
    setContributionAmount("");
    setContributionDate(singaporeToday());
    setContributionNote("");
  }

  async function runMutation(
    action: () => Promise<JarSummary>,
    confirmation?: string,
  ) {
    setSuccessMessage(null);
    if (offline) {
      setError("Changes are online-only. Reconnect before updating your emergency fund.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const next = await action();
      setSummary(next);
      syncPlanForms(next);
      window.dispatchEvent(new Event("resilience:emergency-fund-changed"));
      if (confirmation) setSuccessMessage(confirmation);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !summary) {
    return <main className="jar-page jar-state">Loading your emergency fund…</main>;
  }

  if (!summary) {
    return (
      <main className="jar-page jar-state" role="alert">
        <h1>Emergency Fund</h1>
        <p>{error ?? "Your emergency fund could not be loaded."}</p>
      </main>
    );
  }

  const progress = summary.progress;
  const activeTargetLabel =
    summary.plan.target_frequency === "monthly" ? "Monthly target" : "Weekly target";
  const recommendationAmount =
    summary.recommendation.amount_cents === null
      ? null
      : targetFrequency === "monthly"
        ? weeklyTargetToMonthlyCents(summary.recommendation.amount_cents)
        : summary.recommendation.amount_cents;
  const isPaused = summary.plan.status === "paused";
  const mutationsDisabled = saving || offline;
  const goalDescription =
    summary.plan.goal.mode === "coverage"
      ? coverageGoalLabel(summary.plan.goal.weeks)
      : "Your chosen amount";
  const parsedGoalWeeks = Number(goalWeeks);
  const coverageGoalPreview =
    goalMode === "coverage" &&
    Number.isInteger(parsedGoalWeeks) &&
    parsedGoalWeeks >= 1 &&
    parsedGoalWeeks <= 52 &&
    summary.weekly_essential_expenses_cents !== null &&
    summary.weekly_essential_expenses_cents > 0
      ? summary.weekly_essential_expenses_cents * parsedGoalWeeks
      : null;
  const goalNeedsReview = summary.goal_review.status === "expenses_changed";
  const visibleContributions = showAllActivity
    ? summary.contributions
    : summary.contributions.slice(0, 5);
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
    <main className="jar-page page">
      <header className="jar-heading">
        <div>
          <p className="jar-eyebrow eyebrow">
            {view === "jar" ? "Financial safety net" : "Emergency Fund"}
          </p>
          <h1 className="display-lg">{view === "jar" ? "Emergency Fund" : "Emergency fund settings"}</h1>
          <p>
            {view === "jar"
              ? "Build a safety buffer for income disruptions and unexpected costs."
              : "Choose how your contribution target and emergency coverage goal should work."}
          </p>
        </div>
        {view === "jar" ? (
          <div className="jar-heading-actions">
            <button
              className="jar-button button-primary"
              onClick={() => onNavigate?.("/resilience-jar/plan")}
              type="button"
            >
              Edit emergency plan
            </button>
            <button
              className="jar-button jar-button-secondary button-secondary"
              disabled={mutationsDisabled}
              onClick={() => void togglePause()}
              type="button"
            >
              {isPaused ? "Resume reminders" : "Pause reminders"}
            </button>
          </div>
        ) : (
          <button
            className="jar-back-link"
            onClick={() => onNavigate?.("/resilience-jar")}
            type="button"
          >
            <span aria-hidden="true">←</span> Back to fund
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
      {successMessage && (
        <p className="jar-success" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          {successMessage}
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
              <p className="jar-goal-alert-guidance">
                Use “Edit emergency plan” above when you are ready to update the goal.
              </p>
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
        <div className="jar-progress-copy">
          <div className="jar-progress-title-row">
            <p className="jar-eyebrow" id="jar-progress-title">
              Emergency fund
            </p>
            {progress.goal_reached ? (
              <span className="jar-goal-badge jar-goal-badge-reached">
                <span aria-hidden="true">✓</span> Goal reached
              </span>
            ) : (
              <span className="jar-goal-badge">Still building</span>
            )}
          </div>
          <div className="jar-progress-metrics">
            <div>
              <span>Current balance</span>
              <strong>{formatMoney(progress.contribution_total_cents)}</strong>
            </div>
            <div className="jar-goal-amount">
              <span>Goal target</span>
              <strong>{formatMoney(progress.goal_target_cents)}</strong>
              <small>{goalDescription}</small>
            </div>
            <div>
              <span>Still to save</span>
              <strong>
                {progress.goal_reached
                  ? formatMoney(0)
                  : formatMoney(progress.remaining_cents)}
              </strong>
            </div>
            <div>
              <span>Coverage</span>
              <strong>
                {progress.coverage_weeks === null
                  ? "—"
                  : `${progress.coverage_weeks} weeks`}
              </strong>
              <small>
                {progress.coverage_weeks === null
                  ? "Add essential expenses to see this"
                  : "of essential expenses"}
              </small>
            </div>
          </div>
          {progress.coverage_weeks === null ? (
            <p className="jar-muted">
              Add your everyday essentials to see how many weeks this fund covers.
            </p>
          ) : (
            <p>
              This covers about {progress.coverage_weeks}{" "}
              {progress.coverage_weeks === 1 ? "week" : "weeks"} of essential expenses.
            </p>
          )}
          <p className="jar-muted">
            This fund is your baseline buffer for weeks when you cannot work. Money
            you are saving for something specific belongs in Savings.
          </p>
          <div className="jar-plan-strip">
            <div>
              <span>{activeTargetLabel}</span>
              <strong>{formatMoney(summary.plan.target_amount_cents)}</strong>
            </div>
            <div>
              <span>Goal</span>
              <strong>
                {summary.plan.goal.mode === "coverage"
                  ? `${summary.plan.goal.weeks} weeks`
                  : formatMoney(summary.plan.goal.amount_cents)}
              </strong>
            </div>
            <span className="jar-muted">Change this from “Edit emergency plan” above.</span>
          </div>
        </div>
      </section>

      <section className="jar-insights" hidden={view !== "jar"} aria-label="Goal outlook">
        <article className="jar-card card jar-projection">
          <p className="jar-eyebrow">Projected completion</p>
          <ProjectionCopy summary={summary} />
        </article>
      </section>

      <section className="jar-card card jar-chart-card" hidden={view !== "jar"}>
        <ProgressLineChart
          contributions={summary.contributions}
          goalTargetCents={progress.goal_target_cents}
        />
      </section>

      <div className="jar-grid" hidden={view !== "plan"}>
        <section className="jar-card card" aria-labelledby="jar-suggestion-title">
          <h2 id="jar-suggestion-title">Savings suggestion</h2>
          {progress.goal_reached ? (
            <div className="jar-goal-preview" role="status">
              <span>Goal reached</span>
              <strong>{formatMoney(progress.contribution_total_cents)} saved</strong>
              <p className="jar-muted">
                {progress.coverage_weeks === null
                  ? "Your emergency fund has reached its goal. There is nothing left to save toward right now."
                  : `Your emergency fund has reached its goal, covering about ${progress.coverage_weeks} ${
                      progress.coverage_weeks === 1 ? "week" : "weeks"
                    } of essential expenses. There is nothing left to save toward right now.`}
              </p>
              <p className="jar-muted">
                Want to keep building? Raise your goal in “Emergency fund goal” below to set a new target.
              </p>
            </div>
          ) : (
            <>
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
              <fieldset className="jar-target-frequency">
                <legend>Target frequency</legend>
                <div>
                  <label className="jar-radio">
                    <input
                      checked={targetFrequency === "weekly"}
                      name="target-frequency"
                      type="radio"
                      onChange={() => previewTargetFrequency("weekly")}
                    />
                    Weekly
                  </label>
                  <label className="jar-radio">
                    <input
                      checked={targetFrequency === "monthly"}
                      name="target-frequency"
                      type="radio"
                      onChange={() => previewTargetFrequency("monthly")}
                    />
                    Monthly
                  </label>
                </div>
              </fieldset>
              {targetFrequency === "monthly" && (
                <p className="jar-muted">
                  The monthly suggestion is the equivalent of the weekly formula.
                </p>
              )}
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
                  <span>Suggested {targetFrequency} target</span>
                  <strong>{formatMoney(recommendationAmount)}</strong>
                  <button
                    className="jar-button button-primary"
                    type="button"
                    disabled={mutationsDisabled}
                    onClick={() => void acceptRecommendation()}
                  >
                    Use this target
                  </button>
                </div>
              )}

              <form onSubmit={(event) => void saveTarget(event)}>
                <label htmlFor="jar-target-amount">
                  Your {targetFrequency} target (SGD)
                </label>
                <div className="jar-inline-form">
                  <input
                    id="jar-target-amount"
                    inputMode="decimal"
                    maxLength={10}
                    pattern="\d+(\.\d{1,2})?"
                    required
                    title="Enter an amount with up to two decimal places"
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                  />
                  <button className="jar-button button-primary" disabled={mutationsDisabled} type="submit">
                    Save target
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        <section className="jar-card card" aria-labelledby="jar-goal-title">
          <h2 id="jar-goal-title">Emergency fund goal</h2>
          <p className="jar-muted">
            This fund is a baseline buffer, not a savings plan. Most people aim for
            about six months of essential expenses ({DEFAULT_COVERAGE_GOAL_WEEKS} weeks).
            Named goals such as a course or a new phone live in Savings.
          </p>
          {progress.goal_reached && (
            <p role="status">
              You have reached your current goal. Raise it below to keep building your safety net.
            </p>
          )}
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
              <>
                <label>
                  Whole weeks
                  <input
                    type="number"
                    min="1"
                    max="52"
                    placeholder={String(DEFAULT_COVERAGE_GOAL_WEEKS)}
                    required
                    step="1"
                    value={goalWeeks}
                    onChange={(event) => setGoalWeeks(event.target.value)}
                  />
                </label>
                <p className="jar-muted">
                  {DEFAULT_COVERAGE_GOAL_WEEKS} weeks is about six months of essentials.
                </p>
                {coverageGoalPreview !== null && (
                  <p className="jar-goal-preview" aria-live="polite">
                    <span>Goal amount using your latest expenses</span>
                    <strong>{formatMoney(coverageGoalPreview)}</strong>
                  </p>
                )}
              </>
            ) : (
              <label>
                Goal amount (SGD)
                <input
                  inputMode="decimal"
                  maxLength={10}
                  pattern="\d+(\.\d{1,2})?"
                  required
                  title="Enter an amount with up to two decimal places"
                  value={goalAmount}
                  onChange={(event) => setGoalAmount(event.target.value)}
                />
              </label>
            )}
            <button className="jar-button button-primary" disabled={mutationsDisabled} type="submit">
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
        ref={activityRef}
        className="jar-card card jar-contributions"
        aria-labelledby="jar-contributions-title"
        hidden={view !== "jar"}
      >
        <div className="jar-contribution-heading">
          <div>
            <h2 id="jar-contributions-title">Emergency fund activity</h2>
            <p className="jar-disclaimer">
              Add money saved or record emergency money used. Resilience tracks these records but never moves money.
            </p>
          </div>
          <button
            className="jar-button jar-button-withdraw button-secondary"
            disabled={mutationsDisabled || progress.contribution_total_cents <= 0}
            onClick={() => setWithdrawalOpen((open) => !open)}
            type="button"
          >
            {withdrawalOpen ? "Cancel emergency use" : "Record emergency use"}
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
                  maxLength={10}
                  pattern="\d+(\.\d{1,2})?"
                  title="Enter an amount with up to two decimal places"
                value={withdrawalAmount}
                onChange={(event) => setWithdrawalAmount(event.target.value)}
              />
            </label>
            <label>
              Date
              <input
                  required
                  type="date"
                  min="2000-01-01"
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
            <button className="jar-button jar-button-withdraw button-secondary" disabled={mutationsDisabled} type="submit">
              Record emergency use
            </button>
          </form>
        )}

        <div>
          <h3>Add contribution</h3>
          <p className="jar-disclaimer">
            Only contributions recorded in this fund are counted. Other savings remain separate.
          </p>
        </div>
        <form className="jar-contribution-form" onSubmit={(event) => void saveContribution(event)}>
          <label>
            Amount (SGD)
              <input
                required
                inputMode="decimal"
                maxLength={10}
                pattern="\d+(\.\d{1,2})?"
                title="Enter an amount with up to two decimal places"
              value={contributionAmount}
              onChange={(event) => setContributionAmount(event.target.value)}
            />
          </label>
          <label>
            Date
              <input
                required
                type="date"
                min="2000-01-01"
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
            <button className="jar-button button-primary" disabled={mutationsDisabled} type="submit">
              {editingContributionId ? "Save changes" : "Add contribution"}
            </button>
            {editingContributionId && (
              <button
                className="jar-button jar-button-secondary button-secondary"
                type="button"
                onClick={clearContributionForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {summary.contributions.length === 0 ? (
          <p className="jar-empty">No contributions yet. Start building your emergency fund with any positive amount.</p>
        ) : (
          <>
            <ul className="jar-contribution-list">
              {visibleContributions.map((contribution) => (
                <li className={`jar-entry jar-entry-${contribution.entry_type}`} key={contribution.id}>
                  <details>
                    <summary>
                      <span className="jar-entry-type">
                        {contribution.entry_type === "withdrawal" ? "Used" : "Added"}
                      </span>
                      <strong>
                        {contribution.entry_type === "withdrawal" ? "−" : "+"}
                        {formatMoney(contribution.amount_cents)}
                      </strong>
                      <span>{formatDate(contribution.contribution_date)}</span>
                      <span className="jar-entry-open">Details</span>
                    </summary>
                    <div className="jar-entry-details">
                      <p>{contribution.note || "No note added."}</p>
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
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            {summary.contributions.length > 5 && (
              <button className="jar-text-link" type="button" onClick={() => setShowAllActivity((shown) => !shown)}>
                {showAllActivity ? "Show recent activity only" : `Show all ${summary.contributions.length} records`}
              </button>
            )}
          </>
        )}

        <div className="jar-opening-balance">
          <button
            className="jar-text-link"
            type="button"
            aria-expanded={openingBalanceOpen}
            aria-controls="jar-opening-balance-panel"
            onClick={() => setOpeningBalanceOpen((open) => !open)}
          >
            {openingBalanceOpen ? "Cancel correcting starting balance" : "Correct starting balance"}
          </button>
          {openingBalanceOpen && (
            <div id="jar-opening-balance-panel">
              <p className="jar-muted">
                This sets the amount that was already in the fund before you started
                tracking it here. Your recorded contributions and emergency-use entries
                stay exactly as they are.
              </p>
              <form
                className="jar-opening-balance-form"
                onSubmit={(event) => void saveOpeningBalance(event)}
              >
                <label>
                  Starting balance (SGD)
                  <input
                    autoFocus
                    inputMode="decimal"
                    maxLength={10}
                    pattern="\d+(\.\d{1,2})?"
                    required
                    title="Enter an amount with up to two decimal places"
                    value={openingBalanceAmount}
                    onChange={(event) => setOpeningBalanceAmount(event.target.value)}
                  />
                </label>
                <button className="jar-button button-primary" disabled={mutationsDisabled} type="submit">
                  Save starting balance
                </button>
              </form>
            </div>
          )}
        </div>
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
          About {projection.weeks_remaining} {projection.weeks_remaining === 1 ? "week" : "weeks"} away at your current {summary.plan.target_frequency} target.
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
    return <><strong className="jar-projection-date">Target needed</strong><p>Set a weekly or monthly target to calculate a completion date.</p></>;
  }
  return <><strong className="jar-projection-date">Not available</strong><p>Add essential-expense data or use an amount goal to calculate a date.</p></>;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.fieldErrors?.[0]?.message ?? error.message;
  }
  return error instanceof Error
    ? error.message
    : "The emergency fund could not be updated.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00+08:00`),
  );
}
