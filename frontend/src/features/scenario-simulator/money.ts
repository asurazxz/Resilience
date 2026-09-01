/**
 * Cent-based money helpers.
 *
 * The UI never does financial arithmetic; these functions only convert between
 * the integer cents used across the API and the strings shown on screen.
 *
 * The "S$" prefix is applied explicitly rather than through Intl currency
 * formatting, which renders SGD as a bare "$" in the en-SG locale and would
 * disagree with the backend's own wording.
 */

const AMOUNT = new Intl.NumberFormat('en-SG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const WHOLE_AMOUNT = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 });

export function formatCents(cents: number): string {
  return `${cents < 0 ? '-' : ''}S$${AMOUNT.format(Math.abs(cents) / 100)}`;
}

/** Whole-dollar form for dense readouts such as chart axis labels. */
export function formatCentsCompact(cents: number): string {
  return `${cents < 0 ? '-' : ''}S$${WHOLE_AMOUNT.format(Math.abs(cents) / 100)}`;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatWeeks(count: number): string {
  return count === 1 ? '1 week' : `${count} weeks`;
}
