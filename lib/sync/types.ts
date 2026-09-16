import type { Measurement, Pet } from "@/lib/domain";

export type Tombstone = {
  entityId: string;
  entityType: "pet" | "measurement";
  deletedAt: string;
};

export type SyncSnapshot = {
  pets: Pet[];
  measurements: Measurement[];
  tombstones: Tombstone[];
};

export type SyncStatus = {
  configured: boolean;
  authenticated: boolean;
  bootstrapNeeded: boolean;
  username?: string;
};
