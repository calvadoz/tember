import { describe, expect, it } from "vitest";

import {
  estimateAgeAtDate,
  isSignificantWeightDrop,
  lengthToMm,
  significantWeightDropPercent,
  weightChangePercent,
  weightToGram,
} from "@/lib/domain";
import {
  measurementDraftSchema,
  petDraftSchema,
  vaccinationDraftSchema,
} from "@/lib/validation/schemas";

describe("domain rules", () => {
  it("flags weight drops of ten percent or more", () => {
    expect(significantWeightDropPercent).toBe(10);
    expect(weightChangePercent(1000, 900)).toBe(-10);
    expect(isSignificantWeightDrop(1000, 900)).toBe(true);
    expect(isSignificantWeightDrop(1000, 901)).toBe(false);
  });

  it("derives age from the first and latest measurement dates", () => {
    expect(estimateAgeAtDate(1.5, "2023-02-18", "2026-05-30")).toBeCloseTo(
      4.78,
      1,
    );
  });

  it("accepts a measurement with only date and weight", () => {
    const result = measurementDraftSchema.parse({
      petId: crypto.randomUUID(),
      measuredAt: "2026-06-21",
      weightGram: 420,
    });

    expect(result.weightGram).toBe(420);
    expect(result.shellLengthMm).toBeUndefined();
    expect(result.shellWidthMm).toBeUndefined();
    expect(result.shellHeightMm).toBeUndefined();
  });

  it("rejects zero weight and invalid calendar dates", () => {
    expect(() =>
      measurementDraftSchema.parse({
        petId: crypto.randomUUID(),
        measuredAt: "2026-02-30",
        weightGram: 0,
      }),
    ).toThrow();
  });

  it("keeps optional pet values absent", () => {
    const result = petDraftSchema.parse({
      name: "Moss",
      species: "hermanns-tortoise",
      sex: "unknown",
    });
    expect(result.birthDate).toBeUndefined();
    expect(result.estimatedAgeYears).toBeUndefined();
  });

  it("accepts common pet types alongside the original tortoise types", () => {
    expect(
      petDraftSchema.parse({
        name: "Mochi",
        species: "cat",
        sex: "female",
      }).species,
    ).toBe("cat");
  });

  it("keeps an optional local pet portrait with the profile", () => {
    expect(
      petDraftSchema.parse({
        name: "Mochi",
        species: "cat",
        sex: "female",
        photoDataUrl: "data:image/png;base64,AA==",
      }).photoDataUrl,
    ).toBe("data:image/png;base64,AA==");
  });

  it("converts display units to storage units", () => {
    expect(weightToGram(1.25, "kg")).toBe(1250);
    expect(lengthToMm(12.4, "cm")).toBe(124);
  });

  it("accepts a concise per-pet vaccination record", () => {
    const result = vaccinationDraftSchema.parse({
      petId: crypto.randomUUID(),
      administeredAt: "2026-06-21",
      name: "FVRCP",
    });
    expect(result.name).toBe("FVRCP");
  });
});
