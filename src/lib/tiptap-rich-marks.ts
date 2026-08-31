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
