/**
 * Provisional application shell.
 *
 * `feature/01-foundation-input` owns routing, navigation, onboarding, and the
 * PWA setup. This renders the Scenario Simulator directly so the slice can be
 * demonstrated; replace it with the Workstream 1 shell rather than growing it.
 */

import { ScenarioSimulatorPage } from '../features/scenario-simulator';

export function App() {
  return <ScenarioSimulatorPage />;
}
