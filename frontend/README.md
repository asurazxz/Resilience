# Frontend

This directory will contain the React, TypeScript, Tailwind CSS, and PWA client. It is organised by product feature so each workstream owns an isolated vertical slice.

## Placement rules

- Put routing, providers, navigation, and application composition in `src/app/`.
- Put reusable presentational components in `src/components/` only after at least two features need them.
- Put feature-specific UI, hooks, state, and API adapters in `src/features/<feature>/`.
- Put framework-agnostic helpers and the shared API client in `src/lib/`.
- Put genuinely cross-feature TypeScript types in `src/types/`; feature-only types stay with their feature.
- Put browser and end-to-end tests in `tests/`; colocate focused component tests with their source when the test tooling is selected.

The initial package manifest and verified run commands are owned by `feature/01-foundation-input`.
