# Iteration Plan

## Iteration 1, Foundation: complete

- Configure Next.js, TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier, Vitest, and Playwright.
- Set up folders, shared design styles, brand assets, loading feedback, tests, and contributor notes.
- Centralize English interface text and add shared formatters so future translations do not require a rewrite.
- Do not add pet editing or data storage yet.

## Iteration 2, Local-first MVP: complete

- Save pet profiles and measurements in IndexedDB through Dexie.
- Support creating, editing, and deleting pets and measurements, including transactional deletion of a pet's linked measurements.
- Validate stored records and convert display units while keeping grams and millimeters in storage.
- Provide a responsive pet dashboard, pet journals, a weight chart, and an accessible measurement history table.
- Provide versioned JSON backup and atomic replacement import, plus measurement CSV export.
- Let the user delete all local Tember data after an explicit confirmation.
- Add initial Debbie and Jake records during the local-first prototype, before shared sync is introduced.
- Test that a measurement works with only a calendar date and weight.
- Pet photos are deferred until durable local image storage is designed and approved.

## Iteration 3, General pet growth UI: complete

- Reframed the product and interface around private pet growth records, without changing the local-first measurement, calculation, import, export, or deletion behavior.
- Made the existing optional length, width, and height fields generic in the interface while retaining their storage format for backup compatibility.
- Expanded the pet-type selector to include common companion animals while preserving all existing tortoise types.
- Migrated the supplied Debbie, Jake, and Mochi records into the shared household account, then removed automatic sample records from new local databases.
- Reworked the weight chart for dense histories with range controls, sparse markers, touch and keyboard selection, and a clear selected-record readout.
- Added optional pet portraits, including a replaceable default illustration. Portraits travel in JSON backups and shared household sync.

## Iteration 4, Shared household sync: complete

- Keep Dexie and IndexedDB as each device's offline cache.
- Add one shared username-and-password account, created by the first device and used by both household devices.
- Use authenticated Next.js server routes to read and write a Turso SQLite database. Database credentials remain server-side.
- Synchronize locally generated UUID records and deletion tombstones. The newer edit wins when two devices change the same record.
- Upload each existing local record after setup, then pull the shared snapshot to the other device. JSON backup remains available independently.

## Polish and reliability: requires approval

- Improve accessibility, mobile layouts, loading and error messages, empty states, import safety, cloud behavior, documentation, and tests.

## Final review: requires approval

- Review code quality, security, data safety, ease of use, release readiness, and the most useful next step without adding a new group of features.
