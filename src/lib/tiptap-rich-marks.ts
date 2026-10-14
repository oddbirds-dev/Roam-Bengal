import { Extension, Mark, mergeAttributes } from "@tiptap/core";

/** Built-in families. Admin-managed families are appended by `RichTextarea`. */
export const FONT_OPTIONS = [
  { value: "font-display", label: "Display (Playfair)" },
  { value: "font-body", label: "Body (Poppins)" },
  { value: "font-script", label: "Script (Caveat)" },
  { value: "font-marker", label: "Marker" },
  { value: "font-kalam", label: "Kalam" },
] as const;

export const COLOR_OPTIONS = [
  { value: "text-green", label: "Green" },
  { value: "text-orange", label: "Orange" },
  { value: "text-accent", label: "Accent" },
  { value: "text-rust", label: "Rust" },
  { value: "text-muted", label: "Muted" },
] as const;

export const BASE_FONT_PX = 16;
export const MIN_FONT_PX = 8;
export const MAX_FONT_PX = 96;

/**
 * A class-backed span mark. Keeping the allow-list explicit prevents a font mark from
 * claiming a colour span (and vice versa), while still allowing both marks to nest.
 */
export function classSpanMark(name: string, allowed: readonly string[]) {
  return Mark.create({
    name,
    addAttributes() {
      return {
        value: {
          default: null,
          parseHTML: (element: HTMLElement) =>
            allowed.find((value) => element.classList.contains(value)) ?? null,
          renderHTML: (attributes: { value?: string | null }) =>
            attributes.value ? { class: attributes.value } : {},
        },
      };
    },
    parseHTML() {
      return [
        {
          tag: "span",
          getAttrs: (element) => {
            if (typeof element === "string") return false;
            return allowed.some((value) => element.classList.contains(value)) ? {} : false;
          },
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["span", mergeAttributes(HTMLAttributes), 0];
    },
  });
}

export function createFontClassMark(customValues: readonly string[] = []) {
  return classSpanMark("fontClass", [
    ...FONT_OPTIONS.map((option) => option.value),
    ...customValues,
  ]);
}

export const ColorClassMark = classSpanMark(
  "colorClass",
  COLOR_OPTIONS.map((option) => option.value),
);

/** Word and Google Docs size text in points (`11pt`, `11.0pt`); the editor stores px. */
function toPx(raw: string): number | null {
  const match = /^(-?[\d.]+)\s*(px|pt|r?em)?$/i.exec(raw.trim());
  if (!match) return null;
  const amount = Number.parseFloat(match[1] ?? "");
  const unit = (match[2] ?? "px").toLowerCase();
  const px = unit === "pt" ? (amount * 4) / 3 : unit === "px" ? amount : amount * BASE_FONT_PX;
  if (!Number.isFinite(px) || px <= 0) return null;
  return Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, Math.round(px)));
}

/** Keeps a font stack like `"Times New Roman", serif` and drops anything that is not one. */
function cleanFontFamily(raw: string): string | null {
  const value = raw.replace(/"/g, "'").replace(/[^\w\s,'.-]/g, "").trim();
  return value || null;
}

const TRANSPARENT = /^(transparent|initial|inherit|unset|none|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\))$/i;

/**
 * Inline-style span mark. Parsed with a `style` rule rather than a `span[style*=…]` tag rule:
 * a tag rule claims the element for the first mark that matches, so a pasted
 * `<span style="font-size:11pt;color:red">` used to keep only one of the two.
 */
function styleMark(
  name: string,
  property: "font-size" | "color" | "font-family" | "background-color",
  parse: (raw: string) => string | number | null,
  unit = "",
) {
  return Mark.create({
    name,
    addAttributes() {
      return {
        value: {
          default: null,
          renderHTML: (attributes: { value?: string | number | null }) =>
            attributes.value !== null && attributes.value !== undefined
              ? { style: `${property}: ${attributes.value}${unit}` }
              : {},
        },
      };
    },
    parseHTML() {
      return [
        {
          style: property,
          getAttrs: (raw) => {
            const value = parse(raw);
            return value === null ? false : { value };
          },
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["span", mergeAttributes(HTMLAttributes), 0];
    },
  });
}

export const FontSizeMark = styleMark("fontSize", "font-size", toPx, "px");
/** Arbitrary hex colours intentionally remain separate from palette class colours. */
export const CustomColorMark = styleMark("customColor", "color", (raw) => raw.trim() || null);
/** A pasted document's own font (Calibri, Times New Roman…), kept as an inline stack. */
export const FontFamilyMark = styleMark("fontFamily", "font-family", cleanFontFamily);
export const HighlightMark = styleMark("highlight", "background-color", (raw) =>
  !raw.trim() || TRANSPARENT.test(raw.trim()) ? null : raw.trim(),
);

export const TEXT_ALIGNS = ["left", "center", "right", "justify"] as const;
type TextAlign = (typeof TEXT_ALIGNS)[number];

/** Paragraph/heading alignment as an inline `text-align`, which Word and Docs both emit. */
export const TextAlignAttribute = Extension.create({
  name: "textAlign",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const raw = (element.style.textAlign || element.getAttribute("align") || "").toLowerCase();
              return raw !== "left" && (TEXT_ALIGNS as readonly string[]).includes(raw) ? raw : null;
            },
            renderHTML: (attributes: { textAlign?: TextAlign | null }) =>
              attributes.textAlign ? { style: `text-align: ${attributes.textAlign}` } : {},
          },
        },
      },
    ];
  },
});

/**
 * Word and Docs mark the top-level heading `<h1>`, which this editor does not allow (the page
 * title is the h1), so pasted headings shift one level down instead of turning into plain text.
 */
export function demotePastedHeadings(html: string): string {
  if (typeof DOMParser === "undefined" || !/<h[1-6]\b/i.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const level = Math.min(4, Number(heading.tagName[1]) + 1);
    const replacement = doc.createElement(`h${level}`);
    for (const attribute of Array.from(heading.attributes)) {
      replacement.setAttribute(attribute.name, attribute.value);
    }
    replacement.append(...Array.from(heading.childNodes));
    heading.replaceWith(replacement);
  });
  return doc.body.innerHTML;
}

export const BASE_LINE_HEIGHT = 1.6;
export const MIN_LINE_HEIGHT = 1;
export const MAX_LINE_HEIGHT = 3;
export const LINE_HEIGHT_STEP = 0.1;

const clampLineHeight = (value: number) =>
  Math.min(MAX_LINE_HEIGHT, Math.max(MIN_LINE_HEIGHT, Math.round(value * 10) / 10));

/** Unlike font-size, line-height is unitless, so it needs its own float parsing rather
 * than styleMark's integer-px handling. Mod-Shift-Up/Down mirror the toolbar stepper so
 * the shortcut users reach for instinctively actually does something. */
export const LineHeightMark = Mark.create({
  name: "lineHeight",
  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.style.getPropertyValue("line-height");
          return raw ? Number.parseFloat(raw) || null : null;
        },
        renderHTML: (attributes: { value?: number | null }) =>
          attributes.value !== null && attributes.value !== undefined
            ? { style: `line-height: ${attributes.value}` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="line-height"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    const step = (delta: number) => () => {
      const { editor } = this;
      if (editor.state.selection.empty) return false;
      const current = Number(editor.getAttributes("lineHeight").value) || BASE_LINE_HEIGHT;
      editor.chain().focus().setMark("lineHeight", { value: clampLineHeight(current + delta) }).run();
      return true;
    };
    return {
      "Mod-Shift-ArrowUp": step(LINE_HEIGHT_STEP),
      "Mod-Shift-ArrowDown": step(-LINE_HEIGHT_STEP),
    };
  },
});
