/**
 * Tappable starting points for the situation being planned for.
 *
 * Selecting one fills in the controls below, so the user recognises a
 * situation instead of inventing percentages. The selected card is derived by
 * comparing the current inputs, so adjusting anything simply clears it.
 */

import { SITUATION_PRESETS, matchPresetId, type SituationPreset } from '../presets';
import type { ShockScenarioPayload } from '../types';

export interface SituationPresetsProps {
  scenario: ShockScenarioPayload;
  onSelect: (preset: SituationPreset) => void;
}

export function SituationPresets({ scenario, onSelect }: SituationPresetsProps) {
  const selectedId = matchPresetId(scenario);

  return (
    <div className="space-y-2">
      <div role="group" aria-label="Common situations" className="grid gap-2">
        {SITUATION_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(preset)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span
                className={`block text-sm font-medium ${
                  isSelected ? 'text-teal-900' : 'text-slate-900'
                }`}
              >
                {preset.label}
              </span>
              <span className={`block text-xs ${isSelected ? 'text-teal-800' : 'text-slate-600'}`}>
                {preset.detail}
              </span>
            </button>
          );
        })}
      </div>
      {selectedId === null ? (
        <p className="text-xs text-slate-500">
          Your own situation. Pick one above to start from a common case.
        </p>
      ) : null}
    </div>
  );
}
