/**
 * Savings screen.
 *
 * Named goals the user tops up on top of their emergency fund. This screen
 * follows the same "jar-card" visual language as the Emergency Fund tab
 * (see resilience-jar/sharedCard.css) so the two read as one product: a form
 * behind a clear primary action, and goals as compact rows that expand into
 * full detail only when the user asks for it.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { HttpSavingsApi, type SavingsApi } from "./api";
import type { ResilienceJarApi } from "../resilience-jar/api";
import type { SavingsGoal } from "./types";
import { singaporeToday } from "../resilience-jar/model";
import { ApiError } from "../../lib/api";
import { centsToInput, formatMoney, parseMoneyToCents } from "../../lib/money";
import { SavingsGoalChart } from "./SavingsGoalChart";
import "../resilience-jar/sharedCard.css";
import "./savings.css";

export interface SavingsPageProps {
  api?: SavingsApi;
  jarApi?: ResilienceJarApi;
}

export function SavingsPage({ api }: SavingsPageProps) {
  const client = useMemo(() => api ?? new HttpSavingsApi(), [api]);

  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const nameFieldRef = useRef<HTMLInputElement>(null);

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
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (addFormOpen) nameFieldRef.current?.focus();
  }, [addFormOpen]);

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

  function openAddForm() {
    setError(null);
    setAddFormOpen(true);
  }

  function closeAddForm() {
    setAddFormOpen(false);
    setName("");
    setTargetAmount("");
    setTargetDate("");
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
      closeAddForm();
    });
  }

  return (
    <main className="jar-page page">
      <header className="jar-heading">
        <div>
          <p className="jar-eyebrow eyebrow">Savings</p>
          <h1 className="display-lg">Build the habit</h1>
          <p>
            Your emergency fund is the baseline that keeps a bad week from becoming a
            bad year. These goals sit on top of it and build a saving habit.
          </p>
        </div>
      </header>

      {error && (
        <p className="jar-error" role="alert">
          {error}
        </p>
      )}

      <section aria-labelledby="savings-goals-title">
        <div className="jar-contribution-heading">
          <div>
            <h2 id="savings-goals-title">Your savings goals</h2>
            <p className="jar-disclaimer">
              A goal is something specific you are saving for — a course, a phone, a
              trip. Your emergency fund stays separate and is managed on its own tab.
            </p>
          </div>
          {!addFormOpen && (
            <button className="jar-button button-primary" type="button" onClick={openAddForm}>
              Add a savings goal
            </button>
          )}
        </div>

        {addFormOpen && (
          <form className="jar-card card savings-add-form" onSubmit={(event) => void createGoal(event)}>
            <h3>New savings goal</h3>
            <label>
              What are you saving for?
              <input
                ref={nameFieldRef}
                maxLength={80}
                placeholder="e.g. New phone"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              Target amount (SGD)
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
            <label>
              Target date <span className="jar-muted">(optional)</span>
              <input
                min={singaporeToday()}
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </label>
            <div className="jar-form-actions">
              <button className="jar-button button-primary" disabled={busy} type="submit">
                Add goal
              </button>
              <button
                className="jar-button jar-button-secondary button-secondary"
                disabled={busy}
                type="button"
                onClick={closeAddForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {goals === null ? (
          <p className="jar-card card jar-state" role="status">
            Loading your goals…
          </p>
        ) : goals.length === 0 ? (
          <p className="jar-card card jar-empty">
            No savings goals yet. Add one above — even a small target counts.
          </p>
        ) : (
          <ul className="jar-card card jar-disclosure-list savings-goal-list">
            {goals.map((goal) => (
              <GoalRow
                key={goal.id}
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
                onUpdateDetails={(patch) =>
                  run(async () => {
                    await client.updateGoal(goal.id, patch);
                  })
                }
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

interface GoalRowProps {
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
  onUpdateDetails: (patch: {
    name?: string;
    targetCents?: number;
    targetDate?: string | null;
  }) => Promise<void>;
}

const STATUS_LABEL: Record<SavingsGoal["status"], string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

function GoalRow({
  goal,
  busy,
  onAddContribution,
  onDeleteContribution,
  onDelete,
  onStatus,
  onUpdateDetails,
}: GoalRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(centsToInput(goal.targetCents));
  const [editDate, setEditDate] = useState(goal.targetDate ?? "");
  const [editError, setEditError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [contributedOn, setContributedOn] = useState(singaporeToday());
  const [note, setNote] = useState("");
  const [contributionError, setContributionError] = useState<string | null>(null);

  const triggerId = `savings-goal-trigger-${goal.id}`;
  const panelId = `savings-goal-panel-${goal.id}`;

  function openEdit() {
    setEditName(goal.name);
    setEditTarget(centsToInput(goal.targetCents));
    setEditDate(goal.targetDate ?? "");
    setEditError(null);
    setEditOpen(true);
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    setEditError(null);
    let targetCents: number;
    try {
      targetCents = parseMoneyToCents(editTarget);
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : "Enter a valid amount.");
      return;
    }
    if (!editName.trim()) {
      setEditError("Give this goal a name.");
      return;
    }
    if (targetCents <= 0) {
      setEditError("Enter a target greater than zero.");
      return;
    }
    await onUpdateDetails({
      name: editName.trim(),
      targetCents,
      targetDate: editDate || null,
    });
    setEditOpen(false);
  }

  async function submitContribution(event: FormEvent) {
    event.preventDefault();
    setContributionError(null);
    let amountCents: number;
    try {
      amountCents = parseMoneyToCents(amount);
    } catch (cause) {
      setContributionError(cause instanceof Error ? cause.message : "Enter a valid amount.");
      return;
    }
    if (amountCents <= 0) {
      setContributionError("Enter an amount greater than zero.");
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
    <li className="jar-disclosure-item">
      <button
        id={triggerId}
        type="button"
        className="jar-disclosure-trigger savings-goal-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="savings-goal-name">
          <strong>{goal.name}</strong>
          {goal.status !== "active" && (
            <span className="jar-muted"> · {STATUS_LABEL[goal.status]}</span>
          )}
        </span>
        <span className="savings-goal-progress">
          {formatMoney(goal.savedCents)} saved of {formatMoney(goal.targetCents)}
        </span>
        <span className="savings-goal-trailing">
          {goal.reached ? (
            <span className="jar-goal-badge jar-goal-badge-reached">
              <span aria-hidden="true">✓</span> Reached
            </span>
          ) : (
            <span className="jar-goal-badge">{formatMoney(goal.remainingCents)} to go</span>
          )}
          <span className="jar-disclosure-open" aria-hidden="true">
            {expanded ? "Hide" : "Details"}
          </span>
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="jar-disclosure-panel"
        hidden={!expanded}
      >
          {goal.targetDate && <p className="jar-muted">Target date: {goal.targetDate}</p>}

          {goal.suggestedWeeklyCents !== null && (
            <p className="jar-disclaimer">
              Put aside about <strong>{formatMoney(goal.suggestedWeeklyCents)}</strong> a
              week to reach this by {goal.targetDate}.
            </p>
          )}

          <SavingsGoalChart
            goalName={goal.name}
            contributions={goal.contributions}
            targetCents={goal.targetCents}
            targetDate={goal.targetDate}
          />

          {editOpen ? (
            <form className="savings-edit-form" onSubmit={(event) => void submitEdit(event)}>
              <label>
                Name
                <input
                  maxLength={80}
                  required
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </label>
              <label>
                Target amount (SGD)
                <input
                  inputMode="decimal"
                  maxLength={10}
                  pattern="\d+(\.\d{0,2})?"
                  required
                  title="Enter an amount with up to two decimal places"
                  value={editTarget}
                  onChange={(event) => setEditTarget(event.target.value)}
                />
              </label>
              <label>
                Target date <span className="jar-muted">(optional)</span>
                <input
                  min={singaporeToday()}
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                />
              </label>
              {editError && (
                <p className="jar-error" role="alert">
                  {editError}
                </p>
              )}
              <div className="jar-form-actions">
                <button className="jar-button button-primary" disabled={busy} type="submit">
                  Save changes
                </button>
                <button
                  className="jar-button jar-button-secondary button-secondary"
                  disabled={busy}
                  type="button"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button className="jar-text-link savings-edit-link" disabled={busy} type="button" onClick={openEdit}>
              Rename or change target
            </button>
          )}

          <form className="jar-contribution-form" onSubmit={(event) => void submitContribution(event)}>
            <label>
              Amount (SGD)
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
            <label>
              Date
              <input
                max={singaporeToday()}
                min="2000-01-01"
                required
                type="date"
                value={contributedOn}
                onChange={(event) => setContributedOn(event.target.value)}
              />
            </label>
            <label>
              Note <span className="jar-muted">(optional)</span>
              <input
                maxLength={200}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <button className="jar-button button-primary" disabled={busy} type="submit">
              Add to this goal
            </button>
          </form>
          {contributionError && (
            <p className="jar-error" role="alert">
              {contributionError}
            </p>
          )}

          {goal.contributions.length > 0 && (
            <div>
              <h4>
                {goal.contributions.length} contribution
                {goal.contributions.length === 1 ? "" : "s"}
              </h4>
              <ul className="savings-contribution-history">
                {goal.contributions.map((contribution) => (
                  <li key={contribution.id}>
                    <span>
                      {contribution.contributedOn}
                      {contribution.note ? ` · ${contribution.note}` : ""}
                    </span>
                    <span className="savings-contribution-amount">
                      <strong>+{formatMoney(contribution.amountCents)}</strong>
                      <button
                        className="jar-text-link"
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
            </div>
          )}

          <div className="jar-list-actions">
            {goal.status !== "completed" && (
              <button
                className="jar-button jar-button-secondary button-secondary"
                disabled={busy}
                onClick={() => void onStatus("completed")}
                type="button"
              >
                Mark complete
              </button>
            )}
            {goal.status !== "archived" && (
              <button
                className="jar-button jar-button-secondary button-secondary"
                disabled={busy}
                onClick={() => void onStatus("archived")}
                type="button"
              >
                Archive
              </button>
            )}
            {goal.status !== "active" && (
              <button
                className="jar-button jar-button-secondary button-secondary"
                disabled={busy}
                onClick={() => void onStatus("active")}
                type="button"
              >
                Reopen
              </button>
            )}
            <button
              className="jar-button jar-button-secondary button-secondary savings-delete-goal"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Delete "${goal.name}" and its contribution history?`)) {
                  void onDelete();
                }
              }}
              type="button"
            >
              Delete goal
            </button>
          </div>
      </div>
    </li>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.fieldErrors?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Your savings goals could not be loaded.";
}
