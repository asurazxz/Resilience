/**
 * Preparatory prompts and official links.
 *
 * All wording arrives from the deterministic backend rules. This component
 * renders it and adds no guidance of its own.
 */

import type { OfficialResource, PreparatoryAction } from '../types';

export interface PreparatoryActionsProps {
  actions: PreparatoryAction[];
  resources: OfficialResource[];
}

export function PreparatoryActions({ actions, resources }: PreparatoryActionsProps) {
  if (actions.length === 0 && resources.length === 0) {
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

      {resources.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Official sources</h3>
          <ul className="space-y-2">
            {resources.map((resource) => (
              <li key={resource.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-teal-700 underline underline-offset-2"
                >
                  {resource.name}
                </a>
                <p className="mt-1 text-sm text-slate-700">{resource.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Link last reviewed {resource.last_reviewed}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
