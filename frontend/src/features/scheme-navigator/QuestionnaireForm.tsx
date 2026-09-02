import type { Answers, QuestionnaireField } from "./types";

interface QuestionnaireFormProps {
  fields: QuestionnaireField[];
  answers: Answers;
  onChange: (key: string, value: Answers[string]) => void;
  onSubmit: () => void;
  submitting: boolean;
}

// Renders whatever fields the backend says are needed -- it never hard-codes
// a per-scheme form. Adding a scheme that reuses existing fields changes
// nothing here; a genuinely new fact adds one more control automatically.
export function QuestionnaireForm({
  fields,
  answers,
  onChange,
  onSubmit,
  submitting,
}: QuestionnaireFormProps) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {fields.map((field) => (
        <QuestionField
          key={field.key}
          field={field}
          value={answers[field.key] ?? null}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Checking..." : "Show schemes worth checking"}
      </button>
    </form>
  );
}

function QuestionField({
  field,
  value,
  onChange,
}: {
  field: QuestionnaireField;
  value: Answers[string];
  onChange: (value: Answers[string]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-800" htmlFor={field.key}>
        {field.label}
      </label>
      {field.help_text && (
        <p className="mt-0.5 text-xs text-slate-500">{field.help_text}</p>
      )}

      <div className="mt-1.5">
        {field.field_type === "select" && field.options && (
          <select
            id={field.key}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="" disabled>
              Select an option
            </option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {field.field_type === "boolean" && (
          <div className="flex gap-4 text-sm">
            {[
              { label: "Yes", boolValue: true },
              { label: "No", boolValue: false },
            ].map((option) => (
              <label key={option.label} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={field.key}
                  checked={value === option.boolValue}
                  onChange={() => onChange(option.boolValue)}
                />
                {option.label}
              </label>
            ))}
          </div>
        )}

        {field.field_type === "number" && (
          <div className="flex items-center gap-2">
            <input
              id={field.key}
              type="number"
              min={field.min_value ?? undefined}
              max={field.max_value ?? undefined}
              step="any"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              value={typeof value === "number" ? value : ""}
              onChange={(event) =>
                onChange(event.target.value === "" ? null : Number(event.target.value))
              }
            />
            {field.unit && <span className="shrink-0 text-xs text-slate-500">{field.unit}</span>}
          </div>
        )}

        {field.field_type === "date" && (
          <input
            id={field.key}
            type="date"
            min="1900-01-01"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    </div>
  );
}
