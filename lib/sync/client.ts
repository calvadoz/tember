import { applyRemoteSnapshot, getSyncSnapshot } from "@/lib/db/database";
import type { SyncSnapshot, SyncStatus } from "@/lib/sync/types";

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Tember could not sync right now.");
  return body as T;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return jsonRequest<SyncStatus>("/api/sync/status");
}

export async function createSharedAccount(username: string, password: string): Promise<void> {
  await jsonRequest("/api/sync/setup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function signInToSync(username: string, password: string): Promise<void> {
  await jsonRequest("/api/sync/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function signOutOfSync(): Promise<void> {
  await jsonRequest("/api/sync/logout", { method: "POST", body: "{}" });
}

export async function syncNow(): Promise<void> {
  const local = await getSyncSnapshot();
  const remote = await jsonRequest<SyncSnapshot>("/api/sync/records", {
    method: "POST",
    body: JSON.stringify(local),
  });
  await applyRemoteSnapshot(remote);
}

export async function pullLatestSync(): Promise<void> {
  const remote = await jsonRequest<SyncSnapshot>("/api/sync/records");
  await applyRemoteSnapshot(remote);
}

export function requestSync(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("tember-local-change"));
}
