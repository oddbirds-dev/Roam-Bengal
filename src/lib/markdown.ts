import { Marked } from "marked";

/**
 * The one Markdown parser configuration for the app.
 *
 * An instance rather than `marked.setOptions`, which mutates module-global state — the
 * admin editor, the legacy block converter and the site renderer all parse the same
 * copy, so they must not be able to reconfigure each other by import order.
 *
 * Markdown is legacy input here: the rich-text editor emits HTML, and `marked` passes raw
 * HTML through byte for byte. That fidelity is the point — it is what keeps the spaces
 * around a bolded phrase intact on the way to the renderer.
 */
export const markdown = new Marked({ gfm: true, breaks: false });

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Flattens authored rich text to a single line of plain text.
 *
 * For the places a value has to leave the DOM — `<meta name="description">`, a `title`
 * attribute, a share card — where the editor's `<p>`/`<strong>`/`<span>` markup would
 * otherwise be shown to the reader verbatim.
 */
export function toPlainText(value: string | undefined | null): string {
  if (!value) return "";
  return (value as string)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}
