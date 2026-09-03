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
    <section className="space-y-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mono-label step-badge mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        >
          {step}
        </span>
        <div className="prose">
          <h2 className="subheading">
            <span className="sr-only">Step {step}: </span>
            {title}
          </h2>
          {description ? <p className="body-text">{description}</p> : null}
          {badge}
        </div>
      </div>
      <div className="pl-9">{children}</div>
    </section>
  );
}
