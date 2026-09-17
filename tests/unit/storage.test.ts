import { afterEach, describe, expect, it } from "vitest";

import {
  clearAllLocalData,
  createMeasurement,
  createPet,
  createVaccination,
  db,
  deletePet,
  ensureLocalDatabase,
} from "@/lib/db";

afterEach(async () => {
  await db.measurements.clear();
  await db.vaccinations.clear();
  await db.pets.clear();
  await db.appState.clear();
  await db.tombstones.clear();
});

describe("device storage", () => {
  it("opens an empty local database without adding data", async () => {
    await ensureLocalDatabase();

    expect(await db.pets.count()).toBe(0);
    expect(await db.measurements.count()).toBe(0);
  });

  it("saves a pet and weight-only measurement", async () => {
    const pet = await createPet({
      name: "Moss",
      species: "hermanns-tortoise",
      sex: "unknown",
    });
    const measurement = await createMeasurement({
      petId: pet.id,
      measuredAt: "2026-06-21",
      weightGram: 420,
    });

    expect(await db.pets.get(pet.id)).toEqual(pet);
    expect(
      (await db.measurements.get(measurement.id))?.shellWidthMm,
    ).toBeUndefined();
  });

  it("deletes a pet and linked measurements in one action", async () => {
    const pet = await createPet({
      name: "Fern",
      species: "other",
      sex: "female",
    });
    await createMeasurement({
      petId: pet.id,
      measuredAt: "2026-06-20",
      weightGram: 80,
    });
    await createVaccination({
      petId: pet.id,
      administeredAt: "2026-06-20",
      name: "Annual vaccine",
    });

    await deletePet(pet.id);

    expect(await db.pets.count()).toBe(0);
    expect(await db.measurements.count()).toBe(0);
    expect(await db.vaccinations.count()).toBe(0);
  });

  it("deletes every local pet and measurement", async () => {
    const firstPet = await createPet({
      name: "Fern",
      species: "other",
      sex: "female",
    });
    await createPet({
      name: "Moss",
      species: "hermanns-tortoise",
      sex: "unknown",
    });
    await createMeasurement({
      petId: firstPet.id,
      measuredAt: "2026-06-21",
      weightGram: 80,
    });
    await createVaccination({
      petId: firstPet.id,
      administeredAt: "2026-06-21",
      name: "Annual vaccine",
    });

    await clearAllLocalData();

    expect(await db.pets.count()).toBe(0);
    expect(await db.measurements.count()).toBe(0);
    expect(await db.vaccinations.count()).toBe(0);
  });
});
