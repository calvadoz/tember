export const petSpecies = [
  "cat",
  "dog",
  "rabbit",
  "bird",
  "fish",
  "hermanns-tortoise",
  "russian-tortoise",
  "greek-tortoise",
  "sulcata-tortoise",
  "leopard-tortoise",
  "red-footed-tortoise",
  "other",
] as const;

export type PetSpecies = (typeof petSpecies)[number];
export type PetSex = "male" | "female" | "unknown";

export type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  sex: PetSex;
  birthDate?: string;
  estimatedAgeYears?: number;
  photoDataUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetDraft = Omit<Pet, "id" | "createdAt" | "updatedAt">;

const averageYearDays = 365.2425;

export function estimateAgeAtDate(
  ageAtFirstMeasurementYears: number,
  firstMeasurementDate: string,
  latestMeasurementDate: string,
): number {
  const first = Date.parse(`${firstMeasurementDate}T00:00:00.000Z`);
  const latest = Date.parse(`${latestMeasurementDate}T00:00:00.000Z`);
  return (
    ageAtFirstMeasurementYears +
    (latest - first) / (averageYearDays * 24 * 60 * 60 * 1000)
  );
}
