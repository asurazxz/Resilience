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
      className="space-y-6"
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

      <button type="submit" disabled={submitting} className="button-primary w-full">
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
      <label className="label" htmlFor={field.key}>
        {field.label}
      </label>
      {field.help_text && (
        <p className="body-text prose mb-3 text-[13px]">{field.help_text}</p>
      )}

      <div>
        {field.field_type === "select" && field.options && (
          <select
            id={field.key}
            className="field w-full"
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
              <label key={option.label} className="body-text flex items-center gap-1.5">
                <input
                  type="radio"
                  name={field.key}
                  checked={value === option.boolValue}
                  onChange={() => onChange(option.boolValue)}
                  style={{ minHeight: "auto", width: "auto" }}
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
              className="field w-full"
              value={typeof value === "number" ? value : ""}
              onChange={(event) =>
                onChange(event.target.value === "" ? null : Number(event.target.value))
              }
            />
            {field.unit && <span className="mono-label shrink-0">{field.unit}</span>}
          </div>
        )}

        {field.field_type === "date" && (
          <input
            id={field.key}
            type="date"
            min="1900-01-01"
            className="field w-full"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    </div>
  );
}
