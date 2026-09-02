import { lazy, Suspense, type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { MoneyRows, type EditableMoneyRow } from "../components/MoneyRows";
import { useFoundation } from "../features/foundation-input/FoundationContext";
import { adaptFoundationWeeks } from "../features/income-reality/foundationAdapter";
import { readCachedSummary } from "../features/resilience-jar/api";
import { FixtureResilienceJarApi } from "../features/resilience-jar/fixtureApi";
import { ChatProvider } from "../features/scheme-navigator/ChatContext";
import { ChatWidget } from "../features/scheme-navigator/ChatWidget";
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
      <button className="fixed bottom-4 left-4 z-30 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl" onClick={() => setOpen(!open)} type="button">
        {online ? "Online" : "Offline"} · {pending.length} pending
      </button>
      {open && (
        <aside className="fixed bottom-20 left-4 z-30 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl" aria-label="Sync status">
          <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Device sync</p><h2 className="mt-1 text-xl font-bold">{pending.length ? "Changes waiting" : "Everything is synced"}</h2></div><button onClick={() => setOpen(false)} type="button">Close</button></div>
          {pending.map((item) => <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" key={item.id}><strong>{item.status}</strong><p className="mt-1 break-all text-slate-600">{item.method} {item.path}</p>{item.error && <p className="mt-1 text-rose-700">{item.error.error.message}</p>}{item.status === "conflict" && <div className="mt-2 flex gap-2"><button className="button-secondary !min-h-9 !px-3" onClick={() => void resolveConflict(item.id, false)}>Use server</button><button className="button-primary !min-h-9 !px-3" onClick={() => void resolveConflict(item.id, true)}>Keep mine</button></div>}</div>)}
          <button className="button-primary mt-4 w-full" disabled={!online || conflicts.length > 0 || pending.length === 0} onClick={() => void syncNow()} type="button">Sync now</button>
        </aside>
      )}
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [["/", "Home"], ["/entries", "Weekly entries"], ["/income-reality", "Income overview"], ["/resilience-jar", "Emergency fund"], ["/scenario-simulator", "Setback planner"], ["/scheme-navigator", "Schemes"], ["/import", "Import"], ["/settings", "Regular costs"]];
  return <div className="resilience-app min-h-screen"><header className="site-header fixed inset-x-0 top-0 z-40 backdrop-blur"><div className="site-header-inner"><Link className="site-brand" onClick={() => setMenuOpen(false)} to="/"><img alt="" src="/resilience-icon.svg"/><div><strong className="block text-base">Resilience</strong><span className="hidden sm:block">Know your buffer</span></div></Link><button aria-controls="primary-navigation" aria-expanded={menuOpen} className="nav-toggle" onClick={() => setMenuOpen((open) => !open)} type="button">{menuOpen ? "Close" : "Menu"}</button><nav className={`site-nav ${menuOpen ? "site-nav-open" : ""}`} id="primary-navigation" aria-label="Primary">{nav.map(([to, label]) => <NavLink className="shrink-0" end={to === "/"} key={to} onClick={() => setMenuOpen(false)} to={to}>{label}</NavLink>)}</nav></div></header><main className="mx-auto max-w-6xl px-4 pb-8 pt-24">{children}</main><SyncStatus /></div>;
}

function EmergencyFund({ view }: { view: "jar" | "plan" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const api = useMemo(() => new FixtureResilienceJarApi(readCachedSummary()), []);

  return (
    <Shell>
      <Suspense fallback={<FeatureLoader />}>
        <ResilienceJarPage
          api={api}
          view={view}
          startWithEmergencyUse={searchParams.get("action") === "emergency-use"}
          onNavigate={(path) => navigate(path)}
        />
      </Suspense>
    </Shell>
  );
}

function IncomeReality() {
  const { data, online } = useFoundation();
  const adapted = useMemo(
    () => adaptFoundationWeeks(data.weeklyEntries),
    [data.weeklyEntries],
  );

  return (
    <Shell>
      <p className="eyebrow">Income overview</p>
      <h1 className="mt-2 text-3xl font-black">See where each week's money went</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Compare income, work costs, and everyday essentials. Start with the chart, then open a week only when you want its details.
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
  return <Shell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your home</p><h1 className="mt-2 text-4xl font-black tracking-tight">Your money at a glance</h1><p className="mt-2 max-w-2xl text-slate-600">Add this week's income and costs, then use the other tabs when you need a deeper look.</p></div><Link className="button-primary" to="/entries/new">Add this week</Link></div><section className="mt-8 grid gap-4 md:grid-cols-3"><Metric label="Income in latest week" value={formatMoney(income)} detail={latest?.weekStart ?? "No week recorded"}/><Metric label="Regular weekly costs" value={formatMoney(weeklyFixed)} detail="Includes weekly share of monthly costs"/><Metric label="Money left in latest week" value={formatMoney(takeHome)} detail="After work and regular costs" tone={takeHome < 0 ? "rose" : "indigo"}/></section><section className="card mt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Emergency savings</p><h2 className="mt-1 text-2xl font-bold">{formatMoney(data.profile.latestEmergencySavingsCents)}</h2><p className="mt-1 text-sm text-slate-500">Use the Emergency Fund tab to record money added or used.</p></div><Link className="button-secondary" to="/resilience-jar">Open emergency fund</Link></div></section><section className="mt-6 grid gap-4 md:grid-cols-2"><Link className="card transition hover:border-indigo-300" to="/entries"><h2 className="text-xl font-bold">Your weekly entries</h2><p className="mt-2 text-slate-600">Add, review, or correct a week.</p></Link><Link className="card transition hover:border-indigo-300" to="/income-reality"><h2 className="text-xl font-bold">See your income pattern</h2><p className="mt-2 text-slate-600">Use a simple chart to compare recent weeks.</p></Link></section></Shell>;
}

function Metric({ label, value, detail, tone = "indigo" }: { label: string; value: string; detail: string; tone?: "indigo" | "rose" }) {
  return <div className={`card border-t-4 ${tone === "rose" ? "border-t-rose-500" : "border-t-indigo-600"}`}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>;
}

function Entries() {
  const { data, deleteWeek } = useFoundation();
  return <Shell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Weekly entries</p><h1 className="mt-2 text-3xl font-black">Income and costs by week</h1><p className="mt-2 text-slate-600">Keep one clear record for each week. Open a week to make corrections.</p></div><Link className="button-primary" to="/entries/new">Add this week</Link></div><div className="card mt-6 divide-y divide-slate-200 p-0">{data.weeklyEntries.length === 0 && <div className="p-6 text-slate-600">No weekly entries yet.</div>}{data.weeklyEntries.map((entry) => <article className="flex flex-wrap items-center justify-between gap-4 p-4" key={entry.id}><div><p className="font-bold">Week of {entry.weekStart}</p><p className="mt-1 text-sm text-slate-500">{entry.hadNoIncome ? "No income recorded" : `${entry.earnings.length} income source${entry.earnings.length === 1 ? "" : "s"}`}</p></div><div className="text-right"><p className="text-xl font-black">{formatMoney(sum(entry.earnings) - sum(entry.variableCosts))}</p><p className="text-xs text-slate-500">after work costs</p></div><div className="flex gap-2"><Link className="button-secondary" to={`/entries/${entry.weekStart}`}>Open</Link><button className="button-secondary text-rose-700" onClick={() => { if (confirm(`Delete the week of ${entry.weekStart}?`)) void deleteWeek(entry.weekStart); }} type="button">Delete</button></div></article>)}</div></Shell>;
}

interface WeekDraft { weekStart: string; noIncome: boolean; earnings: EditableMoneyRow[]; variable: EditableMoneyRow[]; }

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
      await saveWeek({ id: entryAtSelectedWeek?.id ?? crypto.randomUUID(), weekStart: draft.weekStart, hadNoIncome: draft.noIncome, emergencySavingsCents: existing?.emergencySavingsCents ?? data.profile.latestEmergencySavingsCents, status: "confirmed", revision: entryAtSelectedWeek?.revision ?? 0, earnings: earningRows.map((row) => ({ id: isSeparateWeek ? crypto.randomUUID() : row.id, platformCode: row.category as EarningItem["platformCode"], platformLabel: row.category === "other" ? row.label : null, amountCents: row.amountCents })), variableCosts: variableRows.map((row) => ({ id: isSeparateWeek ? crypto.randomUUID() : row.id, category: row.category as VariableCostItem["category"], label: row.label, amountCents: row.amountCents })), inputSnapshots: snapshots });
      navigate("/entries");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this week."); }
  };
  return <Shell><form className="mx-auto max-w-4xl" onSubmit={submit}><p className="eyebrow">Weekly entry</p><h1 className="mt-2 text-3xl font-black">{existing ? "Update this week" : "Add a week"}</h1><p className="mt-2 text-slate-600">Record only what came in and what you spent to do the work.</p><div className="card mt-6 space-y-5"><label><span className="label">Week starting</span><input required type="date" value={draft.weekStart} onChange={(e) => setDraft({ ...draft, weekStart: e.target.value })}/><span className="mt-1 block text-xs text-slate-500">Choose a Monday so weeks line up correctly.</span></label><label className="flex items-center gap-3"><input className="!h-5 !min-h-0 !w-5" checked={draft.noIncome} type="checkbox" onChange={(e) => setDraft({ ...draft, noIncome: e.target.checked, earnings: e.target.checked ? [] : draft.earnings })}/><span className="font-semibold">I had no platform income this week</span></label>{!draft.noIncome && <MoneyRows categories={EARNING_CATEGORIES} descriptionRequired={false} onChange={(earnings) => setDraft({ ...draft, earnings })} rows={draft.earnings} title="Money earned"/>}<MoneyRows categories={VARIABLE_CATEGORIES} onChange={(variable) => setDraft({ ...draft, variable })} rows={draft.variable} title="Costs for doing the work"/><aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-bold text-amber-950">Did you use emergency savings?</h2><p className="mt-1 text-sm text-amber-900">Keep emergency fund activity in one place instead of changing a balance here.</p><Link className="button-secondary mt-3" to="/resilience-jar?action=emergency-use">Record emergency use</Link></aside>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-800" role="alert">{error}</p>}<div className="flex justify-end gap-3"><Link className="button-secondary" to="/entries">Cancel</Link><button className="button-primary" type="submit">Save week</button></div></div></form></Shell>;
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
  const [emergency, setEmergency] = useState(centsToInput(data.profile.latestEmergencySavingsCents));
  const [recurring, setRecurring] = useState(toEditable(data.recurringWorkCosts));
  const [essentials, setEssentials] = useState(toEditable(data.essentialExpenses));
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent) => { event.preventDefault(); setMessage(""); try { const r = parseRows(recurring, true, true).map((item) => ({ ...item, category: item.category as RecurringWorkCost["category"], cadence: item.cadence ?? "weekly", isActive: true })); const e = parseRows(essentials, true, true).map((item) => ({ ...item, category: item.category as EssentialExpense["category"], cadence: item.cadence ?? "weekly", isActive: true })); await saveAssumptions(parseMoneyToCents(emergency), r, e); setMessage("Saved on this device. It will sync automatically."); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save."); } };
  return <Shell><form className="mx-auto max-w-4xl" onSubmit={save}><p className="eyebrow">Regular costs</p><h1 className="mt-2 text-3xl font-black">Update your starting amounts</h1><p className="mt-2 text-slate-600">These amounts help Resilience estimate what is left each week.</p><div className="card mt-6 space-y-7"><label><span className="label">Emergency savings available now</span><input inputMode="decimal" maxLength={10} pattern="\d+(\.\d{0,2})?" required title="Enter an amount with up to two decimal places" value={emergency} onChange={(e) => setEmergency(e.target.value)}/></label><MoneyRows cadence categories={WORK_CATEGORIES} onChange={setRecurring} rows={recurring} title="Regular work costs"/><MoneyRows cadence categories={ESSENTIAL_CATEGORIES} onChange={setEssentials} rows={essentials} title="Everyday essentials"/>{message && <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900" role="status">{message}</p>}<button className="button-primary" type="submit">Save changes</button></div></form><section className="mx-auto mt-6 max-w-4xl rounded-3xl border border-rose-200 bg-rose-50 p-5"><h2 className="font-bold text-rose-950">Reset demo data</h2><p className="mt-1 text-sm text-rose-800">Permanently deletes this anonymous demo profile and all its entries. You must be online.</p><button className="button-secondary mt-4 text-rose-700" onClick={() => { if (confirm("Reset all demo data? This cannot be undone.")) void resetData().catch((error: Error) => setMessage(error.message)); }} type="button">Reset all data</button></section></Shell>;
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
  return (
    <ChatProvider>
      <Routes>
        <Route path="/onboarding" element={data.profile.onboardingCompleted ? <Navigate replace to="/" /> : <Onboarding />} />
        <Route path="*" element={!data.profile.onboardingCompleted ? <Navigate replace to="/onboarding" /> : (
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/entries/:weekStart" element={<WeekEditor />} />
            <Route path="/income-reality" element={<IncomeReality />} />
            <Route path="/resilience-jar" element={<EmergencyFund view="jar" />} />
            <Route path="/resilience-jar/plan" element={<EmergencyFund view="plan" />} />
            <Route path="/scenario-simulator" element={<Shell><Suspense fallback={<FeatureLoader />}><ScenarioSimulatorPage /></Suspense></Shell>} />
            <Route path="/scheme-navigator" element={<Shell><Suspense fallback={<FeatureLoader />}><SchemeNavigator /></Suspense></Shell>} />
            <Route path="/import" element={<ImportCsv />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        )} />
      </Routes>
      <ChatWidget />
    </ChatProvider>
  );
}
