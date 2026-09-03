/**
 * Savings screen.
 *
 * The emergency fund is pinned, read-only, at the top: it is the baseline, and
 * seeing it while adding a goal keeps the two ledgers from blurring together.
 * Everything below it is habit building — named goals the user tops up.
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { HttpSavingsApi, type SavingsApi } from "./api";
import type { SavingsGoal } from "./types";
import { HttpResilienceJarApi, type ResilienceJarApi } from "../resilience-jar/api";
import { coverageGoalLabel, singaporeToday } from "../resilience-jar/model";
import type { JarSummary } from "../resilience-jar/types";
import { ApiError } from "../../lib/api";
import { formatMoney, parseMoneyToCents } from "../../lib/money";

export interface SavingsPageProps {
  api?: SavingsApi;
  jarApi?: ResilienceJarApi;
}

export function SavingsPage({ api, jarApi }: SavingsPageProps) {
  const client = useMemo(() => api ?? new HttpSavingsApi(), [api]);
  const jarClient = useMemo(() => jarApi ?? new HttpResilienceJarApi(), [jarApi]);

  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);
  const [fund, setFund] = useState<JarSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const loadGoals = useCallback(async () => {
    setGoals(await client.listGoals());
  }, [client]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await client.listGoals();
        if (active) setGoals(next);
      } catch (cause) {
        if (active) {
          setGoals([]);
          setError(errorMessage(cause));
        }
      }
    })();
    void jarClient
      .getSummary()
      .then((summary) => {
        if (active) setFund(summary);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [client, jarClient]);

  /** Every mutation ends by reloading the list, so totals always come from the API. */
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await loadGoals();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function createGoal(event: FormEvent) {
    event.preventDefault();
    let targetCents: number;
    try {
      targetCents = parseMoneyToCents(targetAmount);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enter a valid amount.");
      return;
    }
    if (!name.trim()) {
      setError("Give this goal a name.");
      return;
    }
    if (targetCents <= 0) {
      setError("Enter a target greater than zero.");
      return;
    }
    await run(async () => {
      await client.createGoal({
        name: name.trim(),
        targetCents,
        targetDate: targetDate || null,
      });
      setName("");
      setTargetAmount("");
      setTargetDate("");
    });
  }

  return (
    <main>
      <p className="eyebrow">Savings</p>
      <h1 className="mt-2 text-3xl font-black">Build the habit</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Your emergency fund is the baseline that keeps a bad week from becoming a
        bad year. These goals sit on top of it and build a saving habit.
      </p>

      <FundOverview summary={fund} />

      {error && (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
          {error}
        </p>
      )}

      <section className="mt-6" aria-labelledby="savings-goals-title">
        <h2 className="text-2xl font-bold" id="savings-goals-title">
          Your savings goals
        </h2>

        <form className="card mt-4 space-y-4" onSubmit={(event) => void createGoal(event)}>
          <h3 className="text-lg font-bold">Add a goal</h3>
          <label className="block">
            <span className="label">What are you saving for?</span>
            <input
              maxLength={80}
              placeholder="e.g. New phone"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Target amount (SGD)</span>
            <input
              inputMode="decimal"
              maxLength={10}
              pattern="\d+(\.\d{0,2})?"
              placeholder="0.00"
              required
              title="Enter an amount with up to two decimal places"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">
              Target date <span className="text-slate-400">(optional)</span>
            </span>
            <input
              min={singaporeToday()}
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </label>
          <button className="button-primary w-full" disabled={busy} type="submit">
            Add goal
          </button>
        </form>

        {goals === null ? (
          <p className="card mt-4 text-slate-600" role="status">
            Loading your goals…
          </p>
        ) : goals.length === 0 ? (
          <p className="card mt-4 text-slate-600">
            No savings goals yet. Add one above — even a small target counts.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {goals.map((goal) => (
              <li key={goal.id}>
                <GoalCard
                  busy={busy}
                  goal={goal}
                  onAddContribution={(payload) =>
                    run(async () => {
                      await client.addContribution(goal.id, payload);
                    })
                  }
                  onDeleteContribution={(contributionId) =>
                    run(async () => {
                      await client.deleteContribution(goal.id, contributionId);
                    })
                  }
                  onDelete={() =>
                    run(async () => {
                      await client.deleteGoal(goal.id);
                    })
                  }
                  onStatus={(status) =>
                    run(async () => {
                      await client.updateGoal(goal.id, { status });
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/** Read-only. The fund is managed on its own screen; this is context, not a control. */
function FundOverview({ summary }: { summary: JarSummary | null }) {
  return (
    <section className="card mt-6 border-t-4 border-t-indigo-600" aria-labelledby="savings-fund-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Your baseline</p>
          <h2 className="mt-1 text-2xl font-bold" id="savings-fund-title">
            Emergency fund
          </h2>
        </div>
        <Link className="button-secondary" to="/resilience-jar">
          Manage emergency fund
        </Link>
      </div>
      {summary === null ? (
        <p className="mt-3 text-sm text-slate-600" role="status">
          Loading your emergency fund…
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-semibold text-slate-500">Balance</dt>
              <dd className="mt-1 text-2xl font-black">
                {formatMoney(summary.progress.contribution_total_cents)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Target</dt>
              <dd className="mt-1 text-2xl font-black">
                {summary.progress.goal_target_cents === null
                  ? "—"
                  : formatMoney(summary.progress.goal_target_cents)}
              </dd>
              <dd className="mt-1 text-xs text-slate-500">
                {summary.plan.goal.mode === "coverage"
                  ? coverageGoalLabel(summary.plan.goal.weeks)
                  : "Your chosen amount"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-slate-600">
            {summary.progress.goal_reached ? (
              <span className="mr-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                Goal reached
              </span>
            ) : null}
            {summary.progress.coverage_weeks === null
              ? "Add your everyday essentials to see how many weeks this covers."
              : `Covers about ${summary.progress.coverage_weeks} ${
                  summary.progress.coverage_weeks === 1 ? "week" : "weeks"
                } of essential expenses.`}
          </p>
        </>
      )}
    </section>
  );
}

interface GoalCardProps {
  goal: SavingsGoal;
  busy: boolean;
  onAddContribution: (payload: {
    amountCents: number;
    contributedOn: string;
    note?: string | null;
  }) => Promise<void>;
  onDeleteContribution: (contributionId: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onStatus: (status: SavingsGoal["status"]) => Promise<void>;
}

function GoalCard({
  goal,
  busy,
  onAddContribution,
  onDeleteContribution,
  onDelete,
  onStatus,
}: GoalCardProps) {
  const [amount, setAmount] = useState("");
  const [contributedOn, setContributedOn] = useState(singaporeToday());
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    let amountCents: number;
    try {
      amountCents = parseMoneyToCents(amount);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Enter a valid amount.");
      return;
    }
    if (amountCents <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    await onAddContribution({
      amountCents,
      contributedOn,
      note: note.trim() || null,
    });
    setAmount("");
    setContributedOn(singaporeToday());
    setNote("");
  }

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{goal.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {formatMoney(goal.savedCents)} saved of {formatMoney(goal.targetCents)}
            {goal.targetDate ? ` · by ${goal.targetDate}` : ""}
          </p>
        </div>
        {goal.reached ? (
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
            Reached
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {formatMoney(goal.remainingCents)} to go
          </span>
        )}
      </div>

      {goal.status !== "active" && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {goal.status === "completed" ? "Completed" : "Archived"}
        </p>
      )}

      {goal.suggestedWeeklyCents !== null && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          Put aside about <strong>{formatMoney(goal.suggestedWeeklyCents)}</strong> a
          week to reach this by {goal.targetDate}.
        </p>
      )}

      <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(event) => void submit(event)}>
        <label className="block">
          <span className="label">Amount (SGD)</span>
          <input
            inputMode="decimal"
            maxLength={10}
            pattern="\d+(\.\d{0,2})?"
            placeholder="0.00"
            required
            title="Enter an amount with up to two decimal places"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Date</span>
          <input
            max={singaporeToday()}
            min="2000-01-01"
            required
            type="date"
            value={contributedOn}
            onChange={(event) => setContributedOn(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">
            Note <span className="text-slate-400">(optional)</span>
          </span>
          <input
            maxLength={200}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button className="button-primary sm:col-span-3" disabled={busy} type="submit">
          Add to this goal
        </button>
      </form>
      {formError && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {formError}
        </p>
      )}

      {goal.contributions.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {goal.contributions.length} contribution
            {goal.contributions.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 divide-y divide-slate-100">
            {goal.contributions.map((contribution) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                key={contribution.id}
              >
                <span>
                  {contribution.contributedOn}
                  {contribution.note ? ` · ${contribution.note}` : ""}
                </span>
                <span className="flex items-center gap-3">
                  <strong className="text-emerald-700">
                    +{formatMoney(contribution.amountCents)}
                  </strong>
                  <button
                    className="text-rose-700 underline"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete the ${formatMoney(contribution.amountCents)} contribution?`,
                        )
                      ) {
                        void onDeleteContribution(contribution.id);
                      }
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {goal.status !== "completed" && (
          <button
            className="button-secondary"
            disabled={busy}
            onClick={() => void onStatus("completed")}
            type="button"
          >
            Mark complete
          </button>
        )}
        {goal.status !== "archived" && (
          <button
            className="button-secondary"
            disabled={busy}
            onClick={() => void onStatus("archived")}
            type="button"
          >
            Archive
          </button>
        )}
        {goal.status !== "active" && (
          <button
            className="button-secondary"
            disabled={busy}
            onClick={() => void onStatus("active")}
            type="button"
          >
            Reopen
          </button>
        )}
        <button
          className="button-secondary text-rose-700"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Delete “${goal.name}” and its contribution history?`)) {
              void onDelete();
            }
          }}
          type="button"
        >
          Delete goal
        </button>
      </div>
    </article>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.fieldErrors?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Your savings goals could not be loaded.";
}
