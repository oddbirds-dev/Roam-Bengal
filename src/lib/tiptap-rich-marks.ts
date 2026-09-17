import { Mark, mergeAttributes } from "@tiptap/core";

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

function styleMark(name: string, property: "font-size" | "color", unit = "") {
  return Mark.create({
    name,
    addAttributes() {
      return {
        value: {
          default: null,
          parseHTML: (element: HTMLElement) => {
            const raw = element.style.getPropertyValue(property);
            if (!raw) return null;
            return unit ? Number.parseInt(raw, 10) || null : raw;
          },
          renderHTML: (attributes: { value?: string | number | null }) =>
            attributes.value !== null && attributes.value !== undefined
              ? { style: `${property}: ${attributes.value}${unit}` }
              : {},
        },
      };
    },
    parseHTML() {
      return [{ tag: `span[style*="${property}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["span", mergeAttributes(HTMLAttributes), 0];
    },
  });
}

export const FontSizeMark = styleMark("fontSize", "font-size", "px");
/** Arbitrary hex colours intentionally remain separate from palette class colours. */
export const CustomColorMark = styleMark("customColor", "color");

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
