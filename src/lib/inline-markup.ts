const INLINE_TAGS = "a|b|code|em|i|s|span|strong|u";

/** Keep word boundaries visible when an inline mark is adjacent to plain text. */
export function restoreInlineSpaces(value: string): string {
  return value
    .replace(new RegExp(`([^\\s>])(<(?:${INLINE_TAGS})\\b)`, "gi"), "$1 $2")
    .replace(new RegExp(`(</(?:${INLINE_TAGS})>)(?=[^\\s<])`, "gi"), "$1 ");
}