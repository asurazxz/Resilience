/**
 * One numbered step of the page.
 *
 * The numbering exists so the screen reads as a sequence — your money, then
 * the situation, then what it means — rather than as three unrelated panels.
 */

import type { ReactNode } from 'react';

export interface StepSectionProps {
  step: number;
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function StepSection({ step, title, description, badge, children }: StepSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white"
        >
          {step}
        </span>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="sr-only">Step {step}: </span>
            {title}
          </h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
          {badge}
        </div>
      </div>
      <div className="pl-9">{children}</div>
    </section>
  );
}
