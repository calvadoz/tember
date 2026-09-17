import "server-only";

import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;
let schemaReady: Promise<void> | undefined;

export function isSyncConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

function getClient(): Client {
  if (!isSyncConfigured()) throw new Error("Cloud sync is not configured.");
  client ??= createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  return client;
}

export async function ensureRemoteSchema(): Promise<Client> {
  if (!schemaReady) {
    const database = getClient();
    schemaReady = database
      .batch(
        [
          "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)",
          "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)",
          "CREATE INDEX IF NOT EXISTS sessions_account_id ON sessions(account_id)",
          "CREATE TABLE IF NOT EXISTS pets (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)",
          "CREATE INDEX IF NOT EXISTS pets_account_id ON pets(account_id)",
          "CREATE TABLE IF NOT EXISTS measurements (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)",
          "CREATE INDEX IF NOT EXISTS measurements_account_id ON measurements(account_id)",
          "CREATE TABLE IF NOT EXISTS vaccinations (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)",
          "CREATE INDEX IF NOT EXISTS vaccinations_account_id ON vaccinations(account_id)",
        ],
        "write",
      )
      .then(() => undefined);
  }
  await schemaReady;
  return getClient();
}
