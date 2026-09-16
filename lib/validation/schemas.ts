import { z } from "zod";

import { petSpecies } from "@/lib/domain";

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });

const optionalText = z.string().trim().max(2000).optional();
const optionalPositiveNumber = z.number().finite().positive().optional();
const optionalPhotoDataUrl = z
  .string()
  .regex(/^data:image\/(avif|gif|jpeg|png|webp);base64,/, "Invalid image")
  .max(6_000_000)
  .optional();

export const petDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    species: z.enum(petSpecies),
    sex: z.enum(["male", "female", "unknown"]),
    birthDate: calendarDate.optional(),
    estimatedAgeYears: z.number().finite().nonnegative().max(500).optional(),
    photoDataUrl: optionalPhotoDataUrl,
    notes: optionalText,
  })
  .strict();

export const measurementDraftSchema = z
  .object({
    petId: z.string().uuid(),
    measuredAt: calendarDate,
    weightGram: z.number().finite().positive(),
    shellLengthMm: optionalPositiveNumber,
    shellWidthMm: optionalPositiveNumber,
    shellHeightMm: optionalPositiveNumber,
    notes: optionalText,
  })
  .strict();

const auditFields = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const petSchema = petDraftSchema.extend(auditFields.shape);
export const measurementSchema = measurementDraftSchema.extend(
  auditFields.shape,
);

export const backupSchema = z
  .object({
    format: z.literal("shelltrack-backup"),
    version: z.literal(1),
    exportedAt: z.string().datetime(),
    pets: z.array(petSchema),
    measurements: z.array(measurementSchema),
  })
  .strict()
  .superRefine((backup, context) => {
    const petIds = new Set(backup.pets.map((pet) => pet.id));
    for (const measurement of backup.measurements) {
      if (!petIds.has(measurement.petId)) {
        context.addIssue({
          code: "custom",
          message: "A measurement refers to a pet that is not in this backup.",
          path: ["measurements", measurement.id, "petId"],
        });
      }
    }
  });

export type Backup = z.infer<typeof backupSchema>;
