import { useRef, useState, type ReactNode } from "react";
import { AdminIcon } from "@/components/admin/icons";
import {
  LinkPicker,
  useLinkTargets,
  type LinkPickResult,
} from "@/components/admin/link-picker";
import type { LinkTargetKind } from "@/lib/link-targets";

/**
 * Form primitives for the admin editors.
 *
 * The tour editor alone has seventeen fields that are arrays or structured JSON. These
 * exist so none of them is hand-rolled: a repeater is a repeater everywhere, and fixing
 * a keyboard or focus bug here fixes it on every screen.
 */

const inputBase =
  "w-full rounded-[10px] border border-rule bg-paper px-3.5 py-2.5 text-[0.88rem] " +
  "outline-none transition-colors focus:border-green focus:ring-2 focus:ring-green/15 " +
  "disabled:bg-cream disabled:text-muted";

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
      <span className="text-[0.66rem] font-semibold tracking-[0.11em] text-muted uppercase">
        {children} {required ? <span className="text-rust">*</span> : null}
      </span>
      {hint ? (
        <span className="mt-0.5 block text-[0.8rem] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function MarkdownTextarea({
  id,
  rows = 4,
  value,
  placeholder,
  onChange,
}: {
  id?: string;
  rows?: number;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);

  /** Inline, non-blocking replacement for `alert()`, which stole the very selection the
   *  editor was about to format. */
  const flash = (message: string) => {
    setHint(message);
    setTimeout(() => setHint(null), 2600);
  };

  /** Re-selects a range after a value change; React has to re-render first. */
  const reselect = (start: number, end: number) => {
    setTimeout(() => {
      if (!ref.current) return;
      ref.current.setSelectionRange(start, end);
      ref.current.focus();
    }, 0);
  };

  const applyClass = (cls: string) => {
    if (!ref.current) return;
    const textarea = ref.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    if (!selected) {
      flash("Select some text first, then choose a style.");
      return;
    }

    const wrap = `<span class="${cls}">${selected}</span>`;
    onChange(before + wrap + after);
    const newStart = start + wrap.indexOf(selected);
    reselect(newStart, newStart + selected.length);
  };

  const openLinkPicker = () => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const existing = findLinkAt(textarea.value, start, end);

    if (existing) {
      setPicker({
        range: [existing.start, existing.end],
        initial: { href: existing.href, text: existing.text },
        editing: true,
      });
      return;
    }

    setPicker({
      range: [start, end],
      initial: { href: "", text: textarea.value.substring(start, end) },
      editing: false,
    });
  };

  const applyLink = ({ value: href, label }: LinkPickResult) => {
    if (!picker) return;
    const [start, end] = picker.range;
    const current = ref.current?.value ?? value;
    const anchor = label.trim() || current.substring(start, end) || href;
    const markdown = `[${anchor}](${href})`;
    onChange(current.substring(0, start) + markdown + current.substring(end));
    // Land the caret on the anchor text, not the URL — the next edit is usually the words.
    reselect(start + 1, start + 1 + anchor.length);
  };

  const removeLink = () => {
    if (!picker) return;
    const [start, end] = picker.range;
    const current = ref.current?.value ?? value;
    const text = picker.initial.text;
    onChange(current.substring(0, start) + text + current.substring(end));
    reselect(start, start + text.length);
  };

  const handleBold = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!ref.current) return;
    const textarea = ref.current;
    // Get current selection bounds right now from the DOM
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    let newValue: string;
    let newStart = start;
    let newEnd = end;

    if (before.endsWith("**") && after.startsWith("**")) {
      newValue = before.substring(0, before.length - 2) + selected + after.substring(2);
      newStart = start - 2;
      newEnd = end - 2;
    } else if (selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4) {
      newValue = before + selected.substring(2, selected.length - 2) + after;
      newStart = start;
      newEnd = end - 4;
    } else {
      newValue = before + "**" + selected + "**" + after;
      newStart = start + 2;
      newEnd = end + 2;
    }
    
    onChange(newValue);
    reselect(newStart, newEnd);
  };

  return (
    <div className="flex flex-col rounded-[10px] border border-rule bg-paper overflow-hidden transition-colors focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
      <div className="flex items-center gap-2 border-b border-rule bg-cream/40 px-2.5 py-1.5">
        <button
          type="button"
          // Mousedown, not click: the browser clears the textarea's selection when focus
          // moves, and click fires too late to save it.
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBold}
          title="Bold text"
          className="flex h-[24px] w-[24px] items-center justify-center rounded bg-transparent text-ink hover:bg-rule"
        >
          <AdminIcon name="bold" className="h-[14px] w-[14px]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPicker}
          title="Insert or edit a link"
          className="flex h-[24px] w-[24px] items-center justify-center rounded bg-transparent text-ink hover:bg-rule"
        >
          <AdminIcon name="link" className="h-[14px] w-[14px]" />
        </button>
        <div className="h-4 w-px bg-rule" />
        <select
          title="Text Color"
          onChange={(e) => {
            if (e.target.value) applyClass(e.target.value);
            e.target.value = "";
          }}
          className="text-[0.72rem] outline-none bg-transparent font-medium cursor-pointer text-ink hover:text-green"
        >
          <option value="">Color</option>
          <option value="text-green">Green</option>
          <option value="text-green-dark">Dark Green</option>
          <option value="text-gold">Gold</option>
          <option value="text-rust">Rust</option>
          <option value="text-orange">Orange</option>
        </select>
        <div className="h-4 w-px bg-rule" />
        <select
          title="Text Size"
          onChange={(e) => {
            if (e.target.value) applyClass(e.target.value);
            e.target.value = "";
          }}
          className="text-[0.72rem] outline-none bg-transparent font-medium cursor-pointer text-ink hover:text-green"
        >
          <option value="">Size</option>
          <option value="text-sm">Small</option>
          <option value="text-[1.05rem]">Large</option>
          <option value="text-[1.2rem]">Huge</option>
        </select>
        <div className="h-4 w-px bg-rule" />
        <select
          title="Text Font"
          onChange={(e) => {
            if (e.target.value) applyClass(e.target.value);
            e.target.value = "";
          }}
          className="text-[0.72rem] outline-none bg-transparent font-medium cursor-pointer text-ink hover:text-green"
        >
          <option value="">Font</option>
          <option value="font-display">Display (Playfair)</option>
          <option value="font-body">Body (Poppins)</option>
          <option value="font-script">Script (Caveat)</option>
          <option value="font-marker">Marker</option>
          <option value="font-kalam">Kalam</option>
          <option value="font-custom">Custom</option>
        </select>
        {hint ? (
          <span role="status" className="ml-auto truncate text-[0.72rem] font-medium text-rust">
            {hint}
          </span>
        ) : null}
      </div>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-3.5 py-2.5 text-[0.88rem] outline-none disabled:bg-cream disabled:text-muted"
      />
      {/* Mounted only while open. The tour editor renders ~20 of these textareas, and an
          always-mounted picker would have every one of them subscribe to the target list
          on page load. */}
      {picker ? (
        <LinkPicker
          open
          onClose={() => setPicker(null)}
          onPick={applyLink}
          onRemove={picker.editing ? removeLink : undefined}
          initial={picker.initial}
          title={picker.editing ? "Edit link" : "Insert link"}
        />
      ) : null}
    </div>
  );
}

interface PickerState {
  /** Slice of the textarea value the picker will replace. */
  range: [number, number];
  initial: { href: string; text: string };
  /** True when the caret was inside an existing link, enabling "Remove link". */
  editing: boolean;
}

/** `[anchor text](/some/path "optional title")` */
const MD_LINK = /\[([^\]\n]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

/**
 * The markdown link whose source range contains the caret, if any. Lets the toolbar button
 * mean "edit this link" when the editor clicks into one, rather than nesting a new link
 * inside it.
 */
function findLinkAt(
  value: string,
  start: number,
  end: number,
): { start: number; end: number; href: string; text: string } | null {
  MD_LINK.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MD_LINK.exec(value)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (start >= from && end <= to) {
      return { start: from, end: to, text: match[1] ?? "", href: match[2] ?? "" };
    }
  }
  return null;
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
      <MarkdownTextarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * Curated cross-links — `tours.related_slugs` and `blog_posts.related_slugs`.
 *
 * Stores slugs (matching the columns), but shows titles: the editor picks "Sundarbans
 * 3D/2N", not `sundarbans-3d2n`. A slug that no longer resolves stays visible and flagged
 * rather than silently disappearing, because a renamed tour is exactly the case worth
 * noticing.
 */
export function RelatedContentField({
  label,
  hint,
  kind,
  values,
  onChange,
  max = 12,
}: {
  label: string;
  hint?: string;
  kind: LinkTargetKind;
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const { targets, loading } = useLinkTargets();
  const [picking, setPicking] = useState(false);

  const bySlug = new Map(
    targets.filter((t) => t.kind === kind && t.slug).map((t) => [t.slug!, t]),
  );

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => onChange(reorder(values, i, dir));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-2">
        {values.map((slug, i) => {
          const target = bySlug.get(slug);
          const missing = !loading && !target;
          return (
            <div
              key={`${slug}-${i}`}
              className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 ${
                missing ? "border-rust/40 bg-rust/5" : "border-rule bg-paper"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.86rem] font-medium text-ink">
                  {target?.label ?? slug}
                </span>
                <span className="block truncate font-mono text-[0.72rem] text-muted">
                  {missing ? "No longer exists — remove or re-pick" : slug}
                </span>
              </span>
              {target?.published === false ? (
                <span className="shrink-0 rounded-full bg-cream px-2.5 py-0.5 text-[0.7rem] font-semibold text-muted">
                  Draft
                </span>
              ) : null}
              <RowControls
                onUp={i > 0 ? () => move(i, -1) : undefined}
                onDown={i < values.length - 1 ? () => move(i, 1) : undefined}
                onRemove={() => remove(i)}
              />
            </div>
          );
        })}

        {values.length < max ? (
          <AddButton onClick={() => setPicking(true)} label={singular(label)} />
        ) : (
          <span className="text-[0.78rem] text-muted">Maximum of {max} reached.</span>
        )}
      </div>

      {picking ? (
        <LinkPicker
          open
          mode="slug"
          filter={[kind]}
          title={`Add ${singular(label).toLowerCase()}`}
          onClose={() => setPicking(false)}
          onPick={({ value }) => {
            // Silently ignore duplicates — re-picking something is a no-op, not an error.
            if (!values.includes(value)) onChange([...values, value]);
          }}
        />
      ) : null}
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
                <div className="grow">
                  <MarkdownTextarea
                    rows={3}
                    value={value}
                    placeholder={placeholder}
                    onChange={(v) => set(i, v)}
                  />
                </div>
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
                      <MarkdownTextarea
                        rows={3}
                        value={String(row[col.key] ?? "")}
                        placeholder={col.placeholder}
                        onChange={(v) => setField(i, col.key, v)}
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
/** A heading plus its bullet list. `icon` is only present where `icons` is offered. */
export interface GroupRow {
  title: string;
  items: string[];
  icon?: string;
}

export function GroupedListField({
  label,
  values,
  onChange,
  hint,
  icons,
}: {
  label: string;
  values: GroupRow[];
  onChange: (v: GroupRow[]) => void;
  hint?: string;
  /** When given, each group also picks an icon — used by the tour pricing promises. */
  icons?: readonly { value: string; label: string }[];
}) {
  const setGroup = (i: number, patch: Partial<GroupRow>) =>
    onChange(values.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-3">
        {values.map((group, i) => (
          <div key={i} className="rounded-xl border border-rule bg-cream p-4">
            <div className="mb-3 flex items-center gap-2">
              {icons ? (
                <select
                  aria-label="Icon"
                  value={group.icon ?? icons[0]?.value ?? ""}
                  onChange={(e) => setGroup(i, { icon: e.target.value })}
                  className={`${inputBase} w-auto shrink-0`}
                >
                  {icons.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : null}
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
          onClick={() =>
            onChange([
              ...values,
              { title: "", items: [], ...(icons ? { icon: icons[0]?.value ?? "" } : {}) },
            ])
          }
          label={`Add ${singular(label)}`}
        />
      </div>
    </div>
  );
}

export interface ContentBlock {
  heading: string;
  paragraphs: string[];
  items: string[];
}

/**
 * Array of { heading, paragraphs[], items[] } — the sections of a policy or info page.
 *
 * Neither GroupedListField nor RepeaterField fits: a block carries two independent
 * lists, and an editor needs to see prose and bullets as separate things.
 */
export function BlockListField({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: ContentBlock[];
  onChange: (v: ContentBlock[]) => void;
  hint?: string;
}) {
  const setBlock = (i: number, patch: Partial<ContentBlock>) =>
    onChange(values.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-3">
        {values.map((block, i) => (
          <div key={i} className="rounded-xl border border-rule bg-cream p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="shrink-0 text-[0.78rem] font-semibold text-muted">{i + 1}.</span>
              <input
                type="text"
                value={block.heading}
                placeholder="Section heading"
                onChange={(e) => setBlock(i, { heading: e.target.value })}
                className={`${inputBase} font-semibold`}
              />
              <RowControls
                onUp={i > 0 ? () => onChange(reorder(values, i, -1)) : undefined}
                onDown={i < values.length - 1 ? () => onChange(reorder(values, i, 1)) : undefined}
                onRemove={() => onChange(values.filter((_, idx) => idx !== i))}
              />
            </div>
            <div className="flex flex-col gap-4">
              <StringListField
                label="Paragraphs"
                hint="Normal sentences. Each box is one paragraph."
                multiline
                values={block.paragraphs}
                onChange={(paragraphs) => setBlock(i, { paragraphs })}
              />
              <StringListField
                label="Bullet points"
                hint="Shown as a tick list under the paragraphs."
                values={block.items}
                onChange={(items) => setBlock(i, { items })}
              />
            </div>
          </div>
        ))}
        <AddButton
          onClick={() => onChange([...values, { heading: "", paragraphs: [], items: [] }])}
          label="Add section"
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
