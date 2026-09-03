/**
 * Week-by-week figures behind the headline estimates.
 *
 * Always visible, so every number on the screen can be traced back to the
 * inputs. The table scrolls sideways on a narrow screen rather than wrapping.
 */

import { formatCents } from '../money';
import type { WeekProjection } from '../types';

export interface WeeklyBreakdownProps {
  weeks: WeekProjection[];
}

export function WeeklyBreakdown({ weeks }: WeeklyBreakdownProps) {
  return (
    <div className="space-y-3">
      <h4 className="label">Week by week</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-xs tabular-nums">
          <caption className="sr-only">
            Estimated weekly work income, money in or out, and remaining savings
          </caption>
          <thead>
            <tr>
              <th scope="col" className="mono-label py-2 pr-3 font-medium">Week</th>
              <th scope="col" className="mono-label py-2 pr-3 font-medium">Work income</th>
              <th scope="col" className="mono-label py-2 pr-3 font-medium">In or out</th>
              <th scope="col" className="mono-label py-2 pr-3 font-medium">Savings left</th>
              <th scope="col" className="mono-label py-2 font-medium">Not covered</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.week} style={{ borderTop: '1px solid var(--color-slate)' }}>
                <th scope="row" className="body-text py-2 pr-3 font-normal">
                  {week.week}
                </th>
                <td className="body-text py-2 pr-3">{formatCents(week.net_work_income_cents)}</td>
                <td className="body-text py-2 pr-3">
                  {week.net_cash_flow_cents < 0 ? '−' : ''}
                  {formatCents(Math.abs(week.net_cash_flow_cents))}
                </td>
                <td className="body-text py-2 pr-3">{formatCents(week.buffer_close_cents)}</td>
                <td className="py-2">
                  {week.shortfall_cents > 0 ? (
                    <span className="mono-label ink-key">
                      {formatCents(week.shortfall_cents)}
                    </span>
                  ) : (
                    <span className="body-text">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
