# Changelog

## 2026-09-16

### Changed

- Reframed Tember’s interface as a private pet growth tracker, with generic optional measurements and common pet types while preserving the existing local storage, age calculation, measurements, import/export, and deletion behavior.
- Rebuilt the weight chart for dense records: time-range controls, endpoint and significant-drop markers, labelled axes, a selected-record summary, and the existing touch and keyboard explorer now fit without horizontal scrolling.
- Replaced the first-run seed with the supplied Debbie, Jake, and Mochi backup (310 measurements). New local databases receive it once; existing records are not replaced.
- Added a one-time additive seed upgrade so existing Debbie and Jake installs receive Mochi and the missing supplied records without requiring a data reset or overwriting local entries.
- Renamed the product to Tember, refreshed the forest-and-cream palette with brighter sage and coral-gold accents, and added optional local pet portraits with a replaceable default illustration.
- Refined the core Pets, Pet Detail, and Data views with brighter layered hero surfaces, more expressive profile cards, and elevated growth summary cards while retaining the Montserrat and Inter type system.
- Replaced the included illustration for Debbie, Jake, and Mochi with polished square portraits based on their supplied photos. A locally selected portrait still takes precedence.
- Replaced male and female labels on pet profiles with the conventional, screen-reader-labelled female and male symbols. The clear words remain in the profile form.
- Added a coloured sex symbol beside each known pet name in the Pets preview: rose for female and slate-blue for male.
- Added shared-household sync with a server-only Turso connection, a first-device shared username-and-password setup, durable sessions, and local IndexedDB cache synchronization using stable IDs and deletion tombstones.
- Made an open signed-in device refresh shared records every 30 seconds and whenever Tember returns to the foreground. Saving a local change still synchronizes immediately.
- Made first-account setup responsive by completing it before the background upload, and batched initial and subsequent record writes into one Turso transaction instead of one remote request per record.
- Migrated the prepared Debbie, Jake, and Mochi portraits into the existing shared household records as synced data URLs, then removed automatic sample data from new local databases. New devices now start empty until the shared account is signed in.
- Corrected first-session record loading by re-running the Pets database queries once local storage is ready, so synced pets appear without navigating away and back.
- Made the shared-account screen explicitly offer both sign-in and account creation. Account existence now chooses the initial option only, rather than restricting the screen.
- Added a centred, reduced-motion-aware loading screen while a signed-in device completes its initial household sync. If sync cannot be reached, the device continues with its existing local cache.
- Replaced the full upload-and-download cycle on authenticated page refreshes with a background pull. A full merge still runs immediately after a user signs in or creates the shared account.
- Prevented the Pets dashboard from flashing while Tember checks whether this browser is signed in.
- Refined the account screen language around a professional Tember account, while keeping the cross-device sync explanation in supporting copy.

## 2026-06-22

### Changed

- Reworked measurement history into year-grouped expandable rows on phones and small tablets, with date, weight, change from the previous record, details on demand, and a contained larger-screen table using compact missing-value marks.
- Prevented wide descendants from expanding the mobile document and triggering an inconsistent zoomed-out layout, while preserving normal browser zoom accessibility.
- Replaced the brief false “Add your first pet” state during local database startup with an accessible loading panel.
- Added a contributor, skill, and Playwright contract requiring every current and future screen to remain within mobile and small-tablet viewport widths without disabling browser zoom.

## 2026-06-21

### Added

- Local pet profiles and measurement journals saved in IndexedDB through Dexie.
- Create, edit, and confirmed delete flows for pets and measurements, with transactional linked-record deletion.
- Responsive desktop and mobile navigation, pet dashboard, weight chart, and accessible measurement history.
- Strict record validation and weight or length unit conversion at the interface boundary.
- Versioned JSON backup and validated atomic import, plus measurement CSV export.
- A confirmed Data-menu action that deletes all pets and measurements stored locally by Tember without affecting downloaded backups.
- One-time default profiles for Debbie and Jake with 276 supplied measurements, normalized gram storage, and documented source-date corrections.
- Unit and storage coverage for weight-only measurements, missing optional dimensions, cascade deletion, conversion, and portable formats.
- Initial Next.js App Router foundation with TypeScript, Tailwind CSS, shadcn/ui conventions, ESLint, Prettier, Vitest, and Playwright.
- Responsive welcome page based on the supplied Stitch design.
- Shared shell mark, favicon, and reduced-motion-aware route preloader.
- Guides for contributors, design choices, data rules, planned iterations, and future Codex work.
- A Tember-only development skill with the project's product, writing, and localization rules.
- Shared English message files and locale-aware formatters for calendar dates, exact times, numbers, weight, and length.

### Changed

- Replaced the weight graph with a responsive, horizontally explorable chart featuring labelled axes, a legend, one accessible point per record, details on hover or focus, and red segments for decreases of 10% or more from the previous record.
- Estimated age now advances from the pet's age at its first measurement to the latest record date using a 365.2425-day average year.
- Marked the local-first MVP as Iteration 2 and clarified calendar dates, audit timestamps, local UUIDs, and deferred pet photos.
- Updated the mockup plan to keep the first version on the device, make shell dimensions optional, show missing values clearly, and remove cloud or health claims that the app cannot support yet.
- Reworded the welcome page and project guides to sound clearer and more natural.
- Moved interface text and page metadata into shared messages so future translations can be added without rewriting components.

### Corrected

- Made the weight chart fit its card without horizontal scrolling, kept edge date labels visible, reduced marker clutter, and added a full-size touch and keyboard explorer for dense histories.
- Aligned Add Measurement with the approved Add Pet mobile modal: the same header, 20px gutters, field sizing, optional labels, plain form rhythm, and Cancel or Save actions, with shell dimensions compactly collapsed until needed.
- Constrained native date inputs to their mobile form column and left-aligned the value in iOS browsers without replacing the system picker.

### Known Issues

- Pet photos remain deferred until durable local image storage is designed.
- Records are tied to the current browser profile unless the user downloads and imports a JSON backup.
