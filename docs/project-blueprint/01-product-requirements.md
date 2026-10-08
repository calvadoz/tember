# 01. Product requirements

[View visual brief](visuals/01-product-requirements.svg)

## Problem and outcome

Pet caregivers need a calm, private way to record growth without losing the detail that makes a long-term record useful. Tember provides per-pet journals for weight, optional physical measurements, and vaccinations, with reliable access on the current device and optional sharing with one household across devices.

The outcome is a trustworthy record, not medical advice or a diagnostic product.

## Users, goals, and boundaries

| Actor | Need | Product response |
| --- | --- | --- |
| Primary caregiver | Quickly add and review a pet record | Local pet journal, responsive forms, chart, and history |
| Household member | See and update the same records on another device | Shared username-and-password account and durable sync |
| Data-conscious caregiver | Retain control of records | IndexedDB cache, complete JSON backup, CSV export, explicit deletion |

**Goals:** make basic measurement entry dependable; preserve missing optional dimensions as missing; make history understandable at mobile widths; retain local access during a sync failure; and make data movement explicit and safe.

**Out of scope:** veterinary advice, growth percentiles, diagnosis, automatic treatment schedules, public sharing, billing, multiple household roles, and removal of local storage in favour of cloud-only data.

## MVP and feature requirements

The completed MVP remains the release baseline. Polish and reliability work must not weaken its guarantees.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| PR-1 | Manage pet profiles | A caregiver can create, edit, and confirm deletion of a pet with name, type, sex, optional portrait, dates, age estimate, and notes. Deleting a pet removes linked measurements and vaccinations in the same local action. |
| PR-2 | Record growth | A measurement requires a valid calendar date and weight greater than zero. Each of length, width, and height may be absent independently and never displays or exports as zero. |
| PR-3 | Read a journal | A pet journal shows latest and previous weight, an explorable chart, readable measurement history, and no unsupported health claims. Dense and small-screen histories remain usable. |
| PR-4 | Record vaccinations | A caregiver can add, edit, and delete a vaccine name, calendar date, and optional note per pet. The log does not prescribe care. |
| PR-5 | Keep local control | The app works with local records in IndexedDB, offers versioned JSON backup/import and measurement CSV export, and confirms destructive replacement or deletion. |
| PR-6 | Share a household | The first device can create one shared account; another device can sign in. Changes use stable local IDs, are queued if upload fails, and sync again when online, foregrounded, or explicitly requested. |
| PR-7 | Release safely | The polish iteration improves accessible feedback, import and sync clarity, mobile containment, and regression coverage without changing the underlying measurement or ownership rules. |

## Key stories and failure states

- As a caregiver, I can save a measurement with only a date and weight. It is rejected if the date is impossible or weight is not positive.
- As a caregiver, I can leave any dimension blank. Blank dimensions remain absent in IndexedDB, backups, sync payloads, and UI.
- As a caregiver, I can use my latest local records when sync is unavailable. Tember says sync needs attention and retains pending changes for retry.
- As a caregiver, I can import a complete valid backup in one replacement action. An invalid file changes nothing.
- As a caregiver, I can delete records only after an explicit confirmation. Local deletion does not erase a previously downloaded backup.
- As a household member, I can sign out of this device without deleting its local cache. I cannot access remote records without an authenticated session.

## Success measures

| Measure | Release target |
| --- | --- |
| Data validation | 100% of tested invalid measurement and backup cases leave stored data valid and unchanged |
| Sync resilience | A failed upload stays visibly pending and succeeds after a later retry in automated coverage |
| Accessibility | Core journeys are keyboard-operable with visible focus and no critical automated accessibility findings |
| Mobile integrity | Pets, journal, measurement form, vaccination form, and Data stay within 320, 390, 430, 640, and 768px viewports |
| Release confidence | Lint, strict typecheck, unit tests, and relevant Playwright checks pass before release |

## Edge cases

Calendar dates are date-only values, not moments, so time zones must not shift a chosen date. Equal edit timestamps need a deterministic documented outcome. A deleted record must win over an older remote edit. New devices begin empty until a household account is used. Large or unsupported portrait files are rejected before saving. A missing database configuration leaves sync unavailable rather than attempting a browser-side connection.
