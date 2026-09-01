/**
 * Scenario Simulator screen.
 *
 * Composes the shock controls with the estimated cash-flow and buffer-runway
 * results. No financial arithmetic happens in this layer.
 */

import { BaselineEditor } from './components/BaselineEditor';
import { BufferChart } from './components/BufferChart';
import { EstimateDisclaimers } from './components/EstimateDisclaimers';
import { PreparatoryActions } from './components/PreparatoryActions';
import { ScenarioControls } from './components/ScenarioControls';
import { ScenarioSummary } from './components/ScenarioSummary';
import { WeeklyBreakdown } from './components/WeeklyBreakdown';
import { useScenarioSimulator } from './useScenarioSimulator';
import type { BaselineFinancesPayload } from './types';

export interface ScenarioSimulatorPageProps {
  /** Starting weekly figures. Editable on the page; falls back to preview data. */
  baseline?: BaselineFinancesPayload;
}

export function ScenarioSimulatorPage({ baseline }: ScenarioSimulatorPageProps) {
  const {
    baseline: currentBaseline,
    scenario,
    result,
    source,
    isLoading,
    error,
    setScenario,
    setBaseline,
  } = useScenarioSimulator(baseline);

  return (
    <main className="mx-auto w-full max-w-screen-sm space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Plan for a setback</h1>
        <p className="text-sm text-slate-600">
          See an estimate of how a drop in earnings, time off work, or a sudden cost could
          affect your weekly money and your savings.
        </p>
      </header>

      <BaselineEditor
        baseline={currentBaseline}
        summary={result?.baseline ?? null}
        onChange={setBaseline}
      />

      <ScenarioControls scenario={scenario} onChange={setScenario} />

      {source === 'preview' ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          Showing example figures because the server could not be reached
          {error ? ` (${error})` : ''}. These are not your own numbers.
        </p>
      ) : null}

      {result ? (
        <div
          className={`space-y-6 transition-opacity ${isLoading ? 'opacity-60' : 'opacity-100'}`}
          aria-busy={isLoading}
        >
          <ScenarioSummary baseline={result.baseline} scenario={result.scenario} />
          <BufferChart weeks={result.weeks} />
          <WeeklyBreakdown weeks={result.weeks} />
          <PreparatoryActions actions={result.actions} resources={result.resources} />
          <EstimateDisclaimers disclaimers={result.disclaimers} />
        </div>
      ) : (
        <p className="text-sm text-slate-600">Working out your estimate…</p>
      )}
    </main>
  );
}
