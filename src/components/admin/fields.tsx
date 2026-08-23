import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminIcon } from "@/components/admin/icons";
import {
  LinkPicker,
  useLinkTargets,
  type LinkPickResult,
} from "@/components/admin/link-picker";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import type { LinkTargetKind } from "@/lib/link-targets";
import { resolveCustomFonts } from "@/lib/custom-fonts";
import { useSiteSettings } from "@/hooks/use-site-settings";

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

/* ------------------------------------------------------------------------ *
 * Rich text
 *
 * The stored format is unchanged — inline Markdown (`**bold**`, `[text](/href)`)
 * mixed with the raw `<span class>` / `<span style>` / `<u>` the toolbar emits, which is
 * exactly what `FormatText` renders on the site. What changed is that admins no longer
 * *see* that format: the editing surface is a `contentEditable` showing the styled result,
 * and the source is derived from the DOM on every keystroke.
 *
 * `sourceToHtml` runs once when a value arrives from outside; `htmlToSource` runs on every
 * edit. They are deliberately a small, lossy-in-one-direction pair: anything the toolbar
 * cannot produce is dropped on the way back, which is what keeps pasted Word markup from
 * ending up in the database.
 * ------------------------------------------------------------------------ */

/** Font size of a selection is stored as an inline `font-size: Npx` style rather than a
 *  fixed class, so the toolbar can offer a continuous +/- stepper and a typed value like a
 *  word processor, instead of a handful of preset sizes. */
const BASE_FONT_PX = 16;
const MIN_FONT_PX = 8;
const MAX_FONT_PX = 96;

/** `[anchor text](/some/path "optional title")` */
const MD_LINK = /\[([^\]\n]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

/**
 * The three things the toolbar can put on a span. Applying one clears the same group off
 * everything it wraps, so picking a second font replaces the first instead of nesting
 * inside it.
 *
 * "color" deliberately spans two mechanisms: the `text-*` brand classes and a custom
 * `color:` style. They are alternatives for the same decision, so choosing either has to
 * clear the other — otherwise a preset picked after a custom colour looks like it did
 * nothing, because the inline style still wins.
 */
type FormatGroup = "font" | "color" | "size";

/** The inline style property a group owns, if it owns one. */
const GROUP_STYLE_PROP: Record<FormatGroup, string | null> = {
  font: null,
  color: "color",
  size: "font-size",
};

/** Seeds the custom-colour picker when the selection has no colour of its own. */
const DEFAULT_CUSTOM_COLOR = "#1E5F3B";

/** Sentinel option value — not a class, so it can never collide with a real one. */
const CUSTOM_COLOR = "__custom__";

/** The site's own families. Custom ones are appended at render time from settings. */
const BUILT_IN_FONTS = [
  { value: "font-display", label: "Display (Playfair)" },
  { value: "font-body", label: "Body (Poppins)" },
  { value: "font-script", label: "Script (Caveat)" },
  { value: "font-marker", label: "Marker" },
  { value: "font-kalam", label: "Kalam" },
];

const COLOR_OPTIONS = [
  { value: "text-green", label: "Green" },
  { value: "text-green-dark", label: "Dark Green" },
  { value: "text-gold", label: "Gold" },
  { value: "text-rust", label: "Rust" },
  { value: "text-orange", label: "Orange" },
  { value: "text-accent", label: "Accent" },
];

/**
 * Which classes each group owns — matched whole, never by prefix.
 *
 * `font-` and `text-` are the two busiest prefixes in Tailwind: `font-semibold` and
 * `text-center` share them with the families and colours here, and a prefix test would
 * strip those too the moment someone changed a font.
 */
const GROUP_CLASS_RE = {
  font: new RegExp(`^(${BUILT_IN_FONTS.map((o) => o.value).join("|")}|font-custom(-[a-z0-9-]+)?)$`),
  color: new RegExp(`^(${COLOR_OPTIONS.map((o) => o.value).join("|")})$`),
  size: null,
} satisfies Record<FormatGroup, RegExp | null>;

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** `el.style.color` reads back as `rgb(30, 95, 59)` whatever was assigned, so a value that
 *  round-trips through the editor would otherwise change shape on every save. Store the
 *  hex the author actually picked. */
function toHexColor(value: string): string {
  const raw = value.trim();
  const rgb = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgb) return raw;
  return `#${rgb
    .slice(1, 4)
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Stored source → HTML for the editable surface. Raw HTML in the source passes straight
 *  through; only the Markdown constructs need expanding. */
export function sourceToHtml(source: string): string {
  if (!source) return "";
  MD_LINK.lastIndex = 0;
  return source
    .replace(MD_LINK, (_m, text: string, href: string) => `<a href="${escapeAttr(href)}">${text || href}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");
}

/** Moves whitespace outside a wrapper, because `** bold **` is not bold in Markdown. */
function wrapTight(inner: string, open: string, close: string): string {
  const match = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match || !match[2]) return inner;
  return `${match[1]}${open}${match[2]}${close}${match[3]}`;
}

function serializeChildren(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    out += serializeNode(child);
  });
  return out;
}

/** DOM → stored source. The `default` case unwraps rather than drops, so an unexpected
 *  element (a pasted `<font>`, a browser-inserted wrapper) loses its markup but never its
 *  words. */
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  if (el.tagName === "BR") return "\n";
  // Nothing in the toolbar produces these; a paste might. Drop them whole rather than
  // letting their bodies survive as text.
  if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return "";

  const inner = serializeChildren(el);
  if (!inner) return "";

  switch (el.tagName) {
    case "B":
    case "STRONG":
      return wrapTight(inner, "**", "**");
    case "I":
    case "EM":
      return wrapTight(inner, "*", "*");
    case "U":
      return wrapTight(inner, "<u>", "</u>");
    case "A": {
      const href = el.getAttribute("href") ?? "";
      return href ? `[${inner}](${href})` : inner;
    }
    case "SPAN": {
      // Class and style are not alternatives — a span can carry a brand font class and a
      // custom colour at once, so both attributes have to survive the trip.
      const cls = el.getAttribute("class")?.trim();
      const styles: string[] = [];
      const size = Number.parseInt(el.style.fontSize, 10);
      if (Number.isFinite(size) && size !== BASE_FONT_PX) styles.push(`font-size: ${size}px`);
      const color = toHexColor(el.style.color);
      if (color) styles.push(`color: ${color}`);

      if (!cls && styles.length === 0) return inner;
      const attrs =
        (cls ? ` class="${escapeAttr(cls)}"` : "") +
        (styles.length ? ` style="${styles.join("; ")}"` : "");
      return `<span${attrs}>${inner}</span>`;
    }
    case "DIV":
    case "P":
      return `${inner}\n`;
    default:
      return inner;
  }
}

export function htmlToSource(html: string): string {
  const root = document.createElement("div");
  root.innerHTML = html;
  return serializeChildren(root)
    .replace(/ /g, " ")
    // A contentEditable ends every block with a filler line break the author never typed.
    .replace(/\n+$/, "");
}

/** A span carrying nothing the toolbar put there is just noise in the markup. */
function isBareSpan(span: HTMLElement): boolean {
  return !span.className.trim() && !span.getAttribute("style");
}

/** Takes `group` off one span — both the class it owns and the style it owns. */
function clearGroup(span: HTMLElement, group: FormatGroup) {
  const prop = GROUP_STYLE_PROP[group];
  if (prop) span.style.removeProperty(prop);

  const owned = GROUP_CLASS_RE[group];
  if (owned) {
    span.className = span.className
      .split(/\s+/)
      .filter((c) => c && !owned.test(c))
      .join(" ");
  }
}

/** Drops toolbar-owned classes/styles from everything inside `frag`, so the wrapper about
 *  to go around it is the only one that decides. */
function stripFormatting(frag: DocumentFragment | HTMLElement, group: FormatGroup) {
  frag.querySelectorAll("span").forEach((span) => {
    clearGroup(span, group);
    if (isBareSpan(span)) span.replaceWith(...Array.from(span.childNodes));
  });
}

/** After wrapping, an ancestor carrying the same kind of formatting over exactly the same
 *  text is now dead weight — and worse, it is what makes a second font pick look like it
 *  did nothing. Peel it off. */
function unwrapRedundantAncestor(el: HTMLElement, root: HTMLElement, group: FormatGroup) {
  const parent = el.parentElement;
  if (!parent || parent === root || parent.tagName !== "SPAN") return;
  if (parent.textContent !== el.textContent) return;

  clearGroup(parent, group);
  if (isBareSpan(parent)) {
    parent.replaceWith(...Array.from(parent.childNodes));
  }
}

function selectNode(node: Node) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Re-selects a run of siblings — what's left after a wrapper is peeled off. */
function selectNodes(nodes: ChildNode[]) {
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const selection = window.getSelection();
  if (!first || !last || !selection) return;
  const range = document.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Peels a wrapper off, leaving its children in place and selected. */
function unwrap(el: HTMLElement) {
  const kids = Array.from(el.childNodes);
  el.replaceWith(...kids);
  selectNodes(kids);
}

/** The nearest ancestor matching `test`, stopping at the editor root. */
function closestWithin(
  node: Node | null,
  root: HTMLElement,
  test: (el: HTMLElement) => boolean,
): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current.nodeType === Node.ELEMENT_NODE && test(current as HTMLElement)) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }
  return null;
}

export function RichTextEditor({
  id,
  rows = 4,
  value,
  placeholder,
  onChange,
  ariaLabel,
}: {
  id?: string;
  rows?: number;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  /** `label for=` cannot name a div, so the field label is repeated here for screen
   *  readers. */
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Fonts the admin added under Site content → Custom Fonts, offered alongside the site's
  // own five. Only saved fonts appear: the class has to exist in the page before the
  // editor can show text in it.
  const { custom_fonts } = useSiteSettings();
  const fontOptions = [
    ...BUILT_IN_FONTS,
    ...resolveCustomFonts(custom_fonts).map((font) => ({
      value: font.className,
      label: font.label,
    })),
  ];
  const [hint, setHint] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [sizeValue, setSizeValue] = useState(BASE_FONT_PX);
  const [showSource, setShowSource] = useState(false);

  /** What we last handed to `onChange`. Re-writing `innerHTML` from a value we ourselves
   *  produced would reset the caret to the top of the field on every keystroke. */
  const emitted = useRef<string | null>(null);
  /** The selection at the moment the link picker opened; focus moves to the dialog. */
  const savedRange = useRef<Range | null>(null);
  const colorInput = useRef<HTMLInputElement>(null);
  /** The span a custom colour is being tried on. The OS colour dialog takes focus and
   *  fires as the author drags, so the selection is gone by the second event — holding the
   *  element instead of the range is what makes the live preview possible. */
  const colorTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || showSource) return;
    if (value === emitted.current) return;
    el.innerHTML = sourceToHtml(value);
    emitted.current = value;
  }, [value, showSource]);

  /** Inline, non-blocking replacement for `alert()`, which stole the very selection the
   *  editor was about to format. */
  const flash = (message: string) => {
    setHint(message);
    setTimeout(() => setHint(null), 2600);
  };

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = htmlToSource(el.innerHTML);
    emitted.current = next;
    onChange(next);
  };

  /** Runs `fn` against the live selection, after checking it is a real range inside this
   *  editor. Everything the toolbar does needs those same three guards. */
  const withSelection = (fn: (range: Range) => void, emptyMessage: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range || !el.contains(range.commonAncestorContainer)) {
      flash(emptyMessage);
      return;
    }
    if (range.collapsed) {
      flash(emptyMessage);
      return;
    }
    fn(range);
    emit();
  };

  /** Wraps the selection in a fresh span, having first cleared `group` off everything
   *  inside it and off a redundant ancestor. Every style the toolbar applies is this. */
  const wrapSelection = (
    group: FormatGroup,
    decorate: (span: HTMLElement) => void,
    emptyMessage: string,
  ) => {
    let wrapper: HTMLElement | null = null;
    withSelection((range) => {
      const el = ref.current!;
      const contents = range.extractContents();
      stripFormatting(contents, group);
      const span = document.createElement("span");
      decorate(span);
      span.appendChild(contents);
      range.insertNode(span);
      unwrapRedundantAncestor(span, el, group);
      selectNode(span);
      wrapper = span;
    }, emptyMessage);
    return wrapper;
  };

  const applyClass = (cls: string) => {
    const group: FormatGroup = GROUP_CLASS_RE.color.test(cls) ? "color" : "font";
    wrapSelection(
      group,
      (span) => {
        span.className = cls;
      },
      "Select some text first, then choose a style.",
    );
  };

  /** Opens the OS colour dialog on a span wrapped around the selection up front, so every
   *  event the dialog fires while the author drags lands on the same element. */
  const startCustomColor = () => {
    const el = ref.current;
    const input = colorInput.current;
    if (!el || !input) return;

    // Seed the swatch from the colour already on the selection, when there is one.
    const selection = window.getSelection();
    const from =
      selection && selection.rangeCount > 0
        ? closestWithin(
            selection.getRangeAt(0).commonAncestorContainer,
            el,
            (node) => node.tagName === "SPAN" && !!node.style.color,
          )
        : null;
    input.value = from ? toHexColor(from.style.color) : DEFAULT_CUSTOM_COLOR;

    colorTarget.current = wrapSelection(
      "color",
      (span) => {
        span.style.color = input.value;
      },
      "Select some text first, then pick a colour.",
    );
    if (colorTarget.current) input.click();
  };

  const applyCustomColor = (hex: string) => {
    const target = colorTarget.current;
    if (!target) return;
    target.style.color = hex;
    emit();
  };

  const applySize = (rawNext: number) => {
    if (!Number.isFinite(rawNext)) return;
    const next = Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, Math.round(rawNext)));
    withSelection((range) => {
      const el = ref.current!;
      // The stepper is meant to be pressed repeatedly. When the selection is already
      // exactly one sized span, retune that span rather than nesting a second one inside
      // it — and keep the same DOM node, so the caret survives the round trip.
      const sized = closestWithin(
        range.commonAncestorContainer,
        el,
        (node) => node.tagName === "SPAN" && !!node.style.fontSize,
      );
      if (sized && sized.textContent === range.toString()) {
        if (next === BASE_FONT_PX) {
          sized.style.removeProperty("font-size");
          if (!sized.className.trim() && !sized.getAttribute("style")) unwrap(sized);
          else selectNode(sized);
        } else {
          sized.style.fontSize = `${next}px`;
          selectNode(sized);
        }
        setSizeValue(next);
        return;
      }

      const contents = range.extractContents();
      stripFormatting(contents, "size");
      if (next === BASE_FONT_PX) {
        // Back to the inherited size: strip, don't wrap in a no-op span.
        const kids = Array.from(contents.childNodes);
        range.insertNode(contents);
        selectNodes(kids);
      } else {
        const span = document.createElement("span");
        span.style.fontSize = `${next}px`;
        span.appendChild(contents);
        range.insertNode(span);
        unwrapRedundantAncestor(span, el, "size");
        selectNode(span);
      }
      setSizeValue(next);
    }, "Select some text first, then adjust its size.");
  };

  /** Reflects the size of whatever's currently selected in the "px" field, so the toolbar
   *  shows the selection's real size rather than staying pinned at the default. */
  const syncSizeFromSelection = () => {
    const el = ref.current;
    if (!el) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const sized = closestWithin(
      selection.getRangeAt(0).commonAncestorContainer,
      el,
      (node) => node.tagName === "SPAN" && !!node.style.fontSize,
    );
    setSizeValue(sized ? Number.parseInt(sized.style.fontSize, 10) : BASE_FONT_PX);
  };

  /** Bold/italic/underline go through `execCommand`. It is deprecated but universally
   *  implemented, and it is the only thing that gets toggling a partial selection across
   *  element boundaries right without a full editor library. `styleWithCSS` off keeps it
   *  emitting `<b>`/`<i>`/`<u>` — tags the serializer understands — rather than styles. */
  const command = (name: "bold" | "italic" | "underline") => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(name);
    emit();
  };

  const openLinkPicker = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range || !el.contains(range.commonAncestorContainer)) {
      flash("Put the cursor in the text first.");
      return;
    }

    const anchor = closestWithin(range.commonAncestorContainer, el, (n) => n.tagName === "A");
    if (anchor) {
      savedRange.current = null;
      setPicker({
        anchor,
        initial: { href: anchor.getAttribute("href") ?? "", text: anchor.textContent ?? "" },
        editing: true,
      });
      return;
    }

    if (range.collapsed) {
      flash("Select the words the link should cover.");
      return;
    }
    savedRange.current = range.cloneRange();
    setPicker({ anchor: null, initial: { href: "", text: range.toString() }, editing: false });
  };

  const applyLink = ({ value: href, label }: LinkPickResult) => {
    if (!picker) return;
    if (picker.anchor) {
      picker.anchor.setAttribute("href", href);
      if (label.trim()) picker.anchor.textContent = label.trim();
      emit();
      return;
    }
    const range = savedRange.current;
    if (!range) return;
    const anchor = document.createElement("a");
    anchor.setAttribute("href", href);
    const contents = range.extractContents();
    anchor.appendChild(contents);
    if (label.trim() && label.trim() !== anchor.textContent) anchor.textContent = label.trim();
    if (!anchor.textContent) anchor.textContent = href;
    range.insertNode(anchor);
    selectNode(anchor);
    emit();
  };

  const removeLink = () => {
    const anchor = picker?.anchor;
    if (!anchor) return;
    anchor.replaceWith(...Array.from(anchor.childNodes));
    emit();
  };

  /** Paste as plain text. Word and Google Docs carry a payload of inline styles that the
   *  serializer would silently discard anyway — better to never let it in. */
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emit();
  };

  const toolbarButton =
    "flex h-[24px] w-[24px] items-center justify-center rounded bg-transparent text-ink hover:bg-rule";
  const dropdown =
    "text-[0.72rem] outline-none bg-transparent font-medium cursor-pointer text-ink hover:text-green";

  return (
    <div className="flex flex-col rounded-[10px] border border-rule bg-paper overflow-hidden transition-colors focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-cream/40 px-2.5 py-1.5">
        <select
          title="Text Font"
          disabled={showSource}
          value=""
          onChange={(e) => {
            if (e.target.value) applyClass(e.target.value);
            e.target.value = "";
          }}
          className={dropdown}
        >
          <option value="">Font</option>
          {fontOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="h-4 w-px bg-rule" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applySize(sizeValue - 1)}
            disabled={showSource}
            title="Decrease text size"
            className={toolbarButton}
          >
            <AdminIcon name="minus" className="h-[14px] w-[14px]" />
          </button>
          <input
            type="number"
            value={sizeValue}
            min={MIN_FONT_PX}
            max={MAX_FONT_PX}
            disabled={showSource}
            title="Text size (px)"
            onChange={(e) => applySize(e.target.valueAsNumber)}
            className="w-11 rounded border border-rule bg-paper px-1 py-0.5 text-center text-[0.72rem] font-medium text-ink outline-none focus:border-green"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applySize(sizeValue + 1)}
            disabled={showSource}
            title="Increase text size"
            className={toolbarButton}
          >
            <AdminIcon name="plus" className="h-[14px] w-[14px]" />
          </button>
        </div>
        <div className="h-4 w-px bg-rule" />
        <button
          type="button"
          // Mousedown, not click: the browser clears the selection when focus moves, and
          // click fires too late to save it.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("bold")}
          disabled={showSource}
          title="Bold text"
          className={toolbarButton}
        >
          <AdminIcon name="bold" className="h-[14px] w-[14px]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("italic")}
          disabled={showSource}
          title="Italic text"
          className={toolbarButton}
        >
          <AdminIcon name="italic" className="h-[14px] w-[14px]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("underline")}
          disabled={showSource}
          title="Underline text"
          className={toolbarButton}
        >
          <AdminIcon name="underline" className="h-[14px] w-[14px]" />
        </button>
        <div className="h-4 w-px bg-rule" />
        <select
          title="Text Color"
          disabled={showSource}
          value=""
          onChange={(e) => {
            if (e.target.value === CUSTOM_COLOR) startCustomColor();
            else if (e.target.value) applyClass(e.target.value);
            e.target.value = "";
          }}
          className={dropdown}
        >
          <option value="">Color</option>
          {COLOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value={CUSTOM_COLOR}>Custom…</option>
        </select>
        {/* Hidden: the dropdown owns the interaction, this is only the OS colour dialog.
            React fires `onChange` on the native `input` event, so the text recolours live
            as the author moves around the wheel rather than only on OK. */}
        <input
          ref={colorInput}
          type="color"
          tabIndex={-1}
          aria-hidden="true"
          // Zero-sized rather than `display: none`, which stops `.click()` opening the
          // dialog. Left in flow so the dialog anchors next to the dropdown that opened it.
          className="pointer-events-none h-0 w-0 border-0 p-0 opacity-0"
          onChange={(e) => applyCustomColor(e.currentTarget.value)}
        />
        <div className="h-4 w-px bg-rule" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPicker}
          disabled={showSource}
          title="Insert or edit a link"
          className={toolbarButton}
        >
          <AdminIcon name="link" className="h-[14px] w-[14px]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowSource((s) => !s)}
          title={showSource ? "Back to formatted view" : "Edit the underlying code"}
          aria-pressed={showSource}
          className={`${toolbarButton} ${showSource ? "bg-rule text-green" : ""}`}
        >
          <AdminIcon name="code" className="h-[14px] w-[14px]" />
        </button>
        {hint ? (
          <span role="status" className="ml-auto truncate text-[0.72rem] font-medium text-rust">
            {hint}
          </span>
        ) : null}
      </div>

      {showSource ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            // Straight through: the editable surface re-reads it when the toggle flips back.
            emitted.current = null;
            onChange(e.target.value);
          }}
          className="w-full bg-transparent px-3.5 py-2.5 font-mono text-[0.8rem] outline-none"
        />
      ) : (
        <div className="relative">
          {!value && placeholder ? (
            <span className="pointer-events-none absolute top-2.5 left-3.5 text-[0.88rem] text-muted">
              {placeholder}
            </span>
          ) : null}
          <div
            ref={ref}
            id={id}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={ariaLabel}
            spellCheck
            style={{ minHeight: `calc(${rows} * 1.5em + 1.25rem)` }}
            onInput={emit}
            onBlur={emit}
            onPaste={onPaste}
            onSelect={syncSizeFromSelection}
            onKeyUp={syncSizeFromSelection}
            onMouseUp={syncSizeFromSelection}
            className="w-full whitespace-pre-wrap px-3.5 py-2.5 text-[0.88rem] leading-[1.5] outline-none [&_a]:text-orange [&_a]:underline"
          />
        </div>
      )}

      {/* Mounted only while open. The tour editor renders ~20 of these, and an
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
  /** The `<a>` being edited, or null when the picker will create one. */
  anchor: HTMLElement | null;
  initial: { href: string; text: string };
  /** True when the caret was inside an existing link, enabling "Remove link". */
  editing: boolean;
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
  plain,
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
}) {
  const id = useFieldId(label);
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      {plain ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} resize-y font-mono text-[0.8rem]`}
        />
      ) : (
        <RichTextEditor
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
                  <RichTextEditor
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
            <RepeaterColumnsGrid
              row={row}
              columns={columns}
              onFieldChange={(key, v) => setField(i, key, v)}
            />
          </div>
        ))}
        <AddButton onClick={() => onChange([...values, blank()])} label={`Add ${singular(label)}`} />
      </div>
    </div>
  );
}

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
          ) : col.type === "textarea" ? (
            <RichTextEditor
              rows={3}
              value={String(row[col.key] ?? "")}
              placeholder={col.placeholder}
              onChange={(v) => onFieldChange(col.key, v)}
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
              className={inputBase}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Same shape as `RepeaterField`, reordered by dragging a handle instead of ↑/↓ buttons.
 * Rows have no inherent id, so each gets one generated on first render and carried through
 * add/remove/reorder in `keysRef` rather than being re-derived from `values` every render.
 */
export function DraggableRepeaterField<T extends Record<string, unknown>>({
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
