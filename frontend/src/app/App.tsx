import { lazy, Suspense, type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { MoneyRows, type EditableMoneyRow } from "../components/MoneyRows";
import { useFoundation } from "../features/foundation-input/FoundationContext";
import { AuthPage } from "../features/auth/AuthPage";
import { useAuth } from "../features/auth/AuthContext";
import { adaptTransactions, weeklyNormalisedTotal } from "../features/income-reality/foundationAdapter";
import { CurrentWeekCard } from "../features/home/CurrentWeekCard";
import { FinancialScoreCard } from "../features/home/FinancialScoreCard";
import { KeyFigures } from "../features/home/KeyFigures";
import { WeeklyTrendChart } from "../features/home/WeeklyTrendChart";
import { LandingPage } from "../features/landing/LandingPage";
import { SyncStatus } from "./SyncStatus";
import { HttpResilienceJarApi } from "../features/resilience-jar/api";
import type { JarSummary } from "../features/resilience-jar/types";
import { buildFoundationBaseline } from "../features/scenario-simulator/foundationBaseline";
import { ChatProvider } from "../features/scheme-navigator/ChatContext";
import { ChatWidget } from "../features/scheme-navigator/ChatWidget";
import { apiRequest } from "../lib/api";
import { centsToInput, formatMoney, parseMoneyToCents } from "../lib/money";
import type { EssentialExpense, RecurringWorkCost } from "../types/foundation";
import "./app.css";

const IncomeRealityPage = lazy(() =>
  import("../features/income-reality/IncomeRealityPage").then((module) => ({ default: module.IncomeRealityPage })),
);
const ResilienceJarPage = lazy(() =>
  import("../features/resilience-jar/ResilienceJarPage").then((module) => ({ default: module.ResilienceJarPage })),
);
const ScenarioSimulatorPage = lazy(() =>
  import("../features/scenario-simulator/ScenarioSimulatorPage").then((module) => ({ default: module.ScenarioSimulatorPage })),
);
const SchemeNavigator = lazy(() =>
  import("../features/scheme-navigator/SchemeNavigator").then((module) => ({ default: module.SchemeNavigator })),
);
const SavingsPage = lazy(() =>
  import("../features/savings/SavingsPage").then((module) => ({ default: module.SavingsPage })),
);

function FeatureLoader() {
  return <div className="card body-text" role="status">Loading this section…</div>;
}

const WORK_CATEGORIES = [
  ["vehicle_rental", "Vehicle rental"], ["insurance", "Insurance"], ["subscription", "Subscription"],
  ["equipment", "Equipment"], ["other", "Other"]
].map(([value, label]) => ({ value, label }));
const ESSENTIAL_CATEGORIES = [
  ["housing", "Housing"], ["food", "Food"], ["transport", "Transport"], ["utilities", "Utilities"],
  ["healthcare", "Healthcare"], ["caregiving", "Caregiving"], ["debt", "Debt"], ["other", "Other"]
].map(([value, label]) => ({ value, label }));

interface OnboardingDraft {
  version: 1;
  emergency: string;
  recurring: EditableMoneyRow[];
  essentials: EditableMoneyRow[];
}

const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  version: 1,
  emergency: "0.00",
  recurring: [],
  essentials: []
};

function readOnboardingDraft(): OnboardingDraft {
  try {
    const stored = localStorage.getItem("resilience-onboarding-draft");
    if (!stored) return EMPTY_ONBOARDING_DRAFT;
    const parsed = JSON.parse(stored) as Partial<OnboardingDraft>;
    if (
      parsed.version !== 1 ||
      typeof parsed.emergency !== "string" ||
      !Array.isArray(parsed.recurring) ||
      !Array.isArray(parsed.essentials)
    ) return EMPTY_ONBOARDING_DRAFT;
    return parsed as OnboardingDraft;
  } catch {
    return EMPTY_ONBOARDING_DRAFT;
  }
}

function toEditable(items: Array<{ id: string; category: string; label: string; amountCents: number; cadence?: "weekly" | "monthly" }>): EditableMoneyRow[] {
  return items.map((item) => ({ ...item, amount: centsToInput(item.amountCents) }));
}

function parseRows(rows: EditableMoneyRow[], requireLabel = true, requirePositive = false) {
  return rows.map((row) => {
    if (requireLabel && !row.label.trim()) throw new Error("Every item needs a description.");
    const amountCents = parseMoneyToCents(row.amount);
    if (requirePositive && amountCents === 0) throw new Error("Recurring and essential amounts must be greater than zero.");
    return { ...row, label: row.label.trim(), amountCents };
  });
}

const NAV_STORAGE_KEY = "resilience.nav.open";
const DESKTOP_QUERY = "(min-width: 1024px)";

function isDesktopViewport(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DESKTOP_QUERY).matches
    : false;
}

/** Defaults to open on desktop and closed on mobile until the user chooses. */
function readNavOpen(): boolean {
  try {
    const stored = localStorage.getItem(NAV_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // Storage can be unavailable (private mode); fall back to the viewport default.
  }
  return isDesktopViewport();
}

function writeNavOpen(open: boolean): void {
  try {
    localStorage.setItem(NAV_STORAGE_KEY, String(open));
  } catch {
    // A rejected write only costs the remembered preference.
  }
}

const NAV_LINKS: Array<[string, string]> = [
  ["/", "Home"],
  ["/transactions", "Transactions"],
  ["/income-reality", "Income overview"],
  ["/resilience-jar", "Emergency fund"],
  ["/savings", "Savings"],
  ["/scenario-simulator", "Setback planner"],
  ["/scheme-navigator", "Schemes"],
  ["/profile", "Profile"]
];

function Shell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(readNavOpen);
  const { signOut, user } = useAuth();

  const setOpen = (open: boolean) => {
    setNavOpen(open);
    writeNavOpen(open);
  };
  // On a phone the nav is an overlay, so following a link must dismiss it.
  // On desktop it is a persistent column and stays exactly as the user left it.
  const handleNavigate = () => {
    if (!isDesktopViewport()) setOpen(false);
  };

  return (
    <div className="resilience-app min-h-screen">
      <header className="app-topbar">
        <button
          aria-controls="primary-navigation"
          aria-expanded={navOpen}
          aria-label={navOpen ? "Close menu" : "Menu"}
          className={`nav-toggle${navOpen ? " nav-toggle-open" : ""}`}
          onClick={() => setOpen(!navOpen)}
          type="button"
        >
          <svg aria-hidden="true" focusable="false" height="24" viewBox="0 0 24 24" width="24">
            <line className="nav-toggle-line nav-toggle-line-top" x1="4" x2="20" y1="7" y2="7" />
            <line className="nav-toggle-line nav-toggle-line-middle" x1="4" x2="20" y1="12" y2="12" />
            <line className="nav-toggle-line nav-toggle-line-bottom" x1="4" x2="20" y1="17" y2="17" />
          </svg>
        </button>
        <Link className="site-brand" onClick={handleNavigate} to="/">
          <img alt="" src="/resilience-icon.svg" />
          <div>
            <strong className="block text-base">Resilience</strong>
            <span>{user?.email ?? "Your private space"}</span>
          </div>
        </Link>
      </header>
      <aside
        aria-label="Primary navigation"
        className={`side-nav ${navOpen ? "side-nav-open" : ""}`}
        id="primary-navigation"
        inert={!navOpen || undefined}
      >
        <nav>
          {NAV_LINKS.map(([to, label]) => (
            <NavLink end={to === "/"} key={to} onClick={handleNavigate} to={to}>{label}</NavLink>
          ))}
        </nav>
        <button className="button-secondary mt-auto" onClick={() => void signOut()} type="button">Log out</button>
      </aside>
      <main className={`app-main${navOpen ? " app-main-shifted" : ""} page pb-8`}>{children}</main>
      <SyncStatus navOpen={navOpen} />
    </div>
  );
}

function EmergencyFund({ view }: { view: "jar" | "plan" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <Shell>
      <Suspense fallback={<FeatureLoader />}>
        <ResilienceJarPage
          view={view}
          startWithEmergencyUse={searchParams.get("action") === "emergency-use"}
          onNavigate={(path) => navigate(path)}
        />
      </Suspense>
    </Shell>
  );
}

/**
 * The Setback planner runs on the user's own figures whenever they have any
 * transactions; otherwise it keeps the labelled example data.
 */
function SetbackPlanner() {
  const { data } = useFoundation();
  const baseline = useMemo(
    () =>
      buildFoundationBaseline({
        transactions: data.transactions ?? [],
        recurringWorkCosts: data.recurringWorkCosts,
        essentialExpenses: data.essentialExpenses,
        emergencyFundBalanceCents: data.profile.emergencyFundBalanceCents,
      }) ?? undefined,
    [data.transactions, data.recurringWorkCosts, data.essentialExpenses, data.profile.emergencyFundBalanceCents],
  );
  return (
    <Shell>
      <Suspense fallback={<FeatureLoader />}>
        <ScenarioSimulatorPage baseline={baseline} />
      </Suspense>
    </Shell>
  );
}

function IncomeReality() {
  const { data, online } = useFoundation();
  const [fundSummary, setFundSummary] = useState<JarSummary | null>(null);
  const adapted = useMemo(
    () => adaptTransactions(data.transactions, data.recurringWorkCosts, data.essentialExpenses),
    [data.transactions, data.recurringWorkCosts, data.essentialExpenses],
  );
  useEffect(() => {
    if (!online) return;
    let active = true;
    void new HttpResilienceJarApi().getSummary().then((summary) => { if (active) setFundSummary(summary); }).catch(() => undefined);
    return () => { active = false; };
  }, [online, data.profile.emergencyFundBalanceCents]);

  return (
    <Shell>
      <p className="eyebrow">Income overview</p>
      <h1 className="mt-2 display-hero" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>See where each week's money went</h1>
      <p className="mt-3 body-text prose">
        Each Monday–Sunday overview is calculated from the income and costs you recorded, so it works even when work is irregular.
      </p>
      {adapted.missingExpenseSnapshotCount > 0 ? (
        <p className="mt-6 card body-text prose" role="status">
          {adapted.missingExpenseSnapshotCount} confirmed week
          {adapted.missingExpenseSnapshotCount === 1 ? " has" : "s have"} no saved expense
          snapshot. Those weeks show only their recorded variable costs.
        </p>
      ) : null}
      {adapted.weeks.length > 0 && adapted.weeks.every((week) => week.recorded_cpf_cents != null) ? (
        <p className="mt-6 card body-text prose" role="status">
          Every recorded week already includes CPF/MediSave. Those actual amounts take priority, so
          the estimator will apply only after you add a week without a CPF cost.
        </p>
      ) : null}
      {!online ? (
        <div className="card mt-6 body-text prose">
          Reconnect to calculate Income Reality. Your saved weekly entries remain available on
          this device.
        </div>
      ) : (
        <Suspense fallback={<FeatureLoader />}><IncomeRealityPage weeks={adapted.weeks} /></Suspense>
      )}
      {fundSummary && (
        <section className="card mt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Emergency fund activity</p>
              <h2 className="mt-2 display-lg" style={{ fontSize: "22px" }}>Current balance: {formatMoney(fundSummary.progress.contribution_total_cents)}</h2>
              <p className="mt-3 body-text prose">Fund changes are logged here for context but can only be edited in Emergency fund.</p>
            </div>
            <Link className="button-secondary" to="/resilience-jar">Manage emergency fund</Link>
          </div>
          <ul className="mt-6 divide-y" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            {fundSummary.contributions.length === 0 ? (
              <li className="py-3 body-text">No emergency-fund changes recorded yet.</li>
            ) : (
              fundSummary.contributions.slice(0, 8).map((entry) => (
                <li className="flex items-center justify-between gap-3 py-3 text-sm" key={entry.id}>
                  <span className="body-text">{entry.contribution_date} · {entry.note || (entry.entry_type === "deposit" ? "Funds added" : "Emergency use")}</span>
                  <strong className="mono-label ink-key">
                    {entry.entry_type === "deposit" ? "+" : "−"}{formatMoney(entry.amount_cents)}
                  </strong>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </Shell>
  );
}

/** Average weekly surplus (income - work costs - essentials) over the most recent recorded weeks. */
function averageWeeklyLeftover(weeks: ReturnType<typeof adaptTransactions>["weeks"], count: number): number | null {
  const recent = [...weeks].sort((a, b) => a.week_start.localeCompare(b.week_start)).slice(-count);
  if (recent.length === 0) return null;
  const total = recent.reduce((sum, week) => {
    const income = week.platform_earnings.reduce((s, item) => s + item.gross_cents, 0);
    return sum + income - week.work_costs_cents - week.essential_expenses_cents;
  }, 0);
  return Math.round(total / recent.length);
}

function Overview() {
  const { data } = useFoundation();
  const adapted = useMemo(
    () => adaptTransactions(data.transactions, data.recurringWorkCosts, data.essentialExpenses),
    [data.transactions, data.recurringWorkCosts, data.essentialExpenses],
  );
  const recentWeeks = adapted.weeks.slice(-4);
  const leftover = averageWeeklyLeftover(adapted.weeks, 4);
  const weeklyEssentials = weeklyNormalisedTotal(data.essentialExpenses.filter((item) => item.isActive));
  const emergencyFund = data.profile.emergencyFundBalanceCents;
  const weeksCovered = weeklyEssentials > 0 ? Math.round((emergencyFund / weeklyEssentials) * 10) / 10 : null;

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your home</p>
          <h1 className="mt-2 display-hero" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>Your money at a glance</h1>
          <p className="mt-3 body-text prose">Record income and costs whenever they happen.</p>
        </div>
        <Link className="button-primary" to="/transactions/new">Add transaction</Link>
      </div>
      <div className="mt-10">
        <FinancialScoreCard />
      </div>
      <div className="mt-6">
        <CurrentWeekCard weeks={adapted.weeks} />
      </div>
      <div className="mt-6">
        <KeyFigures
          averageWeeklyLeftoverCents={leftover}
          emergencyFundBalanceCents={emergencyFund}
          weeksCovered={weeksCovered}
          weeksRecorded={recentWeeks.length}
        />
      </div>
      <div className="mt-6">
        <WeeklyTrendChart weeks={adapted.weeks} />
      </div>
    </Shell>
  );
}

function Entries() {
  const { data, deleteTransaction } = useFoundation();
  const transactions = data.transactions ?? [];
  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Transactions</p>
          <h1 className="mt-2 display-lg" style={{ fontSize: "28px" }}>Income and costs</h1>
          <p className="mt-3 body-text prose">Add each inflow or outflow when it happens. No weekly schedule is required.</p>
        </div>
        <Link className="button-primary" to="/transactions/new">Add transaction</Link>
      </div>
      <div className="card mt-6 divide-y p-0" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        {transactions.length === 0 && <div className="p-6 body-text">No transactions yet.</div>}
        {transactions.map((item) => (
          <article className="flex flex-wrap items-center justify-between gap-4 p-4" key={item.id}>
            <div>
              <p className="body-text ink-heading">{item.description || (item.entryType === "income" ? "Income" : "Cost")}</p>
              <p className="mt-2 mono-label">
                {item.occurredOn}{item.occurredUntil && item.occurredUntil !== item.occurredOn ? ` to ${item.occurredUntil}` : ""} · {item.entryType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="mono-label ink-key" style={{ fontSize: "16px", letterSpacing: "normal", textTransform: "none" }}>
                {item.entryType === "income" ? "+" : "−"}{formatMoney(item.amountCents)}
              </div>
              <Link className="button-secondary" to={`/transactions/${item.id}/edit`}>Edit</Link>
              <button className="button-secondary" onClick={() => { if (confirm("Delete this transaction?")) void deleteTransaction(item.id); }} type="button">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function TransactionEditor() {
  const { data, saveTransaction, updateTransaction } = useFoundation();
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const existing = transactionId ? data.transactions.find((item) => item.id === transactionId) : undefined;
  const [entryType, setEntryType] = useState<"income" | "cost">(existing?.entryType ?? "income");
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amountCents) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [occurredOn, setOccurredOn] = useState(existing?.occurredOn ?? new Date().toISOString().slice(0, 10));
  const [occurredUntil, setOccurredUntil] = useState(existing?.occurredUntil ?? "");
  const [affectedEmergencyFund, setAffectedEmergencyFund] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); try { const amountCents = parseMoneyToCents(amount); if (amountCents <= 0) throw new Error("Enter an amount greater than zero."); if (occurredUntil && occurredUntil < occurredOn) throw new Error("End date cannot be before the start date."); const payload = { entryType, amountCents, description: description.trim() || null, occurredOn, occurredUntil: occurredUntil || null }; if (existing) await updateTransaction(existing.id, payload); else await saveTransaction(payload); navigate(affectedEmergencyFund ? "/resilience-jar?action=emergency-use" : "/transactions"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save transaction."); } };
  const todayIso = new Date().toISOString().slice(0, 10);
  const rangeCapIso = (() => { const cap = new Date(`${occurredOn}T00:00:00Z`); cap.setUTCDate(cap.getUTCDate() + 366); return cap.toISOString().slice(0, 10); })();
  const maxEndDate = rangeCapIso < todayIso ? rangeCapIso : todayIso;
  return (
    <Shell>
      <form className="mx-auto max-w-xl" onSubmit={submit}>
        <button className="button-secondary" onClick={() => navigate("/transactions")} type="button">← Back to transactions</button>
        <p className="eyebrow mt-6">{existing ? "Edit transaction" : "New transaction"}</p>
        <h1 className="mt-2 display-lg" style={{ fontSize: "28px" }}>{existing ? "Update income or cost" : "Add income or cost"}</h1>
        <div className="card mt-6 space-y-6">
          <div className="flex gap-2">
            <button className={entryType === "income" ? "button-primary" : "button-secondary"} onClick={() => setEntryType("income")} type="button">Income</button>
            <button className={entryType === "cost" ? "button-primary" : "button-secondary"} onClick={() => setEntryType("cost")} type="button">Cost</button>
          </div>
          <label><span className="label">Amount</span><input autoFocus inputMode="decimal" maxLength={10} placeholder="0.00" required value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))} /></label>
          <label><span className="label">Description (optional)</span><input maxLength={160} placeholder={entryType === "income" ? "e.g. Delivery payout" : "e.g. Fuel"} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label><span className="label">Start date</span><input max={new Date().toISOString().slice(0, 10)} required type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} /></label>
          <label><span className="label">End date (optional, for a date range)</span><input min={occurredOn} max={maxEndDate} type="date" value={occurredUntil} onChange={(event) => setOccurredUntil(event.target.value)} /></label>
          <label className="flex items-start gap-3 rounded-lg p-3" style={{ background: "var(--surface-obsidian-button)" }}>
            <input className="mt-1 !h-5 !min-h-0 !w-5" checked={affectedEmergencyFund} type="checkbox" onChange={(event) => setAffectedEmergencyFund(event.target.checked)} />
            <span>
              <strong className="body-text ink-heading">This affected my emergency fund</strong>
              <small className="mt-2 block body-text">After saving, record the matching fund activity in Emergency fund.</small>
            </span>
          </label>
          {error && <p className="body-text ink-key" role="alert">{error}</p>}
          <button className="button-primary w-full" type="submit">{existing ? "Save changes" : `Save ${entryType}`}</button>
        </div>
      </form>
    </Shell>
  );
}

function Onboarding() {
  const { saveOnboarding } = useFoundation();
  const navigate = useNavigate();
  const [initial] = useState(readOnboardingDraft);
  const [emergency, setEmergency] = useState(initial.emergency);
  const [recurring, setRecurring] = useState(initial.recurring);
  const [essentials, setEssentials] = useState(initial.essentials);
  const [error, setError] = useState("");
  useEffect(() => { localStorage.setItem("resilience-onboarding-draft", JSON.stringify({ version: 1, emergency, recurring, essentials } satisfies OnboardingDraft)); }, [emergency, recurring, essentials]);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); try { const recurringParsed = parseRows(recurring, true, true).map((item) => ({ ...item, category: item.category as RecurringWorkCost["category"], cadence: item.cadence ?? "weekly", isActive: true })); const essentialParsed = parseRows(essentials, true, true).map((item) => ({ ...item, category: item.category as EssentialExpense["category"], cadence: item.cadence ?? "weekly", isActive: true })); await saveOnboarding({ emergencySavingsCents: parseMoneyToCents(emergency), recurringWorkCosts: recurringParsed, essentialExpenses: essentialParsed }); navigate("/"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete setup."); } };
  return (
    <main className="resilience-onboarding mx-auto max-w-4xl px-4 py-10" style={{ background: "var(--surface-onyx)", minHeight: "100vh" }}>
      <div className="text-center">
        <img alt="" className="mx-auto h-14 w-14" src="/resilience-icon.svg" />
        <p className="eyebrow mt-5">Two-minute setup</p>
        <h1 className="mt-2 display-hero" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>Start with what you know</h1>
        <p className="mx-auto mt-3 body-text prose">Add your current emergency savings and regular costs. You can change these later.</p>
      </div>
      <form className="card mt-10 space-y-8" onSubmit={submit}>
        <label><span className="label">Emergency savings available now</span><input inputMode="decimal" maxLength={10} pattern="\d+(\.\d{0,2})?" required title="Enter an amount with up to two decimal places" value={emergency} onChange={(e) => setEmergency(e.target.value)} /></label>
        <MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Regular work costs" />
        <MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Everyday essentials" />
        {error && <p className="note ink-key" role="alert">{error}</p>}
        <button className="button-primary w-full" type="submit">Save and continue</button>
      </form>
    </main>
  );
}

/** The former standalone Settings screen, now a section inside Profile. */
function FinancialDetailsSection() {
  const { data, saveAssumptions, resetData } = useFoundation();
  const [editing, setEditing] = useState(false);
  const [recurring, setRecurring] = useState(toEditable(data.recurringWorkCosts));
  const [essentials, setEssentials] = useState(toEditable(data.essentialExpenses));
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); setMessage(""); try { const r = parseRows(recurring, true, true).map((item) => ({ ...item, category: item.category as RecurringWorkCost["category"], cadence: item.cadence ?? "weekly", isActive: true })); const e = parseRows(essentials, true, true).map((item) => ({ ...item, category: item.category as EssentialExpense["category"], cadence: item.cadence ?? "weekly", isActive: true })); await saveAssumptions(r, e); setMessage("Saved on this device. It will sync automatically."); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save."); } };
  const total = (items: Array<{ isActive: boolean; cadence: "weekly" | "monthly"; amountCents: number }>) => items.filter((item) => item.isActive).reduce((sum, item) => sum + (item.cadence === "monthly" ? Math.round(item.amountCents * 12 / 52) : item.amountCents), 0);
  const display = (items: Array<{ id: string; label: string; amountCents: number; cadence: string }>) => (
    <ul className="mt-3 divide-y" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      {items.length ? items.map((item) => (
        <li className="flex justify-between gap-3 py-2 text-sm" key={item.id}>
          <span className="body-text">{item.label} <span className="mono-label" style={{ display: "inline" }}>({item.cadence})</span></span>
          <strong className="body-text ink-key">{formatMoney(item.amountCents)}</strong>
        </li>
      )) : <li className="py-2 body-text">No items added.</li>}
    </ul>
  );
  return (
    <section className="mt-10">
      <form onSubmit={save}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Financial details</p>
            <h2 className="mt-2 display-lg" style={{ fontSize: "24px" }}>Your regular costs</h2>
            <p className="mt-3 body-text prose">Review ongoing work costs and everyday essentials. Emergency-fund activity is managed separately.</p>
          </div>
          <button className="button-secondary" onClick={() => setEditing((value) => !value)} type="button">{editing ? "Cancel editing" : "Edit financial details"}</button>
        </div>
        <div className="card mt-6 space-y-8">
          {editing ? (
            <>
              <MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Regular work costs" />
              <MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Everyday essentials" />
              <button className="button-primary" type="submit">Save changes</button>
            </>
          ) : (
            <>
              <section>
                <div className="flex justify-between gap-3">
                  <h3 className="subheading">Regular work costs</h3>
                  <strong className="body-text ink-key">{formatMoney(total(data.recurringWorkCosts))}/week</strong>
                </div>
                {display(data.recurringWorkCosts)}
              </section>
              <section>
                <div className="flex justify-between gap-3">
                  <h3 className="subheading">Everyday essentials</h3>
                  <strong className="body-text ink-key">{formatMoney(total(data.essentialExpenses))}/week</strong>
                </div>
                {display(data.essentialExpenses)}
              </section>
            </>
          )}
          {message && <p className="note" role="status">{message}</p>}
        </div>
      </form>
      <section className="mt-6 rounded-2xl p-5" style={{ background: "var(--surface-graphite)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 className="subheading">Delete all my data</h3>
        <p className="mt-3 body-text prose">Permanently deletes this account's profile, transactions and financial records. This cannot be undone, and you must be online.</p>
        <button className="button-secondary mt-4" onClick={() => { if (confirm("Delete all of your data? This permanently removes your profile, transactions and financial records, and cannot be undone.")) void resetData().catch((error: Error) => setMessage(error.message)); }} type="button">Delete all my data</button>
      </section>
    </section>
  );
}

function ProfileManager() {
  const { data, refresh } = useFoundation();
  const [name, setName] = useState(data.profile.displayName ?? "");
  const [phone, setPhone] = useState(data.profile.phoneNumber ?? "");
  const [birthDate, setBirthDate] = useState(data.profile.dateOfBirth ?? "");
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); try { await apiRequest("/foundation/profile", { method: "PATCH", body: JSON.stringify({ displayName: name || null, phoneNumber: phone || null, dateOfBirth: birthDate || null }) }); await refresh(); setMessage("Profile saved."); } catch { setMessage("Could not save your profile."); } };
  return (
    <Shell>
      <div className="mx-auto max-w-4xl">
        <form onSubmit={save}>
          <p className="eyebrow">Profile</p>
          <h1 className="mt-2 display-lg" style={{ fontSize: "28px" }}>Manage your profile</h1>
          <p className="mt-3 body-text prose">All fields are optional and private to your account.</p>
          <div className="card mt-6 space-y-6">
            <label><span className="label">Name</span><input maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label><span className="label">Phone number</span><input inputMode="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label><span className="label">Date of birth</span><input max={new Date().toISOString().slice(0, 10)} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
            {message && <p className="body-text">{message}</p>}
            <button className="button-primary w-full" type="submit">Save profile</button>
          </div>
        </form>
        <FinancialDetailsSection />
      </div>
    </Shell>
  );
}

export function App() {
  const { loading: authLoading, user } = useAuth();
  const { data, loading, bootstrapLoaded } = useFoundation();
  if (authLoading) return <div className="grid min-h-screen place-items-center body-text" style={{ background: "var(--surface-onyx)" }}>Checking your session…</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="/signin" element={<AuthPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }
  if (loading) return (
    <div className="grid min-h-screen place-items-center" style={{ background: "var(--surface-onyx)" }}>
      <div className="text-center">
        <img alt="" className="mx-auto h-14 w-14 animate-pulse" src="/resilience-icon.svg" />
        <p className="mt-3 body-text">Loading your foundation…</p>
      </div>
    </div>
  );
  return (
    <ChatProvider>
      <Routes>
        <Route path="/onboarding" element={data.profile.onboardingCompleted ? <Navigate replace to="/" /> : <Onboarding />} />
        <Route path="*" element={bootstrapLoaded && !data.profile.onboardingCompleted ? <LandingPage /> : (
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Entries />} />
            <Route path="/transactions/new" element={<TransactionEditor />} />
            <Route path="/transactions/:transactionId/edit" element={<TransactionEditor />} />
            <Route path="/income-reality" element={<IncomeReality />} />
            <Route path="/resilience-jar" element={<EmergencyFund view="jar" />} />
            <Route path="/resilience-jar/plan" element={<EmergencyFund view="plan" />} />
            <Route path="/savings" element={<Shell><Suspense fallback={<FeatureLoader />}><SavingsPage /></Suspense></Shell>} />
            <Route path="/scenario-simulator" element={<SetbackPlanner />} />
            <Route path="/scheme-navigator" element={<Shell><Suspense fallback={<FeatureLoader />}><SchemeNavigator /></Suspense></Shell>} />
            <Route path="/settings" element={<Navigate replace to="/profile" />} />
            <Route path="/profile" element={<ProfileManager />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        )} />
      </Routes>
      <ChatWidget />
    </ChatProvider>
  );
}
