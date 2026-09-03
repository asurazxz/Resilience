import type { AssumptionsIn } from "../types";

interface AssumptionsEditorProps {
  assumptions: AssumptionsIn;
  onChange: (assumptions: AssumptionsIn) => void;
}

export function AssumptionsEditor({ assumptions, onChange }: AssumptionsEditorProps) {
  const ratePercent = assumptions.cpf_rate_bps / 100;

  return (
    <fieldset className="card mt-6">
      <legend className="px-2 text-lg font-bold" style={{ color: "var(--color-ivory)" }}>CPF / MediSave assumption</legend>
      <label className="flex items-center gap-3">
        <input
          className="!h-5 !min-h-0 !w-5"
          type="checkbox"
          checked={assumptions.apply_cpf}
          onChange={(event) => onChange({ ...assumptions, apply_cpf: event.target.checked })}
        />
        <span className="font-semibold" style={{ color: "var(--color-ivory)" }}>Estimate CPF/MediSave when no amount was recorded</span>
      </label>
      <label className="mt-4 block max-w-xs">
        <span className="label">Estimated rate (%)</span>
        <input
          className="field"
          type="number"
          min={0}
          max={100}
          step={0.01}
          required
          value={ratePercent}
          disabled={!assumptions.apply_cpf}
          onChange={(event) => {
            const rate = Number(event.target.value);
            if (Number.isFinite(rate) && rate >= 0 && rate <= 100) {
              onChange({ ...assumptions, cpf_rate_bps: Math.round(rate * 100) });
            }
          }}
        />
      </label>
      <p className="mt-3 text-sm body-text">
        A recorded CPF amount always takes priority for that week. Otherwise this is a simplified
        estimate, not the official schedule, and is never used to decide eligibility or filing.
      </p>
    </fieldset>
  );
}
