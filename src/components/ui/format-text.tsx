import Markdown from "markdown-to-jsx";
import type { MarkdownToJSX } from "markdown-to-jsx";
import { SmartLink } from "@/components/ui/smart-link";
import { restoreInlineSpaces } from "@/lib/inline-markup";

/**
 * The single markdown renderer for the whole site.
 *
 * Two option sets share one override map so a link, a bold run, or a `<span class>` from
 * the admin toolbar looks identical in a tour highlight and in a blog body. Raw HTML is
 * rendered on purpose — that is how the toolbar's Color/Size/Font buttons work — which is
 * why `stripUnsafeHtml` runs on write and `SmartLink` re-checks hrefs on render.
 */

const overrides: MarkdownToJSX.Overrides = {
  strong: {
    component: "strong",
    props: { className: "font-semibold text-ink" },
  },
  a: {
    component: SmartLink,
    props: { className: "text-orange font-medium underline-offset-2 hover:underline" },
  },
};

/** One-line strings: paragraphs, list items, headings, table cells. No block parsing. */
export const INLINE_MARKDOWN_OPTIONS: MarkdownToJSX.Options = {
  forceInline: true,
  overrides,
};

/** Full documents: blog bodies. Headings, lists, tables, images. */
export const BLOCK_MARKDOWN_OPTIONS: MarkdownToJSX.Options = {
  // Keep the authored blocks as direct children of their typography container. Besides
  // making `.blog-body > *` rules work, this lets an intentional empty paragraph occupy
  // space instead of being hidden inside markdown-to-jsx's default wrapper div.
  wrapper: null,
  overrides,
};

/**
 * Parses inline Markdown-style **bold** tags and basic HTML tags like <span class="...">.
 * Extremely lightweight and safe for inline content like paragraphs, list items, and headings.
 */
export function FormatText({ children }: { children: string }) {
  if (!children || typeof children !== "string") return <>{children}</>;

  return <Markdown options={INLINE_MARKDOWN_OPTIONS}>{restoreInlineSpaces(children)}</Markdown>;
}

/**
 * Block-level sibling of `FormatText`, for content authored as a whole document rather
 * than a single line. `forceInline` must stay off here or headings and lists collapse.
 */
export function FormatDocument({ children }: { children: string }) {
  if (!children || typeof children !== "string") return <>{children}</>;

  return <Markdown options={BLOCK_MARKDOWN_OPTIONS}>{restoreInlineSpaces(children)}</Markdown>;
}
