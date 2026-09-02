# Frontend

This directory contains the integrated React, TypeScript, Vite, Tailwind, and PWA client for all five product features. Foundation Input, Income Reality, the Scenario Simulator, and the Scheme Navigator call FastAPI. The Emergency Fund currently uses a typed browser-local fixture adapter, and the Scheme Navigator chatbot remains available across routes.

## Run locally

Use Node.js 24 and npm 11. From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` for the Foundation overview. The shared navigation links to weekly entries, Income Reality, Emergency Fund, Setback Planner, Scheme Navigator, CSV import, and assumptions. Browser back/forward navigation is supported.

Available checks:

```bash
npm test
npm run build
```
## Placement rules

- Put routing, providers, navigation, and application composition in `src/app/`.
- Put reusable presentational components in `src/components/` only after at least two features need them.
- Put feature-specific UI, hooks, state, and API adapters in `src/features/<feature>/`.
- Put framework-agnostic helpers and the shared API client in `src/lib/`.
- Put genuinely cross-feature TypeScript types in `src/types/`; feature-only types stay with their feature.
- Put browser and end-to-end tests in `tests/`; colocate focused component tests with their source when the test tooling is selected.

The shell owns providers and routing while feature-specific UI remains isolated. The Emergency Fund fixture adapter can be replaced with a database-backed implementation without changing its page contract.

## Visual system and mobile behaviour

The shared visual system lives in `src/styles.css`; route-shell navigation styles live in `src/app/app.css`.

- The interface uses a warm paper palette (`#f7f7f4` canvas, `#f2f1ed` cards, and `#26251e` ink), with Forest reserved for positive action and Ember reserved for small emphasis.
- Cards, fields, and buttons use restrained 4px corners, hairline borders, and warm shadows. Keep new UI within these tokens instead of adding gradients, glass effects, or pill-shaped controls.
- The fixed header becomes an accessible **Menu / Close** disclosure below 768px. It preserves all routes without a horizontally overflowing navigation strip.
- Controls retain a 44px minimum target size. Test additions at a 390px-wide viewport as well as desktop width.

## Run and verify

From the repository root after copying `frontend/.env.example` to `frontend/.env`:

```powershell
npm install
npm run dev:frontend
npm run test:frontend
npm run build:frontend
```

`VITE_API_BASE_URL` is the only frontend environment variable. It points to FastAPI and is not secret. Do not add Supabase database URLs, passwords, anon keys, or service-role keys to the frontend; all persistence goes through the API.

The service worker precaches static assets only. Foundation data and queued writes are stored in IndexedDB (`resilience-foundation`) and replayed in order with idempotency keys when the browser reconnects.
