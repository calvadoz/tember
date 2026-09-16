import seed from "@/lib/db/default-data.json";
import type { Measurement, Pet } from "@/lib/domain";

export const defaultPets = seed.pets as Pet[];
export const defaultMeasurements = seed.measurements as Measurement[];
