# Tember Contributor Guide

## Product boundary

Tember is a pet growth tracker that keeps data on the user's device. Names, storage choices, and interface language should work for any pet.

Cloud sync is an approved shared-household feature. Keep IndexedDB as the device cache, keep JSON backup/export available, and never expose database credentials to the browser. All Turso access must go through authenticated server routes.

## Important data rules

- Measurement weight is required and stored in grams.
- Shell length, width, and height are independently optional and stored in millimeters.
- Dates are stored as ISO strings.
- IDs are generated locally in Iteration 1.
- Missing optional dimensions remain absent; never coerce them to zero.

## Engineering conventions

- Use the Next.js App Router, TypeScript strict mode, Tailwind CSS, and shadcn/ui conventions.
- Keep pet and measurement rules in `lib/domain`, checks in `lib/validation`, device storage in `lib/db`, and import or export work in `lib/export`.
- Prefer small, testable functions and accessible semantic HTML.
- Build every screen mobile-first and keep the document width within the device viewport. Put intentionally wide content inside its own contained scroller, never disable browser zoom, and add each new screen to the mobile viewport regression tour.
- Respect reduced-motion settings. Animation should make the interface clearer, not slow people down.
- Update relevant documentation and `docs/changelog.md` when behavior or contributor contracts change.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before completing work. Run the relevant Playwright viewport checks when a development server is explicitly available.
- Do not start a development or production server unless the user asks.

## Writing and localization

- Keep user-facing text in `lib/i18n/messages/`, including accessibility labels and page metadata.
- Write in clear, natural language. Limit technical terms and avoid em dashes in sentences.
- Format dates, times, numbers, weights, and lengths with the shared `lib/i18n` helpers.
- Keep ISO dates, grams, and millimeters in storage. Localization only changes how values appear on screen.
- Do not join translated fragments into a sentence. Leave enough room for translated labels to grow.
- English is the only language for now. Add a translation library or language picker only when an approved iteration needs one.

## Design source

The Stitch archive supplied for the project is the visual baseline. Preserve its forest-and-cream character, typography, generous spacing, and restrained scute motif while correcting accessibility, mobile, data-density, and local-first inconsistencies documented in `docs/design.md`.
