import type { Measurement, Pet, Vaccination } from "@/lib/domain";
import { db } from "@/lib/db";
import { backupSchema, type Backup } from "@/lib/validation/schemas";

export async function makeBackup(): Promise<Backup> {
  return {
    format: "shelltrack-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    pets: await db.pets.toArray(),
    measurements: await db.measurements.toArray(),
    vaccinations: await db.vaccinations.toArray(),
  };
}

export function parseBackup(value: unknown): Backup {
  return backupSchema.parse(value);
}

export async function replaceWithBackup(value: unknown): Promise<void> {
  const backup = parseBackup(value);
  await db.transaction("rw", db.pets, db.measurements, db.vaccinations, async () => {
    await db.measurements.clear();
    await db.vaccinations.clear();
    await db.pets.clear();
    await db.pets.bulkAdd(backup.pets as Pet[]);
    await db.measurements.bulkAdd(backup.measurements as Measurement[]);
    await db.vaccinations.bulkAdd(backup.vaccinations as Vaccination[]);
  });
}

export function downloadFile(
  contents: BlobPart,
  filename: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
