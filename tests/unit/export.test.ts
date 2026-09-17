import { describe, expect, it } from "vitest";

import { measurementsToCsv, parseBackup } from "@/lib/export";

const petId = "2b11fe0f-998d-40d7-a383-9e6d5d8d6204";

describe("portable data", () => {
  it("accepts a complete version 1 backup", () => {
    const backup = parseBackup({
      format: "shelltrack-backup",
      version: 1,
      exportedAt: "2026-06-21T08:00:00.000Z",
      pets: [
        {
          id: petId,
          name: "Moss",
          species: "hermanns-tortoise",
          sex: "unknown",
          createdAt: "2026-06-21T08:00:00.000Z",
          updatedAt: "2026-06-21T08:00:00.000Z",
        },
      ],
      measurements: [],
    });

    expect(backup.pets[0].name).toBe("Moss");
    expect(backup.vaccinations).toEqual([]);
  });

  it("accepts vaccinations in a version 2 backup", () => {
    const backup = parseBackup({
      format: "shelltrack-backup",
      version: 2,
      exportedAt: "2026-06-21T08:00:00.000Z",
      pets: [{ id: petId, name: "Moss", species: "cat", sex: "unknown", createdAt: "2026-06-21T08:00:00.000Z", updatedAt: "2026-06-21T08:00:00.000Z" }],
      measurements: [],
      vaccinations: [{ id: "ce0d48f5-c7b4-475a-a2ef-f15787859ed4", petId, administeredAt: "2026-06-21", name: "FVRCP", createdAt: "2026-06-21T08:00:00.000Z", updatedAt: "2026-06-21T08:00:00.000Z" }],
    });
    expect(backup.vaccinations[0].name).toBe("FVRCP");
  });

  it("escapes CSV notes and leaves absent dimensions empty", () => {
    const csv = measurementsToCsv([
      {
        id: "ce0d48f5-c7b4-475a-a2ef-f15787859ed3",
        petId,
        measuredAt: "2026-06-21",
        weightGram: 420,
        notes: "Calm, alert",
        createdAt: "2026-06-21T08:00:00.000Z",
        updatedAt: "2026-06-21T08:00:00.000Z",
      },
    ]);

    expect(csv).toContain('420,,,,"Calm, alert"');
  });

  it("rejects a backup with orphaned measurements", () => {
    expect(() =>
      parseBackup({
        format: "shelltrack-backup",
        version: 1,
        exportedAt: "2026-06-21T08:00:00.000Z",
        pets: [],
        measurements: [
          {
            id: "ce0d48f5-c7b4-475a-a2ef-f15787859ed3",
            petId,
            measuredAt: "2026-06-21",
            weightGram: 420,
            createdAt: "2026-06-21T08:00:00.000Z",
            updatedAt: "2026-06-21T08:00:00.000Z",
          },
        ],
      }),
    ).toThrow();
  });
});
