import type { Cadence } from "../types/foundation";

export interface EditableMoneyRow {
  id: string;
  category: string;
  label: string;
  amount: string;
  cadence?: Cadence;
}

export function MoneyRows({
  title,
  rows,
  categories,
  cadence = false,
  descriptionRequired = true,
  onChange
}: {
  title: string;
  rows: EditableMoneyRow[];
  categories: Array<{ value: string; label: string }>;
  cadence?: boolean;
  descriptionRequired?: boolean;
  onChange: (rows: EditableMoneyRow[]) => void;
}) {
  const update = (index: number, changes: Partial<EditableMoneyRow>) =>
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));
  return (
    <fieldset className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <legend className="subheading">{title}</legend>
        <button
          className="mono-label ink-heading"
          type="button"
          onClick={() =>
            onChange([
              ...rows,
              { id: crypto.randomUUID(), category: categories[0].value, label: "", amount: "", cadence: "weekly" }
            ])
          }
        >
          + Add item
        </button>
      </div>
      {rows.length === 0 && <p className="body-text">No items added.</p>}
      {rows.map((row, index) => (
        <div className="grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_1.4fr_1fr_auto_auto]" style={{ background: "var(--surface-obsidian-button)" }} key={row.id}>
          <select aria-label={`${title} category ${index + 1}`} value={row.category} onChange={(event) => update(index, { category: event.target.value })}>
            {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input aria-label={`${title} description ${index + 1}`} maxLength={100} placeholder="Description" required={descriptionRequired || row.category === "other"} value={row.label} onChange={(event) => update(index, { label: event.target.value })} />
          <input aria-label={`${title} amount ${index + 1}`} inputMode="decimal" maxLength={10} pattern="\d+(\.\d{0,2})?" placeholder="S$0.00" required title="Enter a positive amount with up to two decimal places" value={row.amount} onChange={(event) => update(index, { amount: event.target.value })} />
          {cadence && (
            <select aria-label={`${title} cadence ${index + 1}`} value={row.cadence} onChange={(event) => update(index, { cadence: event.target.value as Cadence })}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
          <button className="mono-label" type="button" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
        </div>
      ))}
    </fieldset>
  );
}
