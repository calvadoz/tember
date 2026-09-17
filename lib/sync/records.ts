import "server-only";

import type { Measurement, Pet } from "@/lib/domain";
import type { SyncSnapshot, Tombstone } from "@/lib/sync/types";
import { ensureRemoteSchema } from "@/lib/sync/turso";

const legacyPortraitSources: Record<string, string> = {
  "00000000-0000-4000-8000-000000000001": "/images/pets/debbie.png",
  "00000000-0000-4000-8000-000000000002": "/images/pets/jake.png",
  "59915277-c742-430c-aa98-09fe1b737b2b": "/images/pets/mochi.png",
};

function isIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isValidTombstone(value: unknown): value is Tombstone {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.entityId === "string" &&
    (item.entityType === "pet" || item.entityType === "measurement") &&
    isIso(item.deletedAt)
  );
}

function isRecordWithDates(value: unknown): value is Pet | Measurement {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && isIso(item.createdAt) && isIso(item.updatedAt);
}

export function parseSnapshot(value: unknown): SyncSnapshot | undefined {
  if (!value || typeof value !== "object") return undefined;
  const snapshot = value as Partial<SyncSnapshot>;
  if (!Array.isArray(snapshot.pets) || !Array.isArray(snapshot.measurements) || !Array.isArray(snapshot.tombstones)) return undefined;
  if (!snapshot.pets.every(isRecordWithDates) || !snapshot.measurements.every(isRecordWithDates) || !snapshot.tombstones.every(isValidTombstone)) return undefined;
  return snapshot as SyncSnapshot;
}

export async function mergeSnapshot(accountId: string, snapshot: SyncSnapshot): Promise<SyncSnapshot> {
  const database = await ensureRemoteSchema();
  const records = [
    ...snapshot.pets.map((record) => ({ table: "pets" as const, record })),
    ...snapshot.measurements.map((record) => ({
      table: "measurements" as const,
      record,
    })),
  ];
  await database.batch(
    [
      ...records.map(({ table, record }) => ({
        sql: `INSERT INTO ${table} (id, account_id, payload, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at, deleted_at = NULL WHERE ${table}.account_id = excluded.account_id AND ${table}.updated_at < excluded.updated_at AND (${table}.deleted_at IS NULL OR ${table}.deleted_at < excluded.updated_at)`,
        args: [
          record.id,
          accountId,
          JSON.stringify(record),
          record.updatedAt,
        ],
      })),
      ...snapshot.tombstones.map((tombstone) => {
        const table =
          tombstone.entityType === "pet" ? "pets" : "measurements";
        return {
          sql: `INSERT INTO ${table} (id, account_id, payload, updated_at, deleted_at) VALUES (?, ?, '{}', ?, ?) ON CONFLICT(id) DO UPDATE SET deleted_at = excluded.deleted_at WHERE ${table}.account_id = excluded.account_id AND (${table}.deleted_at IS NULL OR ${table}.deleted_at < excluded.deleted_at)`,
          args: [
            tombstone.entityId,
            accountId,
            tombstone.deletedAt,
            tombstone.deletedAt,
          ],
        };
      }),
    ],
    "write",
  );
  return getSnapshot(accountId);
}

export async function migrateLegacyPortraits(
  accountId: string,
  assetOrigin: string,
): Promise<SyncSnapshot> {
  const snapshot = await getSnapshot(accountId);
  const missingPortraits = snapshot.pets.filter(
    (pet) => !pet.photoDataUrl && legacyPortraitSources[pet.id],
  );
  if (!missingPortraits.length) return snapshot;

  const migratedAt = new Date().toISOString();
  const portraitPets = await Promise.all(
    missingPortraits.map(async (pet) => {
      const response = await fetch(
        new URL(legacyPortraitSources[pet.id], assetOrigin),
      );
      if (!response.ok) return undefined;
      const contentType = response.headers.get("content-type") ?? "image/png";
      const bytes = Buffer.from(await response.arrayBuffer()).toString("base64");
      return {
        ...pet,
        photoDataUrl: `data:${contentType};base64,${bytes}`,
        updatedAt: migratedAt,
      };
    }),
  );
  const completePets: Pet[] = [];
  for (const pet of portraitPets) {
    if (pet) completePets.push(pet);
  }
  if (!completePets.length) return snapshot;

  const database = await ensureRemoteSchema();
  await database.batch(
    completePets.map((pet) => ({
      sql: "INSERT INTO pets (id, account_id, payload, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at, deleted_at = NULL WHERE pets.account_id = excluded.account_id AND pets.updated_at < excluded.updated_at AND (pets.deleted_at IS NULL OR pets.deleted_at < excluded.updated_at)",
      args: [pet.id, accountId, JSON.stringify(pet), pet.updatedAt],
    })),
    "write",
  );
  return getSnapshot(accountId);
}

export async function getSnapshot(accountId: string): Promise<SyncSnapshot> {
  const database = await ensureRemoteSchema();
  const [pets, measurements] = await Promise.all([
    database.execute({ sql: "SELECT payload, deleted_at FROM pets WHERE account_id = ?", args: [accountId] }),
    database.execute({ sql: "SELECT payload, deleted_at FROM measurements WHERE account_id = ?", args: [accountId] }),
  ]);
  const toSnapshot = <T extends Pet | Measurement>(rows: typeof pets.rows) => rows.flatMap((row) => {
    if (row.deleted_at || typeof row.payload !== "string") return [];
    try { return [JSON.parse(row.payload) as T]; } catch { return []; }
  });
  const toTombstones = (rows: typeof pets.rows, entityType: Tombstone["entityType"]) => rows.flatMap((row) =>
    typeof row.deleted_at === "string" ? [{ entityId: String(row.id), entityType, deletedAt: row.deleted_at }] : [],
  );
  return {
    pets: toSnapshot<Pet>(pets.rows),
    measurements: toSnapshot<Measurement>(measurements.rows),
    tombstones: [...toTombstones(pets.rows, "pet"), ...toTombstones(measurements.rows, "measurement")],
  };
}
