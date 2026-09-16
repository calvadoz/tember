# Tember

Tember is a private pet growth tracker for companion animals and tortoises. It keeps a fast local copy on each device and can securely sync one shared household account across devices.

## Current status

The local-first MVP is complete. Shared-household Turso sync is being added while retaining offline access, JSON backups, and measurement CSV export.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS and shadcn/ui conventions
- ESLint and Prettier
- Vitest and Testing Library
- Playwright
- pnpm

## Local development

Requires Node.js 20 or newer and pnpm 9.15.5.

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm format
```

Playwright browsers may need to be installed once with `pnpm exec playwright install`.

## Product rules

- The shared household account uses a username and password. Turso credentials are stored only in Vercel environment variables and are never sent to the browser.
- Each device retains its IndexedDB cache, so existing records remain available offline. JSON backup stays available as an independent export.
- Measurement weight is required and stored internally in grams.
- Shell length, width, and height are optional and stored internally in millimeters.
- Calendar dates use `YYYY-MM-DD`, audit times use full ISO strings, and IDs are created on the device.
- English is the first language, with shared message and formatting helpers ready for future translations.

See `AGENTS.md` and the `docs/` folder for the design choices, data rules, and iteration plan.
