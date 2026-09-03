/**
 * Setback planner screen.
 *
 * Reads as three steps — your money, the setback, what it means — so the
 * page states what it needs before it shows an answer, and the answer arrives
 * as a sentence rather than as a grid of figures. Written for someone with no
 * finance background: short sentences, everyday words, honest about being an
 * estimate.
 */

import { BaselineEditor } from './components/BaselineEditor';
import { EstimateDisclaimers } from './components/EstimateDisclaimers';
import { HeadlineAnswer } from './components/HeadlineAnswer';
import { PreparatoryActions } from './components/PreparatoryActions';
import { ResultDetails } from './components/ResultDetails';
import { ScenarioControls } from './components/ScenarioControls';
import { ScenarioSummary } from './components/ScenarioSummary';
import { StepSection } from './components/StepSection';
import type { BaselineFinancesPayload } from './types';
import { useScenarioSimulator } from './useScenarioSimulator';

export interface ScenarioSimulatorPageProps {
  /** Starting weekly figures. Editable on the page; falls back to example data. */
  baseline?: BaselineFinancesPayload;
}

export function ScenarioSimulatorPage({ baseline }: ScenarioSimulatorPageProps) {
  // A baseline supplied by the caller is built from the user's own records, so
  // it must never be labelled as example data.
  const usingExampleBaseline = baseline === undefined;
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
    <main className="mx-auto w-full max-w-2xl space-y-10 py-8">
      <header>
        <h1 className="display-lg">Setback planner</h1>
        <p className="mt-3 body-text prose">
          See how long your savings would last if you earned less, could not work for a
          while, or had to pay for something unexpected.
        </p>
      </header>

      <StepSection
        step={1}
        title="Your money now"
        description="What a normal week looks like for you. Change any figure that is not right."
        badge={
          !usingExampleBaseline ? (
            baselineEdited ? null : (
              <p className="note">
                These figures come from your own records — your last four weeks and your
                regular costs.
              </p>
            )
          ) : baselineEdited ? null : (
            <p className="note">
              These are example numbers. Edit them below to see your own situation.
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
        description="Set the details of the setback you want to check."
      >
        <ScenarioControls scenario={scenario} onChange={setScenario} />
      </StepSection>

      <StepSection
        step={3}
        title="What it would mean for you"
        description="An estimate based on the numbers above. Not a prediction and not financial advice."
      >
        {source === 'preview' ? (
          <p role="status" className="note mb-6">
            <span className="mono-label">Offline estimate</span>
            <br />
            We could not reach the server, so this is an example result, not your own
            numbers{error ? ` (${error})` : ''}.
          </p>
        ) : null}

        {result ? (
          <div
            className={`space-y-6 transition-opacity ${isLoading ? 'opacity-60' : 'opacity-100'}`}
            aria-busy={isLoading}
          >
            <HeadlineAnswer scenario={result.scenario} />
            <ScenarioSummary baseline={result.baseline} scenario={result.scenario} />
            <ResultDetails weeks={result.weeks} />
            <PreparatoryActions actions={result.actions} />
            <EstimateDisclaimers disclaimers={result.disclaimers} />
          </div>
        ) : (
          <p className="body-text">Working out your estimate…</p>
        )}
      </StepSection>
    </main>
  );
}
