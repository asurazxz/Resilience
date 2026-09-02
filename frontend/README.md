# Frontend

This directory contains a runnable React, TypeScript, and Vite client. The current shell mounts the Emergency Fund with synthetic in-memory data so it can run before the shared API and database foundations land. The existing `resilience-jar` module and routes remain stable integration identifiers. Tailwind CSS and full PWA support remain deferred.

## Run locally

Use Node.js 24 and npm 11. From this directory:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/resilience-jar` to track the emergency fund. Plan and goal settings are available at `http://127.0.0.1:5173/resilience-jar/plan`. Navigation between the two views preserves the current local demo state. The root URL shows the Emergency Fund, and unknown paths show a small not-found page.

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

The shell is deliberately small and uses feature-owned CSS rather than introducing a shared design system. Workstream 1 can later replace the fixture adapter and extend the app composition without changing the feature component.
