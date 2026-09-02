import { useEffect, useMemo, useState, type MouseEvent } from "react";

import {
  FixtureResilienceJarApi,
  readCachedSummary,
  ResilienceJarPage,
} from "../features/resilience-jar/index.ts";
import { ScenarioSimulatorPage } from "../features/scenario-simulator/index.ts";
import { ChatProvider } from "../features/scheme-navigator/ChatContext.tsx";
import { ChatWidget } from "../features/scheme-navigator/ChatWidget.tsx";
import { SchemeNavigator } from "../features/scheme-navigator/SchemeNavigator.tsx";
import { resolveAppRoute, type AppPath } from "./routing.ts";
import "./app.css";

export function App() {
  return (
    <ChatProvider>
      <RoutedApp />
    </ChatProvider>
  );
}

function RoutedApp() {
  const fixtureApi = useMemo(
    () => new FixtureResilienceJarApi(readCachedSummary()),
    [],
  );
  const [pathname, setPathname] = useState(window.location.pathname);
  const route = resolveAppRoute(pathname);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: AppPath) {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLink(path: AppPath) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(path);
    };
  }

  if (route === "not_found") {
    return (
      <>
        <main className="app-not-found">
          <p className="app-brand">Resilience</p>
          <h1>Page not found</h1>
          <a href="/resilience-jar" onClick={handleLink("/resilience-jar")}>
            Open the Emergency Fund
          </a>
        </main>
        <ChatWidget />
      </>
    );
  }

  return (
    <>
      <header className="app-header">
        <a
          className="app-logo"
          href="/resilience-jar"
          aria-label="Resilience home"
          onClick={handleLink("/resilience-jar")}
        >
          <span aria-hidden="true">R</span>
          <strong>Resilience</strong>
        </a>
        <nav className="app-nav" aria-label="Main navigation">
          <a
            href="/resilience-jar"
            aria-current={route === "jar" || route === "plan" ? "page" : undefined}
            onClick={handleLink("/resilience-jar")}
          >
            Emergency Fund
          </a>
          <a
            href="/scenario-simulator"
            aria-current={route === "scenario" ? "page" : undefined}
            onClick={handleLink("/scenario-simulator")}
          >
            Setback Planner
          </a>
          <a
            href="/scheme-navigator"
            aria-current={route === "schemes" ? "page" : undefined}
            onClick={handleLink("/scheme-navigator")}
          >
            Schemes
          </a>
        </nav>
        <span className="app-demo-label">Local demo</span>
      </header>
      {route === "scenario" ? (
        <ScenarioSimulatorPage />
      ) : route === "schemes" ? (
        <SchemeNavigator />
      ) : (
        <ResilienceJarPage api={fixtureApi} view={route} onNavigate={navigate} />
      )}
      <ChatWidget />
    </>
  );
}
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { MoneyRows, type EditableMoneyRow } from "../components/MoneyRows";
import { useFoundation } from "../features/foundation-input/FoundationContext";
import { adaptFoundationWeeks } from "../features/income-reality/foundationAdapter";
import { IncomeRealityPage } from "../features/income-reality/IncomeRealityPage";
import { csvTemplateUrl, previewCsv } from "../lib/api";
import { currentMonday, isMonday, nextMonday } from "../lib/date";
import { centsToInput, formatMoney, parseMoneyToCents } from "../lib/money";
import type {
  CsvPreview,
  EarningItem,
  EssentialExpense,
  InputSnapshot,
  RecurringWorkCost,
  VariableCostItem,
  WeeklyEntry
} from "../types/foundation";

const WORK_CATEGORIES = [
  ["vehicle_rental", "Vehicle rental"], ["insurance", "Insurance"], ["subscription", "Subscription"],
  ["equipment", "Equipment"], ["other", "Other"]
].map(([value, label]) => ({ value, label }));
const ESSENTIAL_CATEGORIES = [
  ["housing", "Housing"], ["food", "Food"], ["transport", "Transport"], ["utilities", "Utilities"],
  ["healthcare", "Healthcare"], ["caregiving", "Caregiving"], ["debt", "Debt"], ["other", "Other"]
].map(([value, label]) => ({ value, label }));
const EARNING_CATEGORIES = [
  ["grab", "Grab"], ["gojek", "Gojek"], ["tada", "TADA"], ["deliveroo", "Deliveroo"],
  ["foodpanda", "foodpanda"], ["lalamove", "Lalamove"], ["other", "Other"]
].map(([value, label]) => ({ value, label }));
const VARIABLE_CATEGORIES = [
  ["fuel", "Fuel"], ["charging", "Charging"], ["tolls", "Tolls"], ["parking", "Parking"],
  ["repairs", "Repairs"], ["platform_fees", "Platform fees"], ["cpf", "CPF"], ["other", "Other"]
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

function sum(items: Array<{ amountCents: number }>) {
  return items.reduce((total, item) => total + item.amountCents, 0);
}

function createInputSnapshots(
  recurringWorkCosts: RecurringWorkCost[],
  essentialExpenses: EssentialExpense[],
): InputSnapshot[] {
  return [
    ...recurringWorkCosts.map((item) => ({
      id: crypto.randomUUID(),
      sourceId: item.id,
      inputKind: "recurring_work_cost" as const,
      category: item.category,
      label: item.label,
      amountCents: item.amountCents,
      cadence: item.cadence,
    })),
    ...essentialExpenses.map((item) => ({
      id: crypto.randomUUID(),
      sourceId: item.id,
      inputKind: "essential_expense" as const,
      category: item.category,
      label: item.label,
      amountCents: item.amountCents,
      cadence: item.cadence,
    })),
  ];
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

function SyncStatus() {
  const { online, pending, syncNow, resolveConflict } = useFoundation();
  const [open, setOpen] = useState(false);
  const conflicts = pending.filter((item) => item.status === "conflict");
  return (
    <>
      {!online && <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">Offline — changes are saved on this device and will sync when you reconnect.</div>}
      <button className="fixed bottom-4 right-4 z-30 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl" onClick={() => setOpen(!open)} type="button">
        {online ? "Online" : "Offline"} · {pending.length} pending
      </button>
      {open && (
        <aside className="fixed bottom-20 right-4 z-30 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl" aria-label="Sync status">
          <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Device sync</p><h2 className="mt-1 text-xl font-bold">{pending.length ? "Changes waiting" : "Everything is synced"}</h2></div><button onClick={() => setOpen(false)} type="button">Close</button></div>
          {pending.map((item) => <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" key={item.id}><strong>{item.status}</strong><p className="mt-1 break-all text-slate-600">{item.method} {item.path}</p>{item.error && <p className="mt-1 text-rose-700">{item.error.error.message}</p>}{item.status === "conflict" && <div className="mt-2 flex gap-2"><button className="button-secondary !min-h-9 !px-3" onClick={() => void resolveConflict(item.id, false)}>Use server</button><button className="button-primary !min-h-9 !px-3" onClick={() => void resolveConflict(item.id, true)}>Keep mine</button></div>}</div>)}
          <button className="button-primary mt-4 w-full" disabled={!online || conflicts.length > 0 || pending.length === 0} onClick={() => void syncNow()} type="button">Sync now</button>
        </aside>
      )}
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const nav = [["/", "Overview"], ["/entries", "Weekly entries"], ["/income-reality", "Income reality"], ["/import", "Import CSV"], ["/settings", "Assumptions"]];
  return <div className="min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4"><Link className="flex items-center gap-3" to="/"><img alt="" className="h-10 w-10" src="/resilience-icon.svg"/><div><strong className="block text-lg">Resilience</strong><span className="text-xs text-slate-500">Know your buffer</span></div></Link><nav className="flex flex-wrap gap-1" aria-label="Primary">{nav.map(([to, label]) => <NavLink className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-50"}`} end={to === "/"} key={to} to={to}>{label}</NavLink>)}</nav></div></header><main className="mx-auto max-w-6xl px-4 py-8">{children}</main><SyncStatus /></div>;
}

function IncomeReality() {
  const { data, online } = useFoundation();
  const adapted = useMemo(
    () => adaptFoundationWeeks(data.weeklyEntries),
    [data.weeklyEntries],
  );

  return (
    <Shell>
      <p className="eyebrow">Income Reality Engine</p>
      <h1 className="mt-2 text-3xl font-black">What you actually earned</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Confirmed weekly entries flow through transparent calculations for work costs, CPF or
        MediSave, essential expenses, and available surplus.
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
        <IncomeRealityPage weeks={adapted.weeks} />
      )}
    </Shell>
  );
}

function Overview() {
  const { data } = useFoundation();
  const latest = data.weeklyEntries[0];
  const income = latest ? sum(latest.earnings) : 0;
  const variable = latest ? sum(latest.variableCosts) : 0;
  const weeklyFixed = [...data.recurringWorkCosts, ...data.essentialExpenses].reduce((total, item) => total + (item.cadence === "monthly" ? Math.round(item.amountCents * 12 / 52) : item.amountCents), 0);
  const takeHome = income - variable - weeklyFixed;
  return <Shell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Foundation input</p><h1 className="mt-2 text-4xl font-black tracking-tight">Your financial starting point</h1><p className="mt-2 max-w-2xl text-slate-600">A clear, editable record of weekly platform income, work costs, essentials and emergency savings.</p></div><Link className="button-primary" to="/entries/new">Add a new week</Link></div><section className="mt-8 grid gap-4 md:grid-cols-3"><Metric label="Latest weekly income" value={formatMoney(income)} detail={latest?.weekStart ?? "No week recorded"}/><Metric label="Estimated fixed weekly costs" value={formatMoney(weeklyFixed)} detail="Monthly amounts converted at 12 ÷ 52"/><Metric label="Latest estimated remainder" value={formatMoney(takeHome)} detail="Income minus variable and fixed costs" tone={takeHome < 0 ? "rose" : "indigo"}/></section><section className="card mt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Emergency buffer</p><h2 className="mt-1 text-2xl font-bold">{formatMoney(data.profile.latestEmergencySavingsCents)}</h2></div><Link className="button-secondary" to="/settings">Update assumptions</Link></div></section><section className="mt-6 grid gap-4 md:grid-cols-2"><Link className="card transition hover:border-indigo-300" to="/entries"><h2 className="text-xl font-bold">Review weekly history</h2><p className="mt-2 text-slate-600">Edit previous weeks or record a no-income week.</p></Link><Link className="card transition hover:border-indigo-300" to="/import"><h2 className="text-xl font-bold">Import the Resilience CSV</h2><p className="mt-2 text-slate-600">Validate a file before adding its rows.</p></Link></section></Shell>;
}

function Metric({ label, value, detail, tone = "indigo" }: { label: string; value: string; detail: string; tone?: "indigo" | "rose" }) {
  return <div className={`card border-t-4 ${tone === "rose" ? "border-t-rose-500" : "border-t-indigo-600"}`}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>;
}

function Entries() {
  const { data, deleteWeek } = useFoundation();
  return <Shell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Weekly history</p><h1 className="mt-2 text-3xl font-black">Income and work costs</h1></div><Link className="button-primary" to="/entries/new">Add a new week</Link></div><div className="mt-6 space-y-3">{data.weeklyEntries.length === 0 && <div className="card text-slate-600">No weekly entries yet.</div>}{data.weeklyEntries.map((entry) => <article className="card flex flex-wrap items-center justify-between gap-4" key={entry.id}><div><p className="font-bold">Week of {entry.weekStart}</p><p className="mt-1 text-sm text-slate-500">Revision {entry.revision} · {entry.status} · {entry.hadNoIncome ? "No income" : `${entry.earnings.length} earning source(s)`}</p></div><div className="text-right"><p className="text-xl font-black">{formatMoney(sum(entry.earnings) - sum(entry.variableCosts))}</p><p className="text-xs text-slate-500">income minus variable costs</p></div><div className="flex gap-2"><Link className="button-secondary" to={`/entries/${entry.weekStart}`}>Edit</Link><button className="button-secondary text-rose-700" onClick={() => { if (confirm(`Delete the week of ${entry.weekStart}?`)) void deleteWeek(entry.weekStart); }} type="button">Delete</button></div></article>)}</div></Shell>;
}

interface WeekDraft { weekStart: string; noIncome: boolean; emergency: string; earnings: EditableMoneyRow[]; variable: EditableMoneyRow[]; }

function WeekEditor() {
  const { weekStart: weekParam } = useParams();
  const { data, saveWeek } = useFoundation();
  const navigate = useNavigate();
  const isNewWeek = weekParam === "new";
  const currentWeekStart = currentMonday();
  const weekStart = isNewWeek && data.weeklyEntries.some((item) => item.weekStart === currentWeekStart)
    ? nextMonday(currentWeekStart)
    : (weekParam ?? currentWeekStart);
  const existing = isNewWeek ? undefined : data.weeklyEntries.find((item) => item.weekStart === weekStart);
  const [draft, setDraft] = useState<WeekDraft>(() => ({
    weekStart,
    noIncome: existing?.hadNoIncome ?? false,
    emergency: centsToInput(existing?.emergencySavingsCents ?? data.profile.latestEmergencySavingsCents),
    earnings: existing ? existing.earnings.map((item) => ({ id: item.id, category: item.platformCode, label: item.platformLabel ?? EARNING_CATEGORIES.find((x) => x.value === item.platformCode)?.label ?? item.platformCode, amount: centsToInput(item.amountCents) })) : [],
    variable: existing ? toEditable(existing.variableCosts) : []
  }));
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      if (!isMonday(draft.weekStart)) throw new Error("Week start must be a Monday.");
      const earningRows = draft.noIncome ? [] : parseRows(draft.earnings, false);
      if (!draft.noIncome && earningRows.length === 0) throw new Error("Add an earning or mark this as a no-income week.");
      if (earningRows.some((row) => row.category === "other" && !row.label)) throw new Error("Describe earnings entered as Other.");
      const variableRows = parseRows(draft.variable);
      const snapshots = createInputSnapshots(data.recurringWorkCosts, data.essentialExpenses);
      const entryAtSelectedWeek = data.weeklyEntries.find((item) => item.weekStart === draft.weekStart);
      if (entryAtSelectedWeek && entryAtSelectedWeek.id !== existing?.id) {
        throw new Error("That week already has an entry. Edit it from weekly history instead.");
      }
      const isSeparateWeek = !entryAtSelectedWeek;
      await saveWeek({ id: entryAtSelectedWeek?.id ?? crypto.randomUUID(), weekStart: draft.weekStart, hadNoIncome: draft.noIncome, emergencySavingsCents: parseMoneyToCents(draft.emergency), status: "confirmed", revision: entryAtSelectedWeek?.revision ?? 0, earnings: earningRows.map((row) => ({ id: isSeparateWeek ? crypto.randomUUID() : row.id, platformCode: row.category as EarningItem["platformCode"], platformLabel: row.category === "other" ? row.label : null, amountCents: row.amountCents })), variableCosts: variableRows.map((row) => ({ id: isSeparateWeek ? crypto.randomUUID() : row.id, category: row.category as VariableCostItem["category"], label: row.label, amountCents: row.amountCents })), inputSnapshots: snapshots });
      navigate("/entries");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this week."); }
  };
  return <Shell><form className="mx-auto max-w-4xl" onSubmit={submit}><p className="eyebrow">Weekly entry</p><h1 className="mt-2 text-3xl font-black">{existing ? "Edit" : "Add"} a week</h1><div className="card mt-6 space-y-5"><label><span className="label">Week starting</span><input type="date" value={draft.weekStart} onChange={(e) => setDraft({ ...draft, weekStart: e.target.value })}/><span className="mt-1 block text-xs text-slate-500">Use Monday to keep weeks comparable.</span></label><label className="flex items-center gap-3"><input className="!h-5 !min-h-0 !w-5" checked={draft.noIncome} type="checkbox" onChange={(e) => setDraft({ ...draft, noIncome: e.target.checked, earnings: e.target.checked ? [] : draft.earnings })}/><span className="font-semibold">I had no platform income this week</span></label>{!draft.noIncome && <MoneyRows categories={EARNING_CATEGORIES} onChange={(earnings) => setDraft({ ...draft, earnings })} rows={draft.earnings} title="Earnings"/>}<MoneyRows categories={VARIABLE_CATEGORIES} onChange={(variable) => setDraft({ ...draft, variable })} rows={draft.variable} title="Variable work costs"/><label><span className="label">Emergency savings balance</span><input inputMode="decimal" value={draft.emergency} onChange={(e) => setDraft({ ...draft, emergency: e.target.value })}/></label>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-800" role="alert">{error}</p>}<div className="flex justify-end gap-3"><Link className="button-secondary" to="/entries">Cancel</Link><button className="button-primary" type="submit">Save week</button></div></div></form></Shell>;
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
  return <main className="mx-auto max-w-4xl px-4 py-10"><div className="text-center"><img alt="" className="mx-auto h-14 w-14" src="/resilience-icon.svg"/><p className="eyebrow mt-5">Two-minute setup</p><h1 className="mt-2 text-4xl font-black">Build your financial foundation</h1><p className="mx-auto mt-3 max-w-2xl text-slate-600">Enter what you know today. You can change every amount later, and nothing here is financial advice.</p></div><form className="card mt-8 space-y-7" onSubmit={submit}><label><span className="label">Emergency savings available now</span><input inputMode="decimal" value={emergency} onChange={(e) => setEmergency(e.target.value)}/></label><MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Recurring work costs"/><MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Essential household expenses"/>{error && <p className="rounded-xl bg-rose-50 p-3 text-rose-800" role="alert">{error}</p>}<button className="button-primary w-full" type="submit">Save and continue</button></form></main>;
}

function Settings() {
  const { data, saveAssumptions, resetData } = useFoundation();
  const [emergency, setEmergency] = useState(centsToInput(data.profile.latestEmergencySavingsCents));
  const [recurring, setRecurring] = useState(toEditable(data.recurringWorkCosts));
  const [essentials, setEssentials] = useState(toEditable(data.essentialExpenses));
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); setMessage(""); try { const r = parseRows(recurring, true, true).map((item) => ({ ...item, category: item.category as RecurringWorkCost["category"], cadence: item.cadence ?? "weekly", isActive: true })); const e = parseRows(essentials, true, true).map((item) => ({ ...item, category: item.category as EssentialExpense["category"], cadence: item.cadence ?? "weekly", isActive: true })); await saveAssumptions(parseMoneyToCents(emergency), r, e); setMessage("Saved on this device. It will sync automatically."); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save."); } };
  return <Shell><form className="mx-auto max-w-4xl" onSubmit={save}><p className="eyebrow">Editable assumptions</p><h1 className="mt-2 text-3xl font-black">Costs and emergency savings</h1><div className="card mt-6 space-y-7"><label><span className="label">Emergency savings balance</span><input inputMode="decimal" value={emergency} onChange={(e) => setEmergency(e.target.value)}/></label><MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Recurring work costs"/><MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Essential household expenses"/>{message && <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900" role="status">{message}</p>}<button className="button-primary" type="submit">Save assumptions</button></div></form><section className="mx-auto mt-6 max-w-4xl rounded-3xl border border-rose-200 bg-rose-50 p-5"><h2 className="font-bold text-rose-950">Reset demo data</h2><p className="mt-1 text-sm text-rose-800">Permanently deletes this anonymous demo profile and all its entries. You must be online.</p><button className="button-secondary mt-4 text-rose-700" onClick={() => { if (confirm("Reset all demo data? This cannot be undone.")) void resetData().catch((error: Error) => setMessage(error.message)); }} type="button">Reset all data</button></section></Shell>;
}

function ImportCsv() {
  const { data, online, saveWeek } = useFoundation();
  const [preview, setPreview] = useState<CsvPreview>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const validRows = useMemo(() => preview?.rows.filter((row) => row.status === "valid") ?? [], [preview]);
  const upload = async (file?: File) => { if (!file) return; setBusy(true); setMessage(""); try { setPreview(await previewCsv(file)); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not read this CSV."); } finally { setBusy(false); } };
  const addRows = async () => { if (!preview || preview.invalidCount) return; setBusy(true); try { const weeks = new Map<string, WeeklyEntry>(); for (const row of validRows) { const weekStart = row.weekStart!; const existing = weeks.get(weekStart) ?? data.weeklyEntries.find((item) => item.weekStart === weekStart) ?? { id: crypto.randomUUID(), weekStart, hadNoIncome: false, emergencySavingsCents: data.profile.latestEmergencySavingsCents, status: "confirmed" as const, revision: 0, earnings: [], variableCosts: [], inputSnapshots: createInputSnapshots(data.recurringWorkCosts, data.essentialExpenses) }; const copy: WeeklyEntry = { ...existing, earnings: [...existing.earnings], variableCosts: [...existing.variableCosts] }; if (row.recordType === "earning") { const code = EARNING_CATEGORIES.some((item) => item.value === row.source?.toLowerCase()) ? row.source!.toLowerCase() as EarningItem["platformCode"] : "other"; copy.earnings.push({ id: crypto.randomUUID(), platformCode: code, platformLabel: code === "other" ? row.source : null, amountCents: row.amountCents! }); } else { const category = VARIABLE_CATEGORIES.some((item) => item.value === row.category?.toLowerCase()) ? row.category!.toLowerCase() as VariableCostItem["category"] : "other"; copy.variableCosts.push({ id: crypto.randomUUID(), category, label: row.description!, amountCents: row.amountCents! }); } weeks.set(weekStart, copy); } for (const week of weeks.values()) await saveWeek(week); setMessage(`${validRows.length} row(s) added across ${weeks.size} week(s).`); setPreview(undefined); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not add these rows."); } finally { setBusy(false); } };
  return <Shell><p className="eyebrow">Strict CSV import</p><h1 className="mt-2 text-3xl font-black">Preview before adding</h1><div className="card mt-6"><p className="text-slate-600">Use the exact Resilience headers. The preview rejects invalid dates, types and money without changing your data.</p><div className="mt-4 flex flex-wrap gap-3"><a className="button-secondary" href={csvTemplateUrl}>Download template</a><label className={`button-primary ${!online ? "pointer-events-none opacity-50" : ""}`}>{busy ? "Checking…" : "Choose CSV"}<input accept=".csv,text/csv" className="sr-only" disabled={!online || busy} type="file" onChange={(e) => void upload(e.target.files?.[0])}/></label></div>{!online && <p className="mt-3 text-sm text-amber-800">Reconnect to validate a CSV.</p>}{message && <p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900" role="status">{message}</p>}</div>{preview && <section className="card mt-6 overflow-x-auto"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{preview.fileName}</h2><p className="text-sm text-slate-500">{preview.validCount} valid · {preview.invalidCount} invalid</p></div><button className="button-primary" disabled={busy || preview.invalidCount > 0 || preview.validCount === 0} onClick={() => void addRows()} type="button">Add valid rows</button></div><table className="mt-5 w-full min-w-[44rem] text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-2">Row</th><th>Status</th><th>Week</th><th>Type</th><th>Source / description</th><th>Amount</th></tr></thead><tbody>{preview.rows.map((row) => <tr className="border-b border-slate-100" key={row.rowNumber}><td className="p-2">{row.rowNumber}</td><td className={row.status === "valid" ? "text-emerald-700" : "text-rose-700"}>{row.status}</td><td>{row.weekStart ?? "—"}</td><td>{row.recordType ?? "—"}</td><td>{row.source ?? row.description ?? "—"}{row.errors.length > 0 && <p className="text-xs text-rose-700">{row.errors.join("; ")}</p>}</td><td>{row.amountCents == null ? "—" : formatMoney(row.amountCents)}</td></tr>)}</tbody></table></section>}</Shell>;
}

export function App() {
  const { data, loading } = useFoundation();
  if (loading) return <div className="grid min-h-screen place-items-center"><div className="text-center"><img alt="" className="mx-auto h-14 w-14 animate-pulse" src="/resilience-icon.svg"/><p className="mt-3 font-semibold">Loading your foundation…</p></div></div>;
  return <Routes><Route path="/onboarding" element={data.profile.onboardingCompleted ? <Navigate replace to="/"/> : <Onboarding/>}/><Route path="*" element={!data.profile.onboardingCompleted ? <Navigate replace to="/onboarding"/> : <Routes><Route path="/" element={<Overview/>}/><Route path="/entries" element={<Entries/>}/><Route path="/entries/:weekStart" element={<WeekEditor/>}/><Route path="/income-reality" element={<IncomeReality/>}/><Route path="/import" element={<ImportCsv/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Navigate replace to="/"/>}/></Routes>}/></Routes>;
}
