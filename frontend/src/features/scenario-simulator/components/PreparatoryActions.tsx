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
    <section aria-labelledby="preparatory-actions-heading" className="space-y-3">
      <h2 id="preparatory-actions-heading" className="text-base font-semibold text-slate-900">
        What you can check
      </h2>

      <ul className="space-y-2">
        {actions.map((action) => (
          <li
            key={action.id}
            className={`rounded-xl border p-4 ${
              action.severity === 'attention'
                ? 'border-rose-200 bg-rose-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">{action.title}</p>
            <p className="mt-1 text-sm text-slate-700">{action.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
