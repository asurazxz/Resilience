/**
 * State for the Scenario Simulator screen.
 *
 * Holds the control values and the last result. It performs no financial
 * arithmetic: every figure shown comes from the deterministic backend engine
 * or from the committed preview fixture.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { simulateScenario, type ResultSource } from './api';
import { PREVIEW_BASELINE, PREVIEW_SCENARIO } from './fixtures';
import type { BaselineFinancesPayload, ScenarioResult, ShockScenarioPayload } from './types';

const DEBOUNCE_MS = 250;

export interface ScenarioSimulatorState {
  baseline: BaselineFinancesPayload;
  scenario: ShockScenarioPayload;
  result: ScenarioResult | null;
  source: ResultSource | null;
  isLoading: boolean;
  error: string | null;
  setScenario: (patch: Partial<ShockScenarioPayload>) => void;
  setBaseline: (patch: Partial<BaselineFinancesPayload>) => void;
}

export function useScenarioSimulator(
  initialBaseline: BaselineFinancesPayload = PREVIEW_BASELINE,
): ScenarioSimulatorState {
  const [baseline, setBaselineState] = useState(initialBaseline);
  const [scenario, setScenarioState] = useState<ShockScenarioPayload>(PREVIEW_SCENARIO);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [source, setSource] = useState<ResultSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Controls are dragged continuously, so wait for a pause before asking the
    // API to recalculate.
    const timer = window.setTimeout(() => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsLoading(true);

      simulateScenario({ baseline, scenario }, controller.signal)
        .then((outcome) => {
          setResult(outcome.result);
          setSource(outcome.source);
          setError(outcome.error ?? null);
          setIsLoading(false);
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === 'AbortError') {
            return;
          }
          setError(cause instanceof Error ? cause.message : 'Something went wrong.');
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [baseline, scenario]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const setScenario = useCallback((patch: Partial<ShockScenarioPayload>) => {
    setScenarioState((current) => ({ ...current, ...patch }));
  }, []);

  const setBaseline = useCallback((patch: Partial<BaselineFinancesPayload>) => {
    setBaselineState((current) => ({ ...current, ...patch }));
  }, []);

  return { baseline, scenario, result, source, isLoading, error, setScenario, setBaseline };
}
