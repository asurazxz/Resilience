/**
 * Preparatory prompts.
 *
 * All wording arrives from the deterministic backend rules. This component
 * renders it and adds no guidance of its own.
 *
 * The API still returns official source links alongside these prompts, and
 * they are deliberately not rendered here: feature/04-scheme-navigator owns the
 * curated source registry, including each entry's effective and last-reviewed
 * dates.
 */

import type { PreparatoryAction } from '../types';

export interface PreparatoryActionsProps {
  actions: PreparatoryAction[];
}

export function PreparatoryActions({ actions }: PreparatoryActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="preparatory-actions-heading" className="card space-y-6">
      <div className="prose">
        <h2 id="preparatory-actions-heading" className="subheading">
          What you can check
        </h2>
        <p className="body-text-sm">
          A few things worth looking into before this setback happens.
        </p>
      </div>

      <ul className="divide-y" style={{ borderColor: 'var(--color-slate)' }}>
        {actions.map((action) => (
          <li key={action.id} style={{ borderColor: 'var(--color-slate)' }}>
            <div className="px-1 py-4">
              <p className="ink-heading flex items-center gap-2 font-semibold">
                {action.title}
                {action.severity === 'attention' ? (
                  <span className="mono-label">ATTENTION</span>
                ) : null}
              </p>
              <p className="body-text-sm mt-2 prose">{action.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
