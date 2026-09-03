# Frontend

The React, TypeScript, Vite, Tailwind and PWA client. Every feature calls FastAPI through the shared API client; the Emergency Fund fixture adapter is retained for tests and offline demos only.

## Run locally

Node.js 24 and npm 11. From the repository root (this is an npm workspace, so install there):

```bash
npm install
npm run dev:frontend
```

From this directory, `npm run dev`, `npm test` and `npm run build` do the same work.

Open `http://localhost:5173`. A signed-out visitor sees the landing page, with the sign-in form at `/signin`. A signed-in user who has not onboarded is sent to `/onboarding`.

Routes in the shell:

| Path | Screen |
|---|---|
| `/` | Home — financial score dial, key figures, weekly trend |
| `/transactions`, `/transactions/new`, `/transactions/:id/edit` | Transaction ledger and editor |
| `/income-reality` | Income overview |
| `/resilience-jar`, `/resilience-jar/plan` | Emergency fund and its plan settings |
| `/savings` | Savings goals |
| `/scenario-simulator` | Setback planner |
| `/scheme-navigator` | Scheme navigator |
| `/profile` | Profile and financial details (`/settings` redirects here) |

The side navigation collapses on every viewport behind an always-visible menu button. Browser back and forward work throughout.

## Checks

```bash
npm run test:frontend    # Vitest, plus the Node test-runner suites in tests/
npm run build:frontend   # tsc -b && vite build
npm run generate:api     # regenerate src/types/api.generated.ts from contracts/openapi/openapi.json
```

`npm run test:integration` runs the Playwright suite and needs the API and database running.

## Placement rules

- Put routing, providers, navigation and application composition in `src/app/`.
- Put reusable presentational components in `src/components/` only after at least two features need them.
- Put feature-specific UI, hooks, state and API adapters in `src/features/<feature>/`.
- Put framework-agnostic helpers and the shared API client in `src/lib/`.
- Put genuinely cross-feature TypeScript types in `src/types/`; feature-only types stay with their feature.
- Put browser and end-to-end tests in `tests/`; colocate focused component tests with their source.

All features call FastAPI through the single `src/lib/api.ts` client, which prefixes `/api/v1`, injects the Supabase bearer token, retries once after refreshing an expired token on a 401, and parses the shared error envelope into `ApiError`.

## Visual system

The shared visual system lives in `src/styles.css`; route-shell navigation styles live in `src/app/app.css`.

- The interface is a dark, near-monochrome scheme with a single Cobalt accent: Onyx canvas (`#171721`), Graphite cards, Obsidian elevated surfaces, Slate borders, Ash body copy, Ivory headings.
- `src/styles.css` is the only file allowed to name a colour. An undefined `var(--color-…)` with no fallback voids the whole declaration and the text silently inherits whatever sat above it, so tokens are defined once and consumed everywhere.
- Cobalt reaches only 3.4:1 on the canvas, so it is confined to fills, borders, focus rings and chart strokes and is never used for body text. White on a Cobalt fill reaches 4.7:1 and carries the primary action. Slate is a border colour only.
- Because the scheme has one accent, meaning is never carried by colour alone: income and cost, matched and unmatched schemes, and warning states each carry a sign, a mono label or an icon.
- Chart colours live in `src/lib/chartTheme.ts` so the next palette change is a single edit.
- Typography: DM Serif Display for headlines, Inter for UI and body, Roboto Mono for uppercase labels and data.
- Controls keep a 44px minimum target size. Test additions at a 390px-wide viewport as well as at desktop width.

## Environment

`frontend/.env` (copied from `.env.example`) holds three non-secret variables: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. In development Vite proxies `/api` to FastAPI on `127.0.0.1:8000`, so `VITE_API_BASE_URL` can stay blank. See the [root README](../README.md#4-create-the-environment-files).

Do not add a Supabase database URL, password, secret key or service-role key to the frontend. All persistence goes through the API.

## Offline behaviour

The service worker precaches static assets. Bootstrap data and queued writes are stored in IndexedDB (`resilience-foundation`) and replayed in order with mutation UUIDs as idempotency keys when the browser reconnects. The queue is ordered, so one failed mutation holds the ones behind it; the sync status panel appears when a mutation has actually failed or conflicted, and offers "Use server" or "Keep mine" for a revision conflict.

Bumping the Dexie version discards stale cached bootstraps rather than patching around a changed shape.
