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
  onChange
}: {
  title: string;
  rows: EditableMoneyRow[];
  categories: Array<{ value: string; label: string }>;
  cadence?: boolean;
  onChange: (rows: EditableMoneyRow[]) => void;
}) {
  const update = (index: number, changes: Partial<EditableMoneyRow>) =>
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));
  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="font-semibold text-slate-900">{title}</legend>
        <button
          className="text-sm font-semibold text-indigo-700"
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
      {rows.length === 0 && <p className="text-sm text-slate-500">No items added.</p>}
      {rows.map((row, index) => (
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1.4fr_1fr_auto_auto]" key={row.id}>
          <select aria-label={`${title} category ${index + 1}`} value={row.category} onChange={(event) => update(index, { category: event.target.value })}>
            {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input aria-label={`${title} description ${index + 1}`} placeholder="Description" value={row.label} onChange={(event) => update(index, { label: event.target.value })} />
          <input aria-label={`${title} amount ${index + 1}`} inputMode="decimal" placeholder="S$0.00" value={row.amount} onChange={(event) => update(index, { amount: event.target.value })} />
          {cadence && (
            <select aria-label={`${title} cadence ${index + 1}`} value={row.cadence} onChange={(event) => update(index, { cadence: event.target.value as Cadence })}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
          <button className="text-sm text-rose-700" type="button" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
        </div>
      ))}
    </fieldset>
  );
}
