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
import { useAuth } from "../auth/AuthContext";
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
  Transaction,
  WeeklyEntry
} from "../../types/foundation";

const EMPTY_BOOTSTRAP: FoundationBootstrap = {
  profile: {
    id: "",
    currency: "SGD",
    timezone: "Asia/Singapore",
    onboardingCompleted: false,
    latestEmergencySavingsCents: 0,
    emergencyFundBalanceCents: 0
  },
  recurringWorkCosts: [],
  essentialExpenses: [],
  weeklyEntries: [],
  transactions: [],
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
  saveTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  saveAssumptions: (
    recurring: RecurringWorkCost[],
    essentials: EssentialExpense[]
  ) => Promise<void>;
  resetData: () => Promise<void>;
}

const FoundationContext = createContext<FoundationContextValue | null>(null);

export function FoundationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ownerId = user?.id;
  const [data, setData] = useState(EMPTY_BOOTSTRAP);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState<PendingMutation[]>([]);
  const syncing = useRef(false);

  const loadPending = useCallback(async () => {
    setPending(ownerId ? await offlineDb.mutations.where("ownerId").equals(ownerId).sortBy("createdAt") : []);
  }, [ownerId]);

  const updateLocal = useCallback(async (next: FoundationBootstrap) => {
    setData(next);
    if (ownerId) await cacheBootstrap(ownerId, next);
  }, [ownerId]);

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !ownerId) return;
    const next = await fetchBootstrap();
    await updateLocal(next);
  }, [ownerId, updateLocal]);

  const syncNow = useCallback(async () => {
    if (syncing.current || !navigator.onLine || !ownerId) return;
    syncing.current = true;
    try {
      const queue = await offlineDb.mutations.where("ownerId").equals(ownerId).sortBy("createdAt");
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
              error: error.payload
            });
          } else {
            await offlineDb.mutations.update(mutation.id, { status: "failed" });
          }
          break;
        }
      }
      await loadPending();
      const conflicts = await offlineDb.mutations.where("[ownerId+status]").equals([ownerId, "conflict"]).count();
      if (conflicts === 0) await refresh();
    } finally {
      syncing.current = false;
    }
  }, [loadPending, ownerId, refresh]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!ownerId) { setData(EMPTY_BOOTSTRAP); setLoading(false); return; }
      const cached = await readCachedBootstrap(ownerId);
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
    const handleEmergencyFundChange = () => { void refresh(); };
    window.addEventListener("resilience:emergency-fund-changed", handleEmergencyFundChange);
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resilience:emergency-fund-changed", handleEmergencyFundChange);
    };
  }, [loadPending, ownerId, refresh, syncNow]);

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
        ownerId: ownerId!,
        method,
        path,
        body,
        createdAt: new Date().toISOString(),
        status: "pending"
      });
      const current = (await readCachedBootstrap(ownerId!)) ?? data;
      await updateLocal(optimistic(current));
      await loadPending();
      await syncNow();
    },
    [data, loadPending, ownerId, syncNow, updateLocal]
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
            latestEmergencySavingsCents: payload.emergencySavingsCents as number,
            // Onboarding writes the opening balance with no ledger activity yet,
            // so the balance and the opening balance start out equal.
            emergencyFundBalanceCents: payload.emergencySavingsCents as number
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

  const saveTransaction = useCallback(async (transaction: Omit<Transaction, "id">) => {
    await apiRequest("/foundation/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });
    await refresh();
  }, [refresh]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    await apiRequest(`/foundation/transactions/${transactionId}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const saveAssumptions = useCallback(
    async (
      recurring: RecurringWorkCost[],
      essentials: EssentialExpense[]
    ) => {
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
        const server = mutation.error?.details?.serverRecord;
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
    if (!navigator.onLine) throw new Error("Reconnect before deleting your data.");
    await apiRequest<FoundationBootstrap>("/foundation/data", {
      method: "DELETE",
      headers: { "X-Confirm-Reset": "RESET DEMO DATA" }
    });
    if (ownerId) await clearOfflineData(ownerId);
    await refresh();
    await loadPending();
  }, [loadPending, ownerId, refresh]);

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
        saveTransaction,
        deleteTransaction,
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
