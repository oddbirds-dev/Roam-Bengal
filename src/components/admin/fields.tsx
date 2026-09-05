import { useEffect, useRef, useState, type ReactNode } from "react";
import { RichTextarea } from "@/components/admin/rich-textarea";
import { AdminIcon } from "@/components/admin/icons";
import {
  LinkPicker,
  useLinkTargets,
} from "@/components/admin/link-picker";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import type { LinkTargetKind } from "@/lib/link-targets";

/**
 * Form primitives for the admin editors.
 *
 * The tour editor alone has seventeen fields that are arrays or structured JSON. These
 * exist so none of them is hand-rolled: a repeater is a repeater everywhere, and fixing
 * a keyboard or focus bug here fixes it on every screen.
 */

/**
 * The switch drawn beside `Toggle`'s hidden checkbox: this span is the track, its `::after`
 * is the thumb. The thumb has to be a pseudo-element rather than a child span, because
 * `peer-checked:` compiles to a *sibling* selector — a real child would not be a sibling of
 * the input and would never move.
 */
const SWITCH = `relative mt-px h-[22px] w-[38px] shrink-0 rounded-full bg-muted/30 transition-colors
  peer-checked:bg-green peer-focus-visible:ring-2 peer-focus-visible:ring-green/40
  after:absolute after:top-[3px] after:left-[3px] after:h-4 after:w-4 after:rounded-full
  after:bg-paper after:shadow-sm after:transition-transform after:content-[""]
  peer-checked:after:translate-x-4`;

export const inputBase =
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

/** Splits on `**bold**` runs for the live bold-preview overlay in `TextArea`. The `**`
 *  markers become their own "marker" segments rather than disappearing — see the comment
 *  at the call site for why they're rendered invisible instead of just left out. */
function splitBoldSegments(text: string): { text: string; kind: "plain" | "bold" | "marker" }[] {
  const segments: { text: string; kind: "plain" | "bold" | "marker" }[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), kind: "plain" });
    }
    segments.push({ text: "**", kind: "marker" });
    segments.push({ text: match[1] ?? "", kind: "bold" });
    segments.push({ text: "**", kind: "marker" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length || segments.length === 0) {
    segments.push({ text: text.slice(lastIndex), kind: "plain" });
  }
  return segments;
}

function renderBoldSegments(text: string, keyPrefix: string, forceBold = false) {
  return splitBoldSegments(text).map((seg, i) => {
    if (seg.kind === "marker") {
      return (
        <span key={`${keyPrefix}-${i}`} className="text-transparent">
          {seg.text}
        </span>
      );
    }
    if (seg.kind === "bold" || forceBold) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-bold">
          {seg.text}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{seg.text}</span>;
  });
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 4,
  placeholder,
  plain,
  boldButton,
  boldLinePrefixPattern,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  /** Content that is markup or plain prose in its own right — an embed snippet, a
   *  robots.txt, a meta description. Formatting it would corrupt it, so these get a plain
   *  textarea with no toolbar. */
  plain?: boolean;
  /** Adds a "Bold" button above a `plain` textarea that wraps the selection in `**`.
   *  For fields where the plain text itself is later rendered with `FormatText`, so
   *  `**word**` markers still show as bold — without the HTML-emitting rich editor. */
  boldButton?: boolean;
  /** When set, the part of every line before the first match is semantically bold in the
   *  public layout, so the editor preview mirrors that weight without changing the text. */
  boldLinePrefixPattern?: RegExp;
}) {
  const id = useFieldId(label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const toggleBold = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    // A prior click may have left the selection on just the inner text (markers just
    // outside it), so a plain `selected.startsWith("**")` check would never see the
    // markers again and every click would wrap it in another layer of `**`.
    const selectionHasMarkers =
      selected.length >= 4 && selected.startsWith("**") && selected.endsWith("**");
    const surroundedByMarkers =
      value.slice(selectionStart - 2, selectionStart) === "**" &&
      value.slice(selectionEnd, selectionEnd + 2) === "**";

    let next: string;
    let newStart: number;
    let inner: string;
    if (selectionHasMarkers) {
      inner = selected.slice(2, -2);
      next = `${value.slice(0, selectionStart)}${inner}${value.slice(selectionEnd)}`;
      newStart = selectionStart;
    } else if (surroundedByMarkers) {
      inner = selected;
      next = `${value.slice(0, selectionStart - 2)}${inner}${value.slice(selectionEnd + 2)}`;
      newStart = selectionStart - 2;
    } else {
      inner = selected || "bold text";
      next = `${value.slice(0, selectionStart)}**${inner}**${value.slice(selectionEnd)}`;
      newStart = selectionStart + 2;
    }
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newStart, newStart + inner.length);
    });
  };

  const syncBackdropScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Assigning a controlled textarea's `.value` can silently reset its own scroll position
  // (a browser quirk, not a "scroll" event) — re-sync after every render so the backdrop
  // never drifts out of step while typing past the visible rows.
  useEffect(() => {
    syncBackdropScroll();
  });

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      {plain ? (
        boldButton ? (
          <div className="flex flex-col overflow-hidden rounded-[10px] border border-rule bg-paper transition-colors focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
            <div className="flex items-center gap-1 border-b border-rule bg-cream/40 px-2 py-1">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleBold}
                title="Bold the selected text"
                className="flex h-6 w-6 items-center justify-center rounded text-ink hover:bg-rule"
              >
                <AdminIcon name="bold" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              {/* Renders `**word**` in bold underneath the real textarea, whose own text is
               *  made transparent — the classic overlay trick, so what you see while typing
               *  matches the page. The `**` markers are rendered as their own transparent
               *  spans rather than left out entirely: they still occupy their character
               *  cells (same monospace width), which is what keeps every later character
               *  lined up with the invisible textarea text sitting on top — actually
               *  removing them would shift the rest of the line out of alignment. */}
              <div
                ref={backdropRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3.5 py-2.5 font-mono text-[0.8rem] leading-[1.5] text-ink"
              >
                {boldLinePrefixPattern
                  ? value.split("\n").map((line, lineIndex, lines) => {
                      const separator = line.search(boldLinePrefixPattern);
                      const prefix = separator === -1 ? line : line.slice(0, separator);
                      const remainder = separator === -1 ? "" : line.slice(separator);
                      return (
                        <span key={lineIndex}>
                          {renderBoldSegments(prefix, `prefix-${lineIndex}`, separator !== -1)}
                          {renderBoldSegments(remainder, `remainder-${lineIndex}`)}
                          {lineIndex < lines.length - 1 ? "\n" : null}
                        </span>
                      );
                    })
                  : renderBoldSegments(value, "text")}
                {value.endsWith("\n") ? " " : null}
              </div>
              <textarea
                id={id}
                ref={textareaRef}
                rows={rows}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                onScroll={syncBackdropScroll}
                className="relative w-full resize-y bg-transparent px-3.5 py-2.5 font-mono text-[0.8rem] leading-[1.5] text-transparent caret-ink outline-none selection:bg-green/20 selection:text-transparent selection:[-webkit-text-fill-color:transparent] placeholder:text-muted"
                style={{ WebkitTextFillColor: "transparent" }}
              />
            </div>
          </div>
        ) : (
          <textarea
            id={id}
            ref={textareaRef}
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputBase} resize-y font-mono text-[0.8rem]`}
          />
        )
      ) : (
        <RichTextarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          ariaLabel={label}
        />
      )}
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
      {/* A real checkbox, visually hidden but still focusable and still the thing the
          label points at — so keyboard, screen readers, and click-the-label all keep
          working for free. The span next to it is the switch, driven entirely by
          `peer-checked`. */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span aria-hidden="true" className={SWITCH} />
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
                  <textarea
                    rows={3}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => set(i, event.target.value)}
                    className={`${inputBase} resize-y`}
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
  type?: "text" | "textarea" | "rich-text" | "number" | "select" | "color" | "list";
  placeholder?: string;
  /** Choices for `type: "select"`. */
  options?: readonly { value: string; label: string }[];
  /** Grid width in a 12-column row. Defaults to full width. */
  span?: number;
  /** Optional presentation classes for the cell control (for example, a specific font size). */
  className?: string;
  /** Schema for a list nested inside this cell. */
  nested?: {
    columns: RepeaterColumn<Record<string, unknown>>[];
    blank: () => Record<string, unknown>;
    addLabel?: string;
  };
  /**
   * Custom control for this cell. Used for image pickers: the uploader lives in
   * image-upload.tsx, which imports from this file, so it cannot be imported back here.
   */
  render?: (value: unknown, onChange: (v: unknown) => void) => ReactNode;
}

/** Array of objects — itinerary days, add-ons, offer cards, FAQs. */
/** The column grid a repeater row renders — shared by the arrow-reorder and drag-reorder variants. */
function RepeaterColumnsGrid<T extends Record<string, unknown>>({
  row,
  columns,
  onFieldChange,
}: {
  row: T;
  columns: RepeaterColumn<T>[];
  onFieldChange: (key: string, v: unknown) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-3">
      {columns.map((col) => (
        <div key={col.key} style={{ gridColumn: `span ${col.span ?? 12}` }}>
          <span className="mb-1 block text-[0.72rem] font-medium text-muted">{col.label}</span>
          {col.render ? (
            col.render(row[col.key], (v) => onFieldChange(col.key, v))
          ) : col.type === "list" && col.nested ? (
            <RepeaterField
              label={col.nested.addLabel ?? col.label}
              values={Array.isArray(row[col.key]) ? (row[col.key] as Record<string, unknown>[]) : []}
              columns={col.nested.columns}
              blank={col.nested.blank}
              onChange={(value) => onFieldChange(col.key, value)}
            />
          ) : col.type === "textarea" ? (
            <textarea
              rows={3}
              value={String(row[col.key] ?? "")}
              placeholder={col.placeholder}
              onChange={(event) => onFieldChange(col.key, event.target.value)}
              className={`${inputBase} resize-y`}
            />
          ) : col.type === "rich-text" ? (
            <RichTextarea
              rows={5}
              value={String(row[col.key] ?? "")}
              placeholder={col.placeholder}
              ariaLabel={col.label}
              onChange={(value) => onFieldChange(col.key, value)}
            />
          ) : col.type === "select" ? (
            <select
              value={String(row[col.key] ?? "")}
              onChange={(e) => onFieldChange(col.key, e.target.value)}
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
                value={
                  /^#[0-9a-f]{6}$/i.test(String(row[col.key] ?? ""))
                    ? String(row[col.key])
                    : "#000000"
                }
                onChange={(e) => onFieldChange(col.key, e.target.value)}
                aria-label={col.label}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border-[1.5px] border-rule bg-paper p-1"
              />
              <input
                type="text"
                value={String(row[col.key] ?? "")}
                placeholder="#1E5F3B"
                onChange={(e) => onFieldChange(col.key, e.target.value)}
                className={`${inputBase} font-mono text-[0.8rem]`}
              />
            </div>
          ) : (
            <input
              type={col.type === "number" ? "number" : "text"}
              value={String(row[col.key] ?? "")}
              placeholder={col.placeholder}
              onChange={(e) =>
                onFieldChange(col.key, col.type === "number" ? Number(e.target.value) : e.target.value)
              }
              className={`${inputBase} ${col.className ?? ""}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * The shared object-list editor. Rows have no inherent id, so each gets one generated on
 * first render and carried through add/remove/reorder in `keysRef` rather than being
 * re-derived from `values` every render.
 */
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
  const keysRef = useRef<string[]>(values.map(() => makeRowKey()));
  if (keysRef.current.length !== values.length) {
    const next = keysRef.current.slice(0, values.length);
    while (next.length < values.length) next.push(makeRowKey());
    keysRef.current = next;
  }
  const ids = keysRef.current;

  const setField = (i: number, key: string, v: unknown) =>
    onChange(values.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));

  const remove = (i: number) => {
    keysRef.current = keysRef.current.filter((_, idx) => idx !== i);
    onChange(values.filter((_, idx) => idx !== i));
  };

  const add = () => {
    keysRef.current = [...keysRef.current, makeRowKey()];
    onChange([...values, blank()]);
  };

  function handleReorder(nextIds: string[]) {
    const byId = new Map(ids.map((id, idx) => [id, values[idx]]));
    keysRef.current = nextIds;
    onChange(nextIds.map((id) => byId.get(id)!));
  }

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <SortableList ids={ids} onReorder={handleReorder}>
        <div className="flex flex-col gap-3">
          {values.length === 0 ? (
            <p className="rounded-xl border border-dashed border-rule px-4 py-6 text-center text-[0.78rem] text-muted">
              Nothing here yet. Add the first {singular(label).toLowerCase()} below.
            </p>
          ) : null}
          {values.map((row, i) => (
            <SortableRow key={ids[i]!} id={ids[i]!}>
              {(handle) => (
                <div className="rounded-xl border border-rule bg-cream p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {handle}
                      <span className="text-[0.78rem] font-semibold text-muted">
                        {title ? title(row, i) : `${singular(label)} ${i + 1}`}
                      </span>
                    </div>
                    <IconButton onClick={() => remove(i)} label={`Remove ${singular(label)}`} danger>
                      ✕
                    </IconButton>
                  </div>
                  <RepeaterColumnsGrid
                    row={row}
                    columns={columns}
                    onFieldChange={(key, v) => setField(i, key, v)}
                  />
                </div>
              )}
            </SortableRow>
          ))}
        </div>
      </SortableList>
      <div className="mt-3">
        <AddButton onClick={add} label={`Add ${singular(label)}`} />
      </div>
    </div>
  );
}

/** Both public names now point at the one draggable, recursively nestable implementation. */
export const DraggableRepeaterField = RepeaterField;

let rowKeySeq = 0;
function makeRowKey(): string {
  rowKeySeq += 1;
  return `row-${rowKeySeq}`;
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

export function RowControls({
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

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
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

export function reorder<T>(list: T[], index: number, dir: -1 | 1): T[] {
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
