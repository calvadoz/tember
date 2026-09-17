import type { Measurement, Pet, Vaccination } from "@/lib/domain";

export type Tombstone = {
  entityId: string;
  entityType: "pet" | "measurement" | "vaccination";
  deletedAt: string;
};

export type SyncSnapshot = {
  pets: Pet[];
  measurements: Measurement[];
  vaccinations: Vaccination[];
  tombstones: Tombstone[];
};

export type SyncStatus = {
  configured: boolean;
  authenticated: boolean;
  bootstrapNeeded: boolean;
  username?: string;
};
