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
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-700">Week by week</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-xs tabular-nums">
          <caption className="sr-only">
            Estimated weekly work income, money in or out, and remaining savings
          </caption>
          <thead>
            <tr className="text-slate-500">
              <th scope="col" className="py-2 pr-3 font-medium">Week</th>
              <th scope="col" className="py-2 pr-3 font-medium">Work income</th>
              <th scope="col" className="py-2 pr-3 font-medium">In or out</th>
              <th scope="col" className="py-2 pr-3 font-medium">Savings left</th>
              <th scope="col" className="py-2 font-medium">Not covered</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.week} className="border-t border-slate-100">
                <th scope="row" className="py-2 pr-3 font-normal text-slate-700">
                  {week.week}
                </th>
                <td className="py-2 pr-3 text-slate-700">
                  {formatCents(week.net_work_income_cents)}
                </td>
                <td
                  className={`py-2 pr-3 ${
                    week.net_cash_flow_cents < 0 ? 'text-rose-700' : 'text-slate-700'
                  }`}
                >
                  {formatCents(week.net_cash_flow_cents)}
                </td>
                <td className="py-2 pr-3 text-slate-700">
                  {formatCents(week.buffer_close_cents)}
                </td>
                <td className={week.shortfall_cents > 0 ? 'py-2 text-rose-700' : 'py-2 text-slate-400'}>
                  {week.shortfall_cents > 0 ? formatCents(week.shortfall_cents) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
