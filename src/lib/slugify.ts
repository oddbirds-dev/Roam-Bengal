/**
 * Title → URL segment.
 *
 * One copy, because the admin editors that auto-fill a slug from a name (activities, blogs,
 * destinations, tours) must all agree: two implementations drifting apart would mean the same
 * title produced two different public links depending on which screen typed it.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
