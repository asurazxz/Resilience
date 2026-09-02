import Dexie, { type EntityTable } from "dexie";

import type { ApiErrorBody, FoundationBootstrap } from "../types/foundation";

export interface PendingMutation {
  id: string;
  method: "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  createdAt: string;
  status: "pending" | "syncing" | "conflict" | "failed";
  error?: ApiErrorBody;
}

class ResilienceDatabase extends Dexie {
  bootstrap!: EntityTable<{ key: string; value: FoundationBootstrap }, "key">;
  mutations!: EntityTable<PendingMutation, "id">;

  constructor() {
    super("resilience-foundation");
    this.version(1).stores({
      bootstrap: "key",
      mutations: "id, status, createdAt"
    });
  }
}

export const offlineDb = new ResilienceDatabase();

export const cacheBootstrap = (value: FoundationBootstrap) =>
  offlineDb.bootstrap.put({ key: "current", value });

export async function readCachedBootstrap(): Promise<FoundationBootstrap | undefined> {
  return (await offlineDb.bootstrap.get("current"))?.value;
}

export async function clearOfflineData(): Promise<void> {
  await offlineDb.transaction("rw", offlineDb.bootstrap, offlineDb.mutations, async () => {
    await offlineDb.bootstrap.clear();
    await offlineDb.mutations.clear();
  });
}
