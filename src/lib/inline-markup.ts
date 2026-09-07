/**
 * Preserve inline HTML exactly as it was authored.
 *
 * TipTap serializes whitespace as text nodes on either side of a mark. Rewriting the
 * HTML with a tag-boundary regex makes that serialization lossy: a legitimate partial
 * selection such as `with` with only `w` bolded becomes `w ith`. Let the editor and
 * renderer retain the original nodes instead of trying to infer word boundaries.
 */
export function restoreInlineSpaces(value: string): string {
  return value;
}
