/**
 * API adapter for the Scenario Simulator.
 *
 * Falls back to committed preview data when the backend is unreachable so the
 * journey stays demonstrable while Workstream 1's API shell is in progress.
 * The caller is told which source was used and must label preview data.
 */

import { PREVIEW_RESULT } from './fixtures';
import type { ScenarioResult, SimulationRequest } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export type ResultSource = 'api' | 'preview';

export interface SimulationOutcome {
  result: ScenarioResult;
  source: ResultSource;
  /** Present when the API call failed and preview data was substituted. */
  error?: string;
}

export async function simulateScenario(
  request: SimulationRequest,
  signal?: AbortSignal,
): Promise<SimulationOutcome> {
  try {
    const response = await fetch(`${API_BASE_URL}/scenario-simulator/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail?.error?.message ?? `Request failed (${response.status})`);
    }

    return { result: (await response.json()) as ScenarioResult, source: 'api' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return {
      result: PREVIEW_RESULT,
      source: 'preview',
      error: error instanceof Error ? error.message : 'Could not reach the server.',
    };
  }
}
