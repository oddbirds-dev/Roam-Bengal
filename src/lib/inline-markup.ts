const INLINE_TAGS = "a|b|code|del|em|i|s|span|strong|u";
// A run of spaces, tabs, or non-breaking spaces (`&nbsp;`/` `, which a contenteditable
// selection often drags in) sitting against an inline tag boundary.
const WS = "(?:[ \\t\\u00a0]|&nbsp;)+";
const LEADING_SPACE = new RegExp(`(<(?:${INLINE_TAGS})\\b[^>]*>)(${WS})`, "gi");
const TRAILING_SPACE = new RegExp(`(${WS})(</(?:${INLINE_TAGS})\\s*>)`, "gi");

/**
 * Hoist whitespace selected along with formatted text outside the formatting tags.
 *
 * TipTap can emit `at<strong> Swari Ghat </strong>is` when the selection includes both
 * adjacent spaces. markdown-to-jsx trims those spaces inside the raw HTML element, so
 * the preview becomes `atSwari Ghatis`. Moving the existing whitespace across the tag
 * boundary keeps it visible. We never add whitespace, which means a legitimate partial
 * word such as `<strong>w</strong>ith` remains unchanged.
 *
 * Repeat until stable so nested marks, such as bold plus colour, hoist the whitespace
 * through every inline wrapper.
 */
export function restoreInlineSpaces(value: string): string {
  let restored = value;
  let previous: string;
  do {
    previous = restored;
    restored = restored.replace(LEADING_SPACE, "$2$1").replace(TRAILING_SPACE, "$2$1");
  } while (restored !== previous);
  return restored;
}
