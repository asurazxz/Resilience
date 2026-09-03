/**
 * API adapter for the Scenario Simulator.
 *
 * Falls back to committed preview data only when the network itself is
 * unreachable, so the journey stays demonstrable offline. The caller is told
 * which source was used and must label preview data.
 */

import { PREVIEW_RESULT } from './fixtures';
import { apiRequest } from '../../lib/api';
import type { ScenarioResult, SimulationRequest } from './types';

export type ResultSource = 'api' | 'preview';

export interface SimulationOutcome {
  result: ScenarioResult;
  source: ResultSource;
  /** Present when the network was unreachable and preview data was substituted. */
  error?: string;
}

export async function simulateScenario(
  request: SimulationRequest,
  signal?: AbortSignal,
): Promise<SimulationOutcome> {
  try {
    const result = await apiRequest<ScenarioResult>('/scenario-simulator/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
      signal,
    });
    return { result, source: 'api' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    // A server validation or business error is never an excuse to show an
    // unrelated financial preview as if it were a response to this input.
    // Only a thrown fetch (TypeError) means the network was unreachable.
    if (!(error instanceof TypeError)) throw error;
    return {
      result: PREVIEW_RESULT,
      source: 'preview',
      error: 'Could not reach the server.',
    };
  }
}
