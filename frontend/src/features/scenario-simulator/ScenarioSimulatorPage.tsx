/**
 * Scenario Simulator screen.
 *
 * Reads as three steps — your money, the situation, what it means — so the
 * page states what it needs before it shows an answer, and the answer arrives
 * as a sentence rather than as a grid of figures.
 */

import { BaselineEditor } from './components/BaselineEditor';
import { EstimateDisclaimers } from './components/EstimateDisclaimers';
import { HeadlineAnswer } from './components/HeadlineAnswer';
import { PreparatoryActions } from './components/PreparatoryActions';
import { ResultDetails } from './components/ResultDetails';
import { ScenarioControls } from './components/ScenarioControls';
import { ScenarioSummary } from './components/ScenarioSummary';
import { SituationPresets } from './components/SituationPresets';
import { StepSection } from './components/StepSection';
import type { BaselineFinancesPayload } from './types';
import { useScenarioSimulator } from './useScenarioSimulator';

export interface ScenarioSimulatorPageProps {
  /** Starting weekly figures. Editable on the page; falls back to example data. */
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
    baselineEdited,
  } = useScenarioSimulator(baseline);

  return (
    <main className="mx-auto w-full max-w-screen-sm space-y-8 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Plan for a setback</h1>
        <p className="text-sm text-slate-600">
          Work out how long your savings would last if your earnings dropped, you had to stop
          working, or a sudden cost landed.
        </p>
      </header>

      <StepSection
        step={1}
        title="Your money now"
        description="A normal week for you. Change anything that does not match."
        badge={
          baselineEdited ? null : (
            <p className="inline-block rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
              Example figures — edit them to see your own situation
            </p>
          )
        }
      >
        <BaselineEditor
          baseline={currentBaseline}
          summary={result ? result.baseline : null}
          onChange={setBaseline}
        />
      </StepSection>

      <StepSection
        step={2}
        title="What are you planning for?"
        description="Pick a situation, then adjust it if you need to."
      >
        <div className="space-y-3">
          <SituationPresets
            scenario={scenario}
            onSelect={(preset) => setScenario(preset.scenario)}
          />
          <ScenarioControls scenario={scenario} onChange={setScenario} />
        </div>
      </StepSection>

      <StepSection
        step={3}
        title="What it would mean"
        description="An estimate based on the figures above."
      >
        {source === 'preview' ? (
          <p
            role="status"
            className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
          >
            Showing example results because the server could not be reached
            {error ? ` (${error})` : ''}. These are not your own numbers.
          </p>
        ) : null}

        {result ? (
          <div
            className={`space-y-4 transition-opacity ${isLoading ? 'opacity-60' : 'opacity-100'}`}
            aria-busy={isLoading}
          >
            <HeadlineAnswer scenario={result.scenario} />
            <ScenarioSummary baseline={result.baseline} scenario={result.scenario} />
            <ResultDetails weeks={result.weeks} />
            <PreparatoryActions actions={result.actions} resources={result.resources} />
            <EstimateDisclaimers disclaimers={result.disclaimers} />
          </div>
        ) : (
          <p className="text-sm text-slate-600">Working out your estimate…</p>
        )}
      </StepSection>
    </main>
  );
}
