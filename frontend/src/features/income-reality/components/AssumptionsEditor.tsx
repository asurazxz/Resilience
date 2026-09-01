import type { AssumptionsIn } from "../types";

interface AssumptionsEditorProps {
  assumptions: AssumptionsIn;
  onChange: (assumptions: AssumptionsIn) => void;
}

// Bare-bones controls only - lets the user see and edit the assumptions
// behind the calculation, per the "editable assumptions" requirement in
// documentation/initial-scaffold.md. No styling pass.
export function AssumptionsEditor({ assumptions, onChange }: AssumptionsEditorProps) {
  const ratePercent = assumptions.cpf_rate_bps / 100;

  return (
    <fieldset>
      <legend>Assumptions</legend>
      <label>
        <input
          type="checkbox"
          checked={assumptions.apply_cpf}
          onChange={(event) => onChange({ ...assumptions, apply_cpf: event.target.checked })}
        />
        Apply estimated CPF/MediSave deduction
      </label>
      <label>
        CPF rate (%):
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
      <p>
        <small>
          Estimate only, not the official CPF/MediSave schedule. Editable, and never used to decide
          eligibility or filing.
        </small>
      </p>
    </fieldset>
  );
}
