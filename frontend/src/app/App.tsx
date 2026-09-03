import { lazy, Suspense, type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

import { MoneyRows, type EditableMoneyRow } from "../components/MoneyRows";
import { useFoundation } from "../features/foundation-input/FoundationContext";
import { AuthPage } from "../features/auth/AuthPage";
import { useAuth } from "../features/auth/AuthContext";
import { adaptTransactions } from "../features/income-reality/foundationAdapter";
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
  return <div className="card text-sm text-slate-600" role="status">Loading this section…</div>;
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

function SyncStatus({ navOpen }: { navOpen: boolean }) {
  const { online, pending, syncNow, resolveConflict } = useFoundation();
  const [open, setOpen] = useState(false);
  const conflicts = pending.filter((item) => item.status === "conflict");
  const shift = navOpen ? " sync-shifted" : "";
  return (
    <>
      {!online && <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">Offline — changes are saved on this device and will sync when you reconnect.</div>}
      <button className={`sync-fab${shift} fixed bottom-4 left-4 z-30 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl`} onClick={() => setOpen(!open)} type="button">
        {online ? "Online" : "Offline"} · {pending.length} pending
      </button>
      {open && (
        <aside className={`sync-panel${shift} fixed bottom-20 left-4 z-30 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl`} aria-label="Sync status">
          <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Device sync</p><h2 className="mt-1 text-xl font-bold">{pending.length ? "Changes waiting" : "Everything is synced"}</h2></div><button onClick={() => setOpen(false)} type="button">Close</button></div>
          {pending.map((item) => <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" key={item.id}><strong>{item.status}</strong><p className="mt-1 break-all text-slate-600">{item.method} {item.path}</p>{item.error && <p className="mt-1 text-rose-700">{item.error.message}</p>}{item.status === "conflict" && <div className="mt-2 flex gap-2"><button className="button-secondary !min-h-9 !px-3" onClick={() => void resolveConflict(item.id, false)}>Use server</button><button className="button-primary !min-h-9 !px-3" onClick={() => void resolveConflict(item.id, true)}>Keep mine</button></div>}</div>)}
          <button className="button-primary mt-4 w-full" disabled={!online || conflicts.length > 0 || pending.length === 0} onClick={() => void syncNow()} type="button">Sync now</button>
        </aside>
      )}
    </>
  );
}

const NAV_LINKS: Array<[string, string]> = [
  ["/", "Home"],
  ["/transactions", "Transactions"],
  ["/income-reality", "Income overview"],
  ["/resilience-jar", "Emergency fund"],
  ["/savings", "Savings"],
  ["/scenario-simulator", "Setback planner"],
  ["/scheme-navigator", "Schemes"],
  ["/profile", "Profile"],
  ["/settings", "Financial details"]
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
          className="nav-toggle"
          onClick={() => setOpen(!navOpen)}
          type="button"
        >
          {navOpen ? "Close menu" : "Menu"}
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
      <main className={`app-main${navOpen ? " app-main-shifted" : ""} mx-auto max-w-6xl px-4 pb-8`}>{children}</main>
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
      <h1 className="mt-2 text-3xl font-black">See where each week's money went</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Each Monday–Sunday overview is calculated from the income and costs you recorded, so it works even when work is irregular.
      </p>
      {adapted.missingExpenseSnapshotCount > 0 ? (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
          {adapted.missingExpenseSnapshotCount} confirmed week
          {adapted.missingExpenseSnapshotCount === 1 ? " has" : "s have"} no saved expense
          snapshot. Those weeks show only their recorded variable costs.
        </p>
      ) : null}
      {adapted.weeks.length > 0 && adapted.weeks.every((week) => week.recorded_cpf_cents != null) ? (
        <p className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950" role="status">
          Every recorded week already includes CPF/MediSave. Those actual amounts take priority, so
          the estimator will apply only after you add a week without a CPF cost.
        </p>
      ) : null}
      {!online ? (
        <div className="card mt-6 text-slate-700">
          Reconnect to calculate Income Reality. Your saved weekly entries remain available on
          this device.
        </div>
      ) : (
        <Suspense fallback={<FeatureLoader />}><IncomeRealityPage weeks={adapted.weeks} /></Suspense>
      )}
      {fundSummary && <section className="card mt-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Emergency fund activity</p><h2 className="mt-1 text-xl font-bold">Current balance: {formatMoney(fundSummary.progress.contribution_total_cents)}</h2><p className="mt-1 text-sm text-slate-600">Fund changes are logged here for context but can only be edited in Emergency fund.</p></div><Link className="button-secondary" to="/resilience-jar">Manage emergency fund</Link></div><ul className="mt-4 divide-y divide-slate-100">{fundSummary.contributions.length === 0 ? <li className="py-3 text-sm text-slate-600">No emergency-fund changes recorded yet.</li> : fundSummary.contributions.slice(0, 8).map((entry) => <li className="flex items-center justify-between gap-3 py-3 text-sm" key={entry.id}><span>{entry.contribution_date} · {entry.note || (entry.entry_type === "deposit" ? "Funds added" : "Emergency use")}</span><strong className={entry.entry_type === "deposit" ? "text-emerald-700" : "text-rose-700"}>{entry.entry_type === "deposit" ? "+" : "−"}{formatMoney(entry.amount_cents)}</strong></li>)}</ul></section>}
    </Shell>
  );
}

function Overview() {
  const { data } = useFoundation();
  const recent = (data.transactions ?? []).filter((item) => new Date(item.occurredOn) >= new Date(Date.now() - 6 * 86400000));
  const income = recent.filter((item) => item.entryType === "income").reduce((total, item) => total + item.amountCents, 0);
  const variable = recent.filter((item) => item.entryType === "cost").reduce((total, item) => total + item.amountCents, 0);
  const weeklyFixed = [...data.recurringWorkCosts, ...data.essentialExpenses].reduce((total, item) => total + (item.cadence === "monthly" ? Math.round(item.amountCents * 12 / 52) : item.amountCents), 0);
  const takeHome = income - variable - weeklyFixed;
  const emergencyFund = data.profile.emergencyFundBalanceCents;
  return <Shell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your home</p><h1 className="mt-2 text-4xl font-black tracking-tight">Your money at a glance</h1><p className="mt-2 max-w-2xl text-slate-600">Record income and costs whenever they happen.</p></div><Link className="button-primary" to="/transactions/new">Add transaction</Link></div><section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Income in the last 7 days" value={formatMoney(income)} detail="From your transactions"/><Metric label="Regular weekly costs" value={formatMoney(weeklyFixed)} detail="Includes weekly share of monthly costs"/><Metric label="Money left in the last 7 days" value={formatMoney(takeHome)} detail="After costs" tone={takeHome < 0 ? "rose" : "indigo"}/><Metric label="Emergency fund" value={formatMoney(emergencyFund)} detail="Your baseline buffer" to="/resilience-jar"/></section><section className="card mt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Emergency fund</p><h2 className="mt-1 text-2xl font-bold">{formatMoney(emergencyFund)}</h2><p className="mt-1 text-sm text-slate-500">Deposits and emergency use are already counted in this balance.</p></div><Link className="button-secondary" to="/resilience-jar">Open emergency fund</Link></div></section></Shell>;
}

function Metric({ label, value, detail, tone = "indigo", to }: { label: string; value: string; detail: string; tone?: "indigo" | "rose"; to?: string }) {
  const body = <><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></>;
  const className = `card border-t-4 ${tone === "rose" ? "border-t-rose-500" : "border-t-indigo-600"}`;
  // A metric that maps onto a screen becomes the way into it.
  return to ? <Link className={`${className} block no-underline`} to={to}>{body}</Link> : <div className={className}>{body}</div>;
}

function Entries() {
  const { data, deleteTransaction } = useFoundation();
  const transactions = data.transactions ?? [];
  return <Shell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Transactions</p><h1 className="mt-2 text-3xl font-black">Income and costs</h1><p className="mt-2 text-slate-600">Add each inflow or outflow when it happens. No weekly schedule is required.</p></div><Link className="button-primary" to="/transactions/new">Add transaction</Link></div><div className="card mt-6 divide-y divide-slate-200 p-0">{transactions.length === 0 && <div className="p-6 text-slate-600">No transactions yet.</div>}{transactions.map((item) => <article className="flex flex-wrap items-center justify-between gap-4 p-4" key={item.id}><div><p className="font-bold">{item.description || (item.entryType === "income" ? "Income" : "Cost")}</p><p className="mt-1 text-sm text-slate-500">{item.occurredOn} · {item.entryType}</p></div><div className={item.entryType === "income" ? "font-black text-emerald-700" : "font-black text-rose-700"}>{item.entryType === "income" ? "+" : "−"}{formatMoney(item.amountCents)}</div><button className="button-secondary text-rose-700" onClick={() => { if (confirm("Delete this transaction?")) void deleteTransaction(item.id); }} type="button">Delete</button></article>)}</div></Shell>;
}

function TransactionEditor() {
  const { saveTransaction } = useFoundation();
  const navigate = useNavigate();
  const [entryType, setEntryType] = useState<"income" | "cost">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [affectedEmergencyFund, setAffectedEmergencyFund] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); try { const amountCents = parseMoneyToCents(amount); if (amountCents <= 0) throw new Error("Enter an amount greater than zero."); await saveTransaction({ entryType, amountCents, description: description.trim() || null, occurredOn }); navigate(affectedEmergencyFund ? "/resilience-jar?action=contribution" : "/transactions"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save transaction."); } };
  return <Shell><form className="mx-auto max-w-xl" onSubmit={submit}><p className="eyebrow">New transaction</p><h1 className="mt-2 text-3xl font-black">Add income or cost</h1><div className="card mt-6 space-y-5"><div className="flex gap-2"><button className={entryType === "income" ? "button-primary" : "button-secondary"} onClick={() => setEntryType("income")} type="button">Income</button><button className={entryType === "cost" ? "button-primary" : "button-secondary"} onClick={() => setEntryType("cost")} type="button">Cost</button></div><label><span className="label">Amount</span><input autoFocus inputMode="decimal" placeholder="0.00" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label><span className="label">Description <span className="text-slate-400">(optional)</span></span><input maxLength={160} placeholder={entryType === "income" ? "e.g. Delivery payout" : "e.g. Fuel"} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label><span className="label">Date</span><input max={new Date().toISOString().slice(0, 10)} required type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} /></label><label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"><input className="mt-1 !h-5 !min-h-0 !w-5" checked={affectedEmergencyFund} type="checkbox" onChange={(event) => setAffectedEmergencyFund(event.target.checked)} /><span><strong>This affected my emergency fund</strong><small className="mt-1 block text-slate-600">After saving, update the fund balance separately so your transaction and emergency-fund activity stay clear.</small></span></label>{error && <p className="text-sm text-rose-700">{error}</p>}<button className="button-primary w-full" type="submit">Save {entryType}</button></div></form></Shell>;
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
  return <main className="resilience-onboarding mx-auto max-w-4xl px-4 py-10"><div className="text-center"><img alt="" className="mx-auto h-14 w-14" src="/resilience-icon.svg"/><p className="eyebrow mt-5">Two-minute setup</p><h1 className="mt-2 text-4xl font-black">Start with what you know</h1><p className="mx-auto mt-3 max-w-2xl text-slate-600">Add your current emergency savings and regular costs. You can change these later.</p></div><form className="card mt-8 space-y-7" onSubmit={submit}><label><span className="label">Emergency savings available now</span><input inputMode="decimal" maxLength={10} pattern="\d+(\.\d{0,2})?" required title="Enter an amount with up to two decimal places" value={emergency} onChange={(e) => setEmergency(e.target.value)}/></label><MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Regular work costs"/><MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Everyday essentials"/>{error && <p className="rounded-xl bg-rose-50 p-3 text-rose-800" role="alert">{error}</p>}<button className="button-primary w-full" type="submit">Save and continue</button></form></main>;
}

function Settings() {
  const { data, saveAssumptions, resetData } = useFoundation();
  const [recurring, setRecurring] = useState(toEditable(data.recurringWorkCosts));
  const [essentials, setEssentials] = useState(toEditable(data.essentialExpenses));
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); setMessage(""); try { const r = parseRows(recurring, true, true).map((item) => ({ ...item, category: item.category as RecurringWorkCost["category"], cadence: item.cadence ?? "weekly", isActive: true })); const e = parseRows(essentials, true, true).map((item) => ({ ...item, category: item.category as EssentialExpense["category"], cadence: item.cadence ?? "weekly", isActive: true })); await saveAssumptions(r, e); setMessage("Saved on this device. It will sync automatically."); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save."); } };
  return <Shell><form className="mx-auto max-w-4xl" onSubmit={save}><p className="eyebrow">Financial details</p><h1 className="mt-2 text-3xl font-black">Manage your regular costs</h1><p className="mt-2 text-slate-600">Update ongoing work costs and everyday essentials. Manage your emergency-fund balance from Emergency fund.</p><div className="card mt-6 space-y-7"><MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Regular work costs"/><MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Everyday essentials"/>{message && <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900" role="status">{message}</p>}<button className="button-primary" type="submit">Save changes</button></div></form><section className="mx-auto mt-6 max-w-4xl rounded-3xl border border-rose-200 bg-rose-50 p-5"><h2 className="font-bold text-rose-950">Delete all my data</h2><p className="mt-1 text-sm text-rose-800">Permanently deletes this account’s profile, transactions and financial records. This cannot be undone, and you must be online.</p><button className="button-secondary mt-4 text-rose-700" onClick={() => { if (confirm("Delete all of your data? This permanently removes your profile, transactions and financial records, and cannot be undone.")) void resetData().catch((error: Error) => setMessage(error.message)); }} type="button">Delete all my data</button></section></Shell>;
}

function ProfileManager() {
  const { data, refresh } = useFoundation();
  const [name, setName] = useState(data.profile.displayName ?? "");
  const [phone, setPhone] = useState(data.profile.phoneNumber ?? "");
  const [birthDate, setBirthDate] = useState(data.profile.dateOfBirth ?? "");
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); try { await apiRequest("/foundation/profile", { method: "PATCH", body: JSON.stringify({ displayName: name || null, phoneNumber: phone || null, dateOfBirth: birthDate || null }) }); await refresh(); setMessage("Profile saved."); } catch { setMessage("Could not save your profile."); } };
  return <Shell><form className="mx-auto max-w-xl" onSubmit={save}><p className="eyebrow">Profile</p><h1 className="mt-2 text-3xl font-black">Manage your profile</h1><p className="mt-2 text-slate-600">All fields are optional and private to your account.</p><div className="card mt-6 space-y-5"><label><span className="label">Name</span><input maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label><label><span className="label">Phone number</span><input inputMode="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label><span className="label">Date of birth</span><input max={new Date().toISOString().slice(0, 10)} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>{message && <p className="text-sm text-slate-700">{message}</p>}<button className="button-primary w-full" type="submit">Save profile</button></div></form></Shell>;
}

export function App() {
  const { configured, loading: authLoading, user } = useAuth();
  const { data, loading } = useFoundation();
  if (authLoading) return <div className="grid min-h-screen place-items-center">Checking your session…</div>;
  if (!configured || !user) return <AuthPage />;
  if (loading) return <div className="grid min-h-screen place-items-center"><div className="text-center"><img alt="" className="mx-auto h-14 w-14 animate-pulse" src="/resilience-icon.svg"/><p className="mt-3 font-semibold">Loading your foundation…</p></div></div>;
  return (
    <ChatProvider>
      <Routes>
        <Route path="/onboarding" element={data.profile.onboardingCompleted ? <Navigate replace to="/" /> : <Onboarding />} />
        <Route path="*" element={!data.profile.onboardingCompleted ? <Navigate replace to="/onboarding" /> : (
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Entries />} />
            <Route path="/transactions/new" element={<TransactionEditor />} />
            <Route path="/income-reality" element={<IncomeReality />} />
            <Route path="/resilience-jar" element={<EmergencyFund view="jar" />} />
            <Route path="/resilience-jar/plan" element={<EmergencyFund view="plan" />} />
            <Route path="/savings" element={<Shell><Suspense fallback={<FeatureLoader />}><SavingsPage /></Suspense></Shell>} />
            <Route path="/scenario-simulator" element={<SetbackPlanner />} />
            <Route path="/scheme-navigator" element={<Shell><Suspense fallback={<FeatureLoader />}><SchemeNavigator /></Suspense></Shell>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<ProfileManager />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        )} />
      </Routes>
      <ChatWidget />
    </ChatProvider>
  );
}
