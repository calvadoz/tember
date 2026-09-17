# Data Model

These are the main data rules for Tember's local-first, shared-household version.

## Pet

```ts
type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  sex: "male" | "female" | "unknown";
  birthDate?: string;
  estimatedAgeYears?: number; // age at the first measurement
  photoDataUrl?: string; // optional local image, stored as a data URL
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

`species` is the existing storage field for a pet's type. It supports cats, dogs, rabbits, birds, fish, common tortoise types, and `other`. The interface calls it “Pet type” so it remains clear for every animal.

## Measurement

```ts
type Measurement = {
  id: string;
  petId: string;
  measuredAt: string;
  weightGram: number;
  shellLengthMm?: number;
  shellWidthMm?: number;
  shellHeightMm?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Vaccination

```ts
type Vaccination = {
  id: string;
  petId: string;
  administeredAt: string;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Important rules

- `weightGram` is required, must be a real number, and must be greater than zero.
- Each optional measurement is stored in the existing length, width, and height fields independently. A measurement with only date and weight is valid.
- The app saves weight in grams and optional dimensions in millimeters. It can show friendlier units on screen.
- User-chosen calendar dates use `YYYY-MM-DD`. Audit fields use full ISO timestamps.
- IDs are generated locally with UUIDs.
- A pet portrait is optional. Selected JPG, PNG, WebP, GIF, or AVIF images up to 4 MB are stored in the device cache, synced as part of the household data, and included in JSON backups.
- When present, `estimatedAgeYears` is the pet's estimated age at its first measurement. The latest estimate adds elapsed calendar time using a 365.2425-day average year.
- Deleting a pet must safely handle all measurements linked to that pet in the same action.
- Vaccinations are a per-pet care log. They record an administration date, vaccine name, and optional notes. Tember does not interpret them as medical advice or schedule treatment.
- Check imported files before saving anything, and include a format version in exported files.

## Device cache and shared sync

Each device uses IndexedDB through Dexie for immediate offline reads and writes. JSON imports are fully validated before an atomic replacement transaction. When a shared account is signed in, the device sends its UUID-based pet, measurement, vaccination, and deletion snapshot to authenticated Next.js server routes and receives the household snapshot from Turso.

The first device creates one shared username-and-password account. The second device signs in to the same account. Turso credentials are environment variables available only to server routes. They are never sent to the browser.

Updates use the latest `updatedAt` value for the same record. Deletes are retained as timestamped tombstones, so a deletion can be applied on another device. Concurrent changes to the same record resolve to the newer timestamp. The initial snapshot is written in one database transaction. A saving device syncs immediately; an open second device pulls updates every 30 seconds and when it returns to the foreground. JSON backup remains a separate portable copy.

New devices receive their household records after the shared account is signed in. Tember does not add sample pets or measurements to a new local database.
