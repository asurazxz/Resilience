import Dexie, { type EntityTable } from "dexie";

import type { ApiErrorPayload, FoundationBootstrap } from "../types/foundation";

export interface PendingMutation {
  id: string;
  ownerId: string;
  method: "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  createdAt: string;
  status: "pending" | "syncing" | "conflict" | "failed";
  error?: ApiErrorPayload;
}

class ResilienceDatabase extends Dexie {
  bootstrap!: EntityTable<{ key: string; value: FoundationBootstrap }, "key">;
  mutations!: EntityTable<PendingMutation, "id">;

  constructor() {
    super("resilience-foundation");
    this.version(2).stores({
      bootstrap: "key",
      mutations: "id, ownerId, [ownerId+status], [ownerId+createdAt]"
    });
    // v2 caches predate `emergencyFundBalanceCents`; the v3 upgrade discards
    // those stale bootstraps outright rather than patching around them.
    this.version(3).stores({
      bootstrap: "key",
      mutations: "id, ownerId, [ownerId+status], [ownerId+createdAt]"
    }).upgrade(async (tx) => {
      await tx.table("bootstrap").clear();
    });
  }
}

export const offlineDb = new ResilienceDatabase();

const bootstrapKey = (ownerId: string) => `bootstrap:${ownerId}`;

export const cacheBootstrap = (ownerId: string, value: FoundationBootstrap) =>
  offlineDb.bootstrap.put({ key: bootstrapKey(ownerId), value });

export async function readCachedBootstrap(ownerId: string): Promise<FoundationBootstrap | undefined> {
  return (await offlineDb.bootstrap.get(bootstrapKey(ownerId)))?.value;
}

export async function clearOfflineData(ownerId?: string): Promise<void> {
  await offlineDb.transaction("rw", offlineDb.bootstrap, offlineDb.mutations, async () => {
    if (!ownerId) {
      await offlineDb.bootstrap.clear();
      await offlineDb.mutations.clear();
      return;
    }
    await offlineDb.bootstrap.delete(bootstrapKey(ownerId));
    await offlineDb.mutations.where("ownerId").equals(ownerId).delete();
  });
}
