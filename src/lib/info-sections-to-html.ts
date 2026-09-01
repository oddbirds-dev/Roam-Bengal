import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * The old structured shape of an info or policy page: a list of blocks, each with its own
 * sub-heading plus any mix of paragraphs and bullet points.
 *
 * These pages are now edited as a single rich-text box, which is what `PolicyLayout` renders when
 * a `body` is present. This converter only exists so pages saved — or shipped in
 * `src/content/policy-defaults.ts` — before that switch open styled in the new editor rather than
 * blank. Nothing writes the block shape any more.
 *
 * `sections` is accepted alongside `blocks` because the reference implementation this was ported
 * from used that name, and a hand-edited row may carry either.
 */

export type LegacyBlock = {
  heading?: string;
  /** Roam's shape. A string is accepted too, since the raw-JSON editor allowed one. */
  paragraphs?: string[] | string;
  items?: string[];
  /** Reference-shaped rows, tolerated so a pasted row does not lose its text. */
  body?: string[] | string;
  note?: string;
};

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

/** Values that used to be rendered as React text nodes, so they were never markup. */
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"]/g, (c) => ENTITIES[c]!);
}

/** Values that used to go through `FormatDocument` — block-level Markdown plus inline HTML. */
function block(value: string): string {
  return (marked.parse(value) as string).trim();
}

/** Values that used to go through `FormatText` — one line, no block parsing. */
function inline(value: string): string {
  return (marked.parseInline(value) as string).trim();
}

const ONLY_A_TABLE = /^<table[\s\S]*<\/table>$/;

function asList(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" && v.trim());
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

/**
 * Flattens the structured blocks into the single HTML string these pages now store, preserving
 * the order the old renderer used: heading, paragraphs, bullet list, note.
 *
 * Paragraph and item text was already Markdown (`FormatText` renders it), so it is parsed rather
 * than escaped; headings were plain text nodes, so they are escaped.
 */
export function blocksToHtml(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";

  const out: string[] = [];

  for (const raw of blocks) {
    if (!raw || typeof raw !== "object") continue;
    const section = raw as LegacyBlock;

    if (section.heading?.trim()) out.push(`<h2>${escapeHtml(section.heading)}</h2>`);

    for (const paragraph of [...asList(section.paragraphs), ...asList(section.body)]) {
      out.push(block(paragraph));
    }

    const items = asList(section.items).map((item) => `<li>${inline(item)}</li>`);
    if (items.length) out.push(`<ul>${items.join("")}</ul>`);

    if (section.note?.trim()) {
      const note = block(section.note);
      // A note that is nothing but a table is not a callout — someone was working around the
      // old editor's lack of a table field. Wrapping it would put a highlighted box round a
      // plain table.
      out.push(ONLY_A_TABLE.test(note) ? note : `<blockquote>${note}</blockquote>`);
    }
  }

  // Blank lines between blocks so `marked` treats each one as raw block HTML and passes it
  // through untouched on the way back out.
  return out.join("\n\n");
}
