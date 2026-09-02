# Frontend

This directory contains the integrated React, TypeScript, Vite, and Tailwind client for the Emergency Fund, Scenario Simulator, and Scheme Navigator. The Emergency Fund uses synthetic browser-local data; the other two features call the local FastAPI service. The scheme chatbot is mounted in the shared shell and remains available across feature routes. Full PWA support remains deferred.

## Run locally

Use Node.js 24 and npm 11. From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/resilience-jar` to track the emergency fund, `http://localhost:5173/resilience-jar/plan` for its settings, `http://localhost:5173/scenario-simulator` to plan for a setback, or `http://localhost:5173/scheme-navigator` to pre-screen support schemes. The shared header provides client-side navigation, and browser back/forward navigation is supported.

Available checks:

```bash
npm test
npm run build
```
This directory contains the React, TypeScript, Tailwind CSS, and offline-capable PWA client. It is organised by product feature so each workstream owns an isolated vertical slice.

## Placement rules

- Put routing, providers, navigation, and application composition in `src/app/`.
- Put reusable presentational components in `src/components/` only after at least two features need them.
- Put feature-specific UI, hooks, state, and API adapters in `src/features/<feature>/`.
- Put framework-agnostic helpers and the shared API client in `src/lib/`.
- Put genuinely cross-feature TypeScript types in `src/types/`; feature-only types stay with their feature.
- Put browser and end-to-end tests in `tests/`; colocate focused component tests with their source when the test tooling is selected.

The shell is deliberately small and uses feature-owned CSS rather than introducing a shared design system. Workstream 1 can later replace the fixture adapter and extend the app composition without changing the feature component.
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
