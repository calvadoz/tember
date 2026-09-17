import Dexie, { type EntityTable } from "dexie";

import type {
  Measurement,
  MeasurementDraft,
  Pet,
  PetDraft,
  Vaccination,
  VaccinationDraft,
} from "@/lib/domain";
import type { SyncSnapshot, Tombstone } from "@/lib/sync/types";
import {
  measurementDraftSchema,
  petDraftSchema,
  vaccinationDraftSchema,
} from "@/lib/validation/schemas";

class TemberDatabase extends Dexie {
  pets!: EntityTable<Pet, "id">;
  measurements!: EntityTable<Measurement, "id">;
  vaccinations!: EntityTable<Vaccination, "id">;
  appState!: EntityTable<{ key: string; value: string }, "key">;
  tombstones!: EntityTable<Tombstone, "entityId">;

  constructor(name = "shelltrack") {
    super(name);
    this.version(1).stores({
      pets: "id, name, species, updatedAt",
      measurements: "id, petId, measuredAt, [petId+measuredAt]",
    });
    this.version(2).stores({
      pets: "id, name, species, updatedAt",
      measurements: "id, petId, measuredAt, [petId+measuredAt]",
      appState: "key",
    });
    this.version(3).stores({
      pets: "id, name, species, updatedAt",
      measurements: "id, petId, measuredAt, [petId+measuredAt]",
      appState: "key",
      tombstones: "entityId, entityType, deletedAt",
    });
    this.version(4).stores({
      pets: "id, name, species, updatedAt",
      measurements: "id, petId, measuredAt, [petId+measuredAt]",
      vaccinations: "id, petId, administeredAt, [petId+administeredAt]",
      appState: "key",
      tombstones: "entityId, entityType, deletedAt",
    });
  }
}

export const db = new TemberDatabase();
export { TemberDatabase };

export async function ensureLocalDatabase(): Promise<void> {
  await db.open();
}

function nowIso(): string {
  return new Date().toISOString();
}

function notifyLocalChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tember-local-change"));
  }
}

async function rememberDeletion(entityId: string, entityType: Tombstone["entityType"], deletedAt = nowIso()): Promise<void> {
  const existing = await db.tombstones.get(entityId);
  if (!existing || existing.deletedAt < deletedAt) {
    await db.tombstones.put({ entityId, entityType, deletedAt });
  }
}

export async function createPet(draft: PetDraft): Promise<Pet> {
  const validated = petDraftSchema.parse(draft);
  const timestamp = nowIso();
  const pet: Pet = {
    ...validated,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.pets.add(pet);
  notifyLocalChange();
  return pet;
}

export async function updatePet(id: string, draft: PetDraft): Promise<void> {
  const validated = petDraftSchema.parse(draft);
  const changed = await db.pets.update(id, {
    ...validated,
    updatedAt: nowIso(),
  });
  if (!changed) throw new Error("Pet not found");
  notifyLocalChange();
}

export async function deletePet(id: string): Promise<void> {
  await db.transaction("rw", db.pets, db.measurements, db.vaccinations, db.tombstones, async () => {
    const deletedAt = nowIso();
    const measurements = await db.measurements.where("petId").equals(id).toArray();
    const vaccinations = await db.vaccinations.where("petId").equals(id).toArray();
    await Promise.all(measurements.map((measurement) => rememberDeletion(measurement.id, "measurement", deletedAt)));
    await Promise.all(vaccinations.map((vaccination) => rememberDeletion(vaccination.id, "vaccination", deletedAt)));
    await rememberDeletion(id, "pet", deletedAt);
    await db.measurements.where("petId").equals(id).delete();
    await db.vaccinations.where("petId").equals(id).delete();
    await db.pets.delete(id);
  });
  notifyLocalChange();
}

export async function createVaccination(draft: VaccinationDraft): Promise<Vaccination> {
  const validated = vaccinationDraftSchema.parse(draft);
  if (!(await db.pets.get(validated.petId))) throw new Error("Pet not found");
  const timestamp = nowIso();
  const vaccination: Vaccination = { ...validated, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
  await db.vaccinations.add(vaccination);
  notifyLocalChange();
  return vaccination;
}

export async function updateVaccination(id: string, draft: VaccinationDraft): Promise<void> {
  const validated = vaccinationDraftSchema.parse(draft);
  if (!(await db.pets.get(validated.petId))) throw new Error("Pet not found");
  const changed = await db.vaccinations.update(id, { ...validated, updatedAt: nowIso() });
  if (!changed) throw new Error("Vaccination not found");
  notifyLocalChange();
}

export async function deleteVaccination(id: string): Promise<void> {
  await rememberDeletion(id, "vaccination");
  await db.vaccinations.delete(id);
  notifyLocalChange();
}

export async function createMeasurement(
  draft: MeasurementDraft,
): Promise<Measurement> {
  const validated = measurementDraftSchema.parse(draft);
  if (!(await db.pets.get(validated.petId))) throw new Error("Pet not found");
  const timestamp = nowIso();
  const measurement: Measurement = {
    ...validated,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.measurements.add(measurement);
  notifyLocalChange();
  return measurement;
}

export async function updateMeasurement(
  id: string,
  draft: MeasurementDraft,
): Promise<void> {
  const validated = measurementDraftSchema.parse(draft);
  if (!(await db.pets.get(validated.petId))) throw new Error("Pet not found");
  const changed = await db.measurements.update(id, {
    ...validated,
    updatedAt: nowIso(),
  });
  if (!changed) throw new Error("Measurement not found");
  notifyLocalChange();
}

export async function deleteMeasurement(id: string): Promise<void> {
  await rememberDeletion(id, "measurement");
  await db.measurements.delete(id);
  notifyLocalChange();
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction("rw", db.pets, db.measurements, db.vaccinations, db.tombstones, async () => {
    const deletedAt = nowIso();
    const [pets, measurements, vaccinations] = await Promise.all([db.pets.toArray(), db.measurements.toArray(), db.vaccinations.toArray()]);
    await Promise.all([
      ...pets.map((pet) => rememberDeletion(pet.id, "pet", deletedAt)),
      ...measurements.map((measurement) => rememberDeletion(measurement.id, "measurement", deletedAt)),
      ...vaccinations.map((vaccination) => rememberDeletion(vaccination.id, "vaccination", deletedAt)),
    ]);
    await db.measurements.clear();
    await db.pets.clear();
    await db.vaccinations.clear();
  });
  notifyLocalChange();
}

export async function getSyncSnapshot(): Promise<SyncSnapshot> {
  const [pets, measurements, vaccinations, tombstones] = await Promise.all([
    db.pets.toArray(),
    db.measurements.toArray(),
    db.vaccinations.toArray(),
    db.tombstones.toArray(),
  ]);
  return { pets, measurements, vaccinations, tombstones };
}

export async function applyRemoteSnapshot(snapshot: SyncSnapshot): Promise<void> {
  await db.transaction("rw", db.pets, db.measurements, db.vaccinations, db.tombstones, async () => {
    const localTombstones = new Map((await db.tombstones.toArray()).map((item) => [item.entityId, item]));
    for (const tombstone of snapshot.tombstones) {
      const local = localTombstones.get(tombstone.entityId);
      if (!local || local.deletedAt < tombstone.deletedAt) {
        await db.tombstones.put(tombstone);
        if (tombstone.entityType === "pet") {
          await db.pets.delete(tombstone.entityId);
          await db.measurements.where("petId").equals(tombstone.entityId).delete();
          await db.vaccinations.where("petId").equals(tombstone.entityId).delete();
        } else {
          if (tombstone.entityType === "measurement") await db.measurements.delete(tombstone.entityId);
          else await db.vaccinations.delete(tombstone.entityId);
        }
      }
    }

    for (const pet of snapshot.pets) {
      const tombstone = localTombstones.get(pet.id);
      if (tombstone && tombstone.deletedAt >= pet.updatedAt) continue;
      const existing = await db.pets.get(pet.id);
      if (!existing || existing.updatedAt < pet.updatedAt) await db.pets.put(pet);
      if (tombstone && tombstone.deletedAt < pet.updatedAt) await db.tombstones.delete(pet.id);
    }
    for (const measurement of snapshot.measurements) {
      const tombstone = localTombstones.get(measurement.id);
      if (tombstone && tombstone.deletedAt >= measurement.updatedAt) continue;
      const existing = await db.measurements.get(measurement.id);
      if (!existing || existing.updatedAt < measurement.updatedAt) await db.measurements.put(measurement);
      if (tombstone && tombstone.deletedAt < measurement.updatedAt) await db.tombstones.delete(measurement.id);
    }
    for (const vaccination of snapshot.vaccinations) {
      const tombstone = localTombstones.get(vaccination.id);
      if (tombstone && tombstone.deletedAt >= vaccination.updatedAt) continue;
      const existing = await db.vaccinations.get(vaccination.id);
      if (!existing || existing.updatedAt < vaccination.updatedAt) await db.vaccinations.put(vaccination);
      if (tombstone && tombstone.deletedAt < vaccination.updatedAt) await db.tombstones.delete(vaccination.id);
    }
  });
}
