import type { AssumptionsIn } from "../types";

interface AssumptionsEditorProps {
  assumptions: AssumptionsIn;
  onChange: (assumptions: AssumptionsIn) => void;
}

export function AssumptionsEditor({ assumptions, onChange }: AssumptionsEditorProps) {
  const ratePercent = assumptions.cpf_rate_bps / 100;

  return (
    <fieldset className="card mt-6">
      <legend className="px-2 text-lg font-bold">CPF / MediSave assumption</legend>
      <label className="flex items-center gap-3">
        <input
          className="!h-5 !min-h-0 !w-5"
          type="checkbox"
          checked={assumptions.apply_cpf}
          onChange={(event) => onChange({ ...assumptions, apply_cpf: event.target.checked })}
        />
        <span className="font-semibold">Estimate CPF/MediSave when no amount was recorded</span>
      </label>
      <label className="mt-4 block max-w-xs">
        <span className="label">Estimated rate (%)</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={ratePercent}
          disabled={!assumptions.apply_cpf}
          onChange={(event) =>
            onChange({ ...assumptions, cpf_rate_bps: Math.round(Number(event.target.value) * 100) })
          }
        />
      </label>
      <p className="mt-3 text-sm text-slate-600">
        A recorded CPF amount always takes priority for that week. Otherwise this is a simplified
        estimate, not the official schedule, and is never used to decide eligibility or filing.
      </p>
    </fieldset>
  );
}
