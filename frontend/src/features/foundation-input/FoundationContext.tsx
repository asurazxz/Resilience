import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import { ApiError, apiRequest, fetchBootstrap } from "../../lib/api";
import {
  cacheBootstrap,
  clearOfflineData,
  offlineDb,
  type PendingMutation,
  readCachedBootstrap
} from "../../lib/offline";
import type {
  EssentialExpense,
  FoundationBootstrap,
  RecurringWorkCost,
  WeeklyEntry
} from "../../types/foundation";

const EMPTY_BOOTSTRAP: FoundationBootstrap = {
  profile: {
    id: "00000000-0000-4000-8000-000000000001",
    currency: "SGD",
    timezone: "Asia/Singapore",
    onboardingCompleted: false,
    latestEmergencySavingsCents: 0
  },
  recurringWorkCosts: [],
  essentialExpenses: [],
  weeklyEntries: [],
  syncedAt: new Date(0).toISOString()
};

interface FoundationContextValue {
  data: FoundationBootstrap;
  loading: boolean;
  online: boolean;
  pending: PendingMutation[];
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (id: string, keepLocal: boolean) => Promise<void>;
  saveOnboarding: (payload: Record<string, unknown>) => Promise<void>;
  saveWeek: (week: WeeklyEntry) => Promise<void>;
  deleteWeek: (weekStart: string) => Promise<void>;
  saveAssumptions: (
    emergencySavingsCents: number,
    recurring: RecurringWorkCost[],
    essentials: EssentialExpense[]
  ) => Promise<void>;
  resetData: () => Promise<void>;
}

const FoundationContext = createContext<FoundationContextValue | null>(null);

export function FoundationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(EMPTY_BOOTSTRAP);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState<PendingMutation[]>([]);
  const syncing = useRef(false);

  const loadPending = useCallback(async () => {
    setPending(await offlineDb.mutations.orderBy("createdAt").toArray());
  }, []);

  const updateLocal = useCallback(async (next: FoundationBootstrap) => {
    setData(next);
    await cacheBootstrap(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    const next = await fetchBootstrap();
    await updateLocal(next);
  }, [updateLocal]);

  const syncNow = useCallback(async () => {
    if (syncing.current || !navigator.onLine) return;
    syncing.current = true;
    try {
      const queue = await offlineDb.mutations.orderBy("createdAt").toArray();
      for (const mutation of queue) {
        if (mutation.status === "conflict") break;
        await offlineDb.mutations.update(mutation.id, { status: "syncing", error: undefined });
        try {
          await apiRequest(mutation.path, {
            method: mutation.method,
            body: mutation.body === undefined ? undefined : JSON.stringify(mutation.body)
          }, mutation.id);
          await offlineDb.mutations.delete(mutation.id);
        } catch (error) {
          if (error instanceof ApiError) {
            await offlineDb.mutations.update(mutation.id, {
              status: error.status === 409 ? "conflict" : "failed",
              error: error.body
            });
          } else {
            await offlineDb.mutations.update(mutation.id, { status: "failed" });
          }
          break;
        }
      }
      await loadPending();
      const conflicts = await offlineDb.mutations.where("status").equals("conflict").count();
      if (conflicts === 0) await refresh();
    } finally {
      syncing.current = false;
    }
  }, [loadPending, refresh]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const cached = await readCachedBootstrap();
      if (active && cached) setData(cached);
      await loadPending();
      try {
        await refresh();
      } catch {
        // Cached data remains the explicit offline fallback.
      } finally {
        if (active) setLoading(false);
      }
      await syncNow();
    })();
    const handleOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadPending, refresh, syncNow]);

  const enqueue = useCallback(
    async (
      method: PendingMutation["method"],
      path: string,
      body: unknown,
      optimistic: (current: FoundationBootstrap) => FoundationBootstrap
    ) => {
      const id = crypto.randomUUID();
      await offlineDb.mutations.put({
        id,
        method,
        path,
        body,
        createdAt: new Date().toISOString(),
        status: "pending"
      });
      const current = (await readCachedBootstrap()) ?? data;
      await updateLocal(optimistic(current));
      await loadPending();
      await syncNow();
    },
    [data, loadPending, syncNow, updateLocal]
  );

  const saveOnboarding = useCallback(
    async (payload: Record<string, unknown>) => {
      await enqueue("PUT", "/foundation/onboarding", payload, (current) => {
        const firstWeek = payload.firstWeek as WeeklyEntry | undefined;
        const weekStart = payload.firstWeekStart as string | undefined;
        return {
          ...current,
          profile: {
            ...current.profile,
            onboardingCompleted: true,
            latestEmergencySavingsCents: payload.emergencySavingsCents as number
          },
          recurringWorkCosts: payload.recurringWorkCosts as RecurringWorkCost[],
          essentialExpenses: payload.essentialExpenses as EssentialExpense[],
          weeklyEntries:
            firstWeek && weekStart
              ? [{ ...firstWeek, weekStart, revision: 1 }, ...current.weeklyEntries]
              : current.weeklyEntries
        };
      });
      localStorage.removeItem("resilience-onboarding-draft");
    },
    [enqueue]
  );

  const saveWeek = useCallback(
    async (week: WeeklyEntry) => {
      const existing = data.weeklyEntries.find((item) => item.weekStart === week.weekStart);
      const body = {
        id: week.id,
        expectedRevision: existing?.revision ?? null,
        hadNoIncome: week.hadNoIncome,
        emergencySavingsCents: week.emergencySavingsCents,
        status: week.status,
        earnings: week.earnings,
        variableCosts: week.variableCosts,
        inputSnapshots: week.inputSnapshots
      };
      await enqueue("PUT", `/foundation/weeks/${week.weekStart}`, body, (current) => ({
        ...current,
        profile: {
          ...current.profile,
          latestEmergencySavingsCents: week.emergencySavingsCents
        },
        weeklyEntries: [
          { ...week, revision: existing ? existing.revision + 1 : 1 },
          ...current.weeklyEntries.filter((item) => item.weekStart !== week.weekStart)
        ].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      }));
    },
    [data.weeklyEntries, enqueue]
  );

  const deleteWeekAction = useCallback(
    async (weekStart: string) => {
      await enqueue("DELETE", `/foundation/weeks/${weekStart}`, undefined, (current) => ({
        ...current,
        weeklyEntries: current.weeklyEntries.filter((item) => item.weekStart !== weekStart)
      }));
    },
    [enqueue]
  );

  const saveAssumptions = useCallback(
    async (
      emergencySavingsCents: number,
      recurring: RecurringWorkCost[],
      essentials: EssentialExpense[]
    ) => {
      await enqueue(
        "PATCH",
        "/foundation/profile",
        { latestEmergencySavingsCents: emergencySavingsCents },
        (current) => ({
          ...current,
          profile: { ...current.profile, latestEmergencySavingsCents: emergencySavingsCents }
        })
      );
      const existingRecurring = new Set(data.recurringWorkCosts.map((item) => item.id));
      const nextRecurring = new Set(recurring.map((item) => item.id));
      for (const item of recurring) {
        await enqueue("PUT", `/foundation/recurring-work-costs/${item.id}`, item, (current) => ({
          ...current,
          recurringWorkCosts: [item, ...current.recurringWorkCosts.filter((x) => x.id !== item.id)]
        }));
      }
      for (const id of [...existingRecurring].filter((id) => !nextRecurring.has(id))) {
        await enqueue("DELETE", `/foundation/recurring-work-costs/${id}`, undefined, (current) => ({
          ...current,
          recurringWorkCosts: current.recurringWorkCosts.filter((item) => item.id !== id)
        }));
      }
      const existingEssentials = new Set(data.essentialExpenses.map((item) => item.id));
      const nextEssentials = new Set(essentials.map((item) => item.id));
      for (const item of essentials) {
        await enqueue("PUT", `/foundation/essential-expenses/${item.id}`, item, (current) => ({
          ...current,
          essentialExpenses: [item, ...current.essentialExpenses.filter((x) => x.id !== item.id)]
        }));
      }
      for (const id of [...existingEssentials].filter((id) => !nextEssentials.has(id))) {
        await enqueue("DELETE", `/foundation/essential-expenses/${id}`, undefined, (current) => ({
          ...current,
          essentialExpenses: current.essentialExpenses.filter((item) => item.id !== id)
        }));
      }
    },
    [data.essentialExpenses, data.recurringWorkCosts, enqueue]
  );

  const resolveConflict = useCallback(
    async (id: string, keepLocal: boolean) => {
      const mutation = await offlineDb.mutations.get(id);
      if (!mutation) return;
      if (!keepLocal) {
        await offlineDb.mutations.delete(id);
        await refresh();
      } else {
        const server = mutation.error?.error.details?.serverRecord;
        const body = mutation.body as Record<string, unknown>;
        await offlineDb.mutations.update(id, {
          status: "pending",
          body: server
            ? { ...body, id: server.id, expectedRevision: server.revision }
            : { ...body, expectedRevision: null },
          error: undefined
        });
        await syncNow();
      }
      await loadPending();
    },
    [loadPending, refresh, syncNow]
  );

  const resetData = useCallback(async () => {
    if (!navigator.onLine) throw new Error("Reconnect before resetting demo data.");
    await apiRequest<FoundationBootstrap>("/foundation/data", {
      method: "DELETE",
      headers: { "X-Confirm-Reset": "RESET DEMO DATA" }
    });
    await clearOfflineData();
    await refresh();
    await loadPending();
  }, [loadPending, refresh]);

  return (
    <FoundationContext.Provider
      value={{
        data,
        loading,
        online,
        pending,
        refresh,
        syncNow,
        resolveConflict,
        saveOnboarding,
        saveWeek,
        deleteWeek: deleteWeekAction,
        saveAssumptions,
        resetData
      }}
    >
      {children}
    </FoundationContext.Provider>
  );
}

export function useFoundation(): FoundationContextValue {
  const value = useContext(FoundationContext);
  if (!value) throw new Error("useFoundation must be used inside FoundationProvider");
  return value;
}
