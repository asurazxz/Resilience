/**
 * A single money input, in dollars, reporting whole cents.
 *
 * The field is a text input rather than type="number" on purpose. React
 * compares a controlled number input's DOM string to the new value loosely, so
 * "0123" tests equal to 123 and a stranded leading zero is never rewritten.
 * Holding the in-progress text here also keeps partial entries such as "12."
 * usable while typing.
 */

import { useEffect, useRef, useState } from 'react';

import { dollarsToCents } from '../money';

/** Keep digits and a single decimal point of at most two places, drop leading zeros. */
function sanitiseAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const trimmedWhole = whole.replace(/^0+(?=\d)/, '');
  if (rest.length === 0) {
    return trimmedWhole;
  }
  return `${trimmedWhole}.${rest.join('').slice(0, 2)}`;
}

function centsToDraft(cents: number): string {
  return cents === 0 ? '' : String(cents / 100);
}

export interface MoneyFieldProps {
  id: string;
  label: string;
  valueCents: number;
  hint?: string;
  onChange: (cents: number) => void;
}

export function MoneyField({ id, label, valueCents, hint, onChange }: MoneyFieldProps) {
  const [draft, setDraft] = useState(() => centsToDraft(valueCents));
  // The last value this field reported, so a change made elsewhere - picking a
  // situation preset, for example - can be told apart from the user's own
  // typing and reflected in the text.
  const lastReportedRef = useRef(valueCents);

  useEffect(() => {
    if (valueCents === lastReportedRef.current) {
      return;
    }
    lastReportedRef.current = valueCents;
    setDraft(centsToDraft(valueCents));
  }, [valueCents]);

  function handleChange(raw: string) {
    const next = sanitiseAmount(raw);
    setDraft(next);
    const parsed = Number(next);
    const cents = next === '' || Number.isNaN(parsed) ? 0 : dollarsToCents(parsed);
    // Recorded before reporting so the effect above leaves partial entries
    // such as "12." alone.
    lastReportedRef.current = cents;
    onChange(cents);
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">S$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
