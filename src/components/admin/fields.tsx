import type { ReactNode } from "react";

/**
 * Form primitives for the admin editors.
 *
 * The tour editor alone has seventeen fields that are arrays or structured JSON. These
 * exist so none of them is hand-rolled: a repeater is a repeater everywhere, and fixing
 * a keyboard or focus bug here fixes it on every screen.
 */

const inputBase =
  "w-full rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.88rem] " +
  "outline-none transition-colors focus:border-green disabled:bg-cream disabled:text-muted";

export function Label({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block">
      <span className="text-[0.82rem] font-semibold text-ink">
        {children} {required ? <span className="text-rust">*</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-[0.74rem] text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  required,
  placeholder,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  const id = useFieldId(label);
  return (
    <div>
      <Label htmlFor={id} hint={hint} required={required}>
        {label}
      </Label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${mono ? "font-mono text-[0.8rem]" : ""}`}
      />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
}) {
  const id = useFieldId(label);
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  min,
  max,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const id = useFieldId(label);
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        // Empty string must become null, not 0 — "no price" and "free" are different.
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={inputBase}
      />
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  const id = useFieldId(label);
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={inputBase}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useFieldId(label);
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#1E5F3B]"
      />
      <span>
        <span className="block text-[0.86rem] font-semibold text-ink">{label}</span>
        {hint ? <span className="block text-[0.74rem] text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Array of plain strings — highlights, inclusions, pledge lines, paragraphs. */
export function StringListField({
  label,
  values,
  onChange,
  hint,
  placeholder,
  multiline,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const set = (i: number, v: string) => onChange(values.map((old, idx) => (idx === i ? v : old)));
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => onChange(reorder(values, i, dir));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-2">
        {values.map((value, i) => (
          <div key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                rows={3}
                value={value}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
                className={inputBase}
              />
            ) : (
              <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
                className={inputBase}
              />
            )}
            <RowControls
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < values.length - 1 ? () => move(i, 1) : undefined}
              onRemove={() => remove(i)}
            />
          </div>
        ))}
        <AddButton onClick={() => onChange([...values, ""])} label={`Add ${singular(label)}`} />
      </div>
    </div>
  );
}

export interface RepeaterColumn<T> {
  key: keyof T & string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "color";
  placeholder?: string;
  /** Choices for `type: "select"`. */
  options?: readonly { value: string; label: string }[];
  /** Grid width in a 12-column row. Defaults to full width. */
  span?: number;
  /**
   * Custom control for this cell. Used for image pickers: the uploader lives in
   * image-upload.tsx, which imports from this file, so it cannot be imported back here.
   */
  render?: (value: unknown, onChange: (v: unknown) => void) => ReactNode;
}

/** Array of objects — itinerary days, add-ons, offer cards, FAQs. */
export function RepeaterField<T extends Record<string, unknown>>({
  label,
  values,
  columns,
  blank,
  onChange,
  hint,
  title,
}: {
  label: string;
  values: T[];
  columns: RepeaterColumn<T>[];
  blank: () => T;
  onChange: (v: T[]) => void;
  hint?: string;
  /** Row heading, e.g. day number. */
  title?: (row: T, index: number) => string;
}) {
  const setField = (i: number, key: string, v: unknown) =>
    onChange(values.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => onChange(reorder(values, i, dir));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-3">
        {values.map((row, i) => (
          <div key={i} className="rounded-xl border border-rule bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.78rem] font-semibold text-muted">
                {title ? title(row, i) : `${singular(label)} ${i + 1}`}
              </span>
              <RowControls
                onUp={i > 0 ? () => move(i, -1) : undefined}
                onDown={i < values.length - 1 ? () => move(i, 1) : undefined}
                onRemove={() => remove(i)}
              />
            </div>
            <div className="grid grid-cols-12 gap-3">
              {columns.map((col) => (
                <div key={col.key} style={{ gridColumn: `span ${col.span ?? 12}` }}>
                  <span className="mb-1 block text-[0.72rem] font-medium text-muted">
                    {col.label}
                  </span>
                  {col.render ? (
                    col.render(row[col.key], (v) => setField(i, col.key, v))
                  ) : col.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={String(row[col.key] ?? "")}
                      placeholder={col.placeholder}
                      onChange={(e) => setField(i, col.key, e.target.value)}
                      className={inputBase}
                    />
                  ) : col.type === "select" ? (
                    <select
                      value={String(row[col.key] ?? "")}
                      onChange={(e) => setField(i, col.key, e.target.value)}
                      className={inputBase}
                    >
                      {(col.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : col.type === "color" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(String(row[col.key] ?? ""))
                          ? String(row[col.key])
                          : "#000000"}
                        onChange={(e) => setField(i, col.key, e.target.value)}
                        aria-label={col.label}
                        className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border-[1.5px] border-rule bg-paper p-1"
                      />
                      <input
                        type="text"
                        value={String(row[col.key] ?? "")}
                        placeholder="#1E5F3B"
                        onChange={(e) => setField(i, col.key, e.target.value)}
                        className={`${inputBase} font-mono text-[0.8rem]`}
                      />
                    </div>
                  ) : (
                    <input
                      type={col.type === "number" ? "number" : "text"}
                      value={String(row[col.key] ?? "")}
                      placeholder={col.placeholder}
                      onChange={(e) =>
                        setField(
                          i,
                          col.key,
                          col.type === "number" ? Number(e.target.value) : e.target.value,
                        )
                      }
                      className={inputBase}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <AddButton onClick={() => onChange([...values, blank()])} label={`Add ${singular(label)}`} />
      </div>
    </div>
  );
}

export interface LinkRow {
  label: string;
  to: string;
}

/**
 * Array of { label, to } — nav menus and footer links.
 *
 * Kept deliberately flat rather than reusing RepeaterField: a nav has five rows and a
 * footer column has four, and a bordered card per link buries the list in chrome.
 */
export function LinkListField({
  label,
  values,
  onChange,
  hint,
  addLabel = "link",
}: {
  label: string;
  values: LinkRow[];
  onChange: (v: LinkRow[]) => void;
  hint?: string;
  addLabel?: string;
}) {
  const set = (i: number, patch: Partial<LinkRow>) =>
    onChange(values.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-2">
        {values.map((row, i) => (
          <div key={i} className="flex flex-wrap items-start gap-2">
            <input
              type="text"
              value={row.label}
              placeholder="Text people see"
              onChange={(e) => set(i, { label: e.target.value })}
              className={`${inputBase} min-w-[150px] flex-[2]`}
            />
            <input
              type="text"
              value={row.to}
              placeholder="/tours"
              onChange={(e) => set(i, { to: e.target.value })}
              className={`${inputBase} min-w-[150px] flex-[2] font-mono text-[0.8rem]`}
            />
            <RowControls
              onUp={i > 0 ? () => onChange(reorder(values, i, -1)) : undefined}
              onDown={i < values.length - 1 ? () => onChange(reorder(values, i, 1)) : undefined}
              onRemove={() => onChange(values.filter((_, idx) => idx !== i))}
            />
          </div>
        ))}
        <AddButton
          onClick={() => onChange([...values, { label: "", to: "" }])}
          label={`Add ${addLabel}`}
        />
      </div>
    </div>
  );
}

/** Array of { title, links[] } — the footer's link columns. */
export function LinkGroupField({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: { title: string; links: LinkRow[] }[];
  onChange: (v: { title: string; links: LinkRow[] }[]) => void;
  hint?: string;
}) {
  const setGroup = (i: number, patch: Partial<{ title: string; links: LinkRow[] }>) =>
    onChange(values.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-3">
        {values.map((group, i) => (
          <div key={i} className="rounded-xl border border-rule bg-cream p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={group.title}
                placeholder="Column heading, e.g. Explore"
                onChange={(e) => setGroup(i, { title: e.target.value })}
                className={`${inputBase} font-semibold`}
              />
              <RowControls
                onUp={i > 0 ? () => onChange(reorder(values, i, -1)) : undefined}
                onDown={i < values.length - 1 ? () => onChange(reorder(values, i, 1)) : undefined}
                onRemove={() => onChange(values.filter((_, idx) => idx !== i))}
              />
            </div>
            <LinkListField
              label="Links in this column"
              values={group.links}
              onChange={(links) => setGroup(i, { links })}
            />
          </div>
        ))}
        <AddButton
          onClick={() => onChange([...values, { title: "", links: [] }])}
          label="Add column"
        />
      </div>
    </div>
  );
}

/** Array of { title, items[] } — offer cards and advice blocks. */
export function GroupedListField({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: { title: string; items: string[] }[];
  onChange: (v: { title: string; items: string[] }[]) => void;
  hint?: string;
}) {
  const setGroup = (i: number, patch: Partial<{ title: string; items: string[] }>) =>
    onChange(values.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-3">
        {values.map((group, i) => (
          <div key={i} className="rounded-xl border border-rule bg-cream p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={group.title}
                placeholder="Group heading"
                onChange={(e) => setGroup(i, { title: e.target.value })}
                className={`${inputBase} font-semibold`}
              />
              <RowControls
                onUp={i > 0 ? () => onChange(reorder(values, i, -1)) : undefined}
                onDown={i < values.length - 1 ? () => onChange(reorder(values, i, 1)) : undefined}
                onRemove={() => onChange(values.filter((_, idx) => idx !== i))}
              />
            </div>
            <StringListField
              label="Items"
              values={group.items}
              onChange={(items) => setGroup(i, { items })}
            />
          </div>
        ))}
        <AddButton
          onClick={() => onChange([...values, { title: "", items: [] }])}
          label={`Add ${singular(label)}`}
        />
      </div>
    </div>
  );
}

/** Fixed-key string map — the tour `facts` object. */
export function KeyValueField({
  label,
  keys,
  labels,
  values,
  onChange,
  hint,
}: {
  label: string;
  keys: readonly string[];
  labels: Record<string, { label: string; icon: string }>;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((key) => (
          <div key={key}>
            <span className="mb-1 block text-[0.72rem] font-medium text-muted">
              {labels[key]?.icon} {labels[key]?.label ?? key}
            </span>
            <input
              type="text"
              value={values[key] ?? ""}
              placeholder="—"
              onChange={(e) => {
                const next = { ...values };
                // Drop empty keys entirely so the public page falls back to its derived
                // default instead of rendering a blank cell.
                if (e.target.value.trim() === "") delete next[key];
                else next[key] = e.target.value;
                onChange(next);
              }}
              className={inputBase}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function RowControls({
  onUp,
  onDown,
  onRemove,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <IconButton onClick={onUp} label="Move up" disabled={!onUp}>
        ↑
      </IconButton>
      <IconButton onClick={onDown} label="Move down" disabled={!onDown}>
        ↓
      </IconButton>
      <IconButton onClick={onRemove} label="Remove" danger>
        ✕
      </IconButton>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] text-[0.8rem] transition-colors ${
        disabled
          ? "cursor-not-allowed border-rule text-muted/30"
          : danger
            ? "border-rule text-muted hover:border-rust hover:text-rust"
            : "border-rule text-muted hover:border-green hover:text-green"
      }`}
    >
      {children}
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start rounded-[30px] border-[1.5px] border-dashed border-rule px-4 py-2 text-[0.8rem] font-semibold text-muted transition-colors hover:border-green hover:text-green"
    >
      + {label}
    </button>
  );
}

function reorder<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function singular(label: string): string {
  const base = label.replace(/\s*\(.*\)\s*$/, "").trim();
  return base.endsWith("ies")
    ? `${base.slice(0, -3)}y`
    : base.endsWith("s")
      ? base.slice(0, -1)
      : base;
}

/** Stable-enough id for label/input association within a single form. */
function useFieldId(label: string): string {
  return `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
