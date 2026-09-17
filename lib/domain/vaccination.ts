export type Vaccination = {
  id: string;
  petId: string;
  administeredAt: string;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type VaccinationDraft = Omit<
  Vaccination,
  "id" | "createdAt" | "updatedAt"
>;
