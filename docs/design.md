# Tember Design Direction

## Source and intent

The supplied Stitch archive is the visual starting point. Its “Steadfast Care” style stays: modern, calm, inspired by nature, and clear enough for growth records without feeling clinical. When mockups disagree, use the refined version.

## Foundation

- Palette: warm cream backgrounds, lively forest green, fresh sage, soft coral-gold, and clear white cards. The contrast should feel warm and optimistic rather than muted.
- Type: Montserrat for identity, headings, and important measurements; Inter for body and interface copy.
- Typography decision: keep the current pair. Montserrat provides a confident, compact identity while Inter keeps dense records and forms easy to scan. Do not introduce a third typeface without a clear accessibility or language need.
- Shape: 16px cards, 12px controls, and pills only for compact statuses.
- Layout: one fluid mobile column with 20px gutters; a centered 1280px desktop grid with 24px gutters. A desktop sidebar and mobile bottom navigation are planned for the MVP.
- Viewport: screens must never widen the page beyond the device. Wide content stays inside its own scroll container, while browser zoom remains available for accessibility.
- Regression coverage: every new screen and major overlay joins the viewport tour at 320, 390, 430, 640, and 768px before it is considered complete.
- Depth: gentle color layers, subtle borders, and soft shadows rather than hard outlines.
- Motif: faint nature patterns can support the brand, but they must never make text harder to read.

## Usability corrections to the mockups

- Remove all cloud backup, account plan, and cloud security claims until those features exist.
- Use clear labels and reliable date fields instead of dates that could be misunderstood.
- Show weight as the only required growth metric; label length, width, and height as optional independently.
- Keep the existing optional length, width, and height fields in forms and records. They work for any pet and do not need to be recorded.
- Do not use `0` for a missing dimension. Show `—` or a clear empty state.
- Keep text and controls easy to see, and make keyboard focus visible.
- Make touch targets at least 44px high, label unclear icons, and confirm before deleting anything.
- Treat charts as summaries. Support them with readable labels, tables, and empty states.
- Plot every weight record with date and weight axes, a readable legend, concise time-range controls, and one large touch or keyboard surface that selects the nearest record. Keep markers to endpoints and significant drops, so dense histories remain legible. Mark a drop of 10% or more from the immediately previous record in red as a comparison cue, not a health judgment.
- Group measurement history by year on phones and small tablets. Keep collapsed rows to date, weight, and change from the previous record, then reveal dimensions, notes, and labeled actions on demand. Use a contained table on larger screens and keep its action column visible during horizontal scrolling.
- Do not show unsupported health judgments, growth percentiles, or generic care advice as facts.
- Avoid a persistent preloader; the animated mark appears only during genuine route loading.
- Keep unresolved local queries distinct from empty data. Show a calm status loader until device storage is ready, then show either records or the true empty state.
- Give each pet a square portrait. Debbie, Jake, and Mochi use their included, polished source-photo portraits by default; other pets use the warm mixed-pet illustration until the user chooses a local image. Let users replace or remove a local image without leaving the profile form.
- Show a compact sex symbol beside a named pet in the pet preview when known. Use a calm rose for female and a clear slate-blue for male, with a text alternative for assistive technology.
- Use a bright layered hero surface on Pets, Pet Detail, and Data views. Pair it with rounded white cards, sage borders, and warm coral-gold highlights so the product feels welcoming instead of muted.

## Motion

Use short fades, small lifts, and helpful loading feedback. Avoid looping animation except for the page loader. Respect the user's reduced-motion setting.

## Language and regional formats

- Keep interface text in shared message files instead of placing English sentences directly inside components.
- Write short, natural labels and avoid technical wording where a familiar phrase works.
- Allow buttons, cards, tables, and navigation labels to grow when translated.
- Use shared formatters for dates, times, numbers, weights, and lengths. Do not manually add separators or unit labels.
- Keep saved values in ISO format, grams, and millimeters. A user's language and region only change how those values appear.
- Treat a calendar date differently from an exact time so changing time zones does not change the selected day.

## Brand mark

The favicon and loader share a simple growth mark. It stays recognizable at small sizes without requiring a species-specific illustration.
