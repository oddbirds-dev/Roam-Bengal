import { Fragment } from "react";
import parse, { domToReact, Element } from "html-react-parser";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import { SmartLink } from "@/components/ui/smart-link";
import { markdown } from "@/lib/markdown";

/**
 * The single markdown renderer for the whole site.
 *
 * Copy is authored as HTML by the admin toolbar, with Markdown surviving only in legacy
 * rows and `policy-defaults.ts`. So the pipeline is Markdown -> HTML (`marked`, which
 * passes existing HTML through untouched) -> React (`html-react-parser`).
 *
 * It used to be `markdown-to-jsx` in one step, but that renderer drops a whitespace-only
 * text node sitting between two tags and trims whitespace at an inline tag's inner edges.
 * With the toolbar wrapping runs in `<span style="font-size">`, both positions occur
 * around a bolded phrase, so `a <strong>rural char</strong> village` rendered as
 * `arural charvillage` and there was nowhere left to put the space. `html-react-parser`
 * keeps text nodes exactly as authored.
 *
 * Raw HTML is rendered on purpose — that is how the toolbar's Color/Size/Font buttons
 * work — which is why `stripUnsafeHtml` runs on write, `DROPPED_TAGS` below re-filters on
 * render, and `SmartLink` re-checks hrefs.
 */

/**
 * Tags that execute or reach outside the document. `markdown-to-jsx` filtered these
 * itself; `html-react-parser` renders whatever it is given, so the choke point
 * `sanitize.ts` describes has to be restored here.
 */
const DROPPED_TAGS = new Set(["script", "style", "iframe", "object", "embed", "link", "meta"]);

const LINK_CLASS = "text-orange font-medium underline-offset-2 hover:underline";
const STRONG_CLASS = "font-semibold text-ink";

const options: HTMLReactParserOptions = {
  replace(node) {
    if (!(node instanceof Element)) return;

    if (DROPPED_TAGS.has(node.name)) return <Fragment />;

    // Inline handlers survive `stripUnsafeHtml` only if a row predates it; strip them for
    // every tag rather than trusting the write path alone.
    for (const attribute of Object.keys(node.attribs)) {
      if (/^on/i.test(attribute)) delete node.attribs[attribute];
    }

    const children = () => domToReact(node.children as DOMNode[], options);

    if (node.name === "a") {
      return (
        <SmartLink href={node.attribs.href ?? ""} className={LINK_CLASS}>
          {children()}
        </SmartLink>
      );
    }

    if (node.name === "strong" || node.name === "b") {
      return <strong className={STRONG_CLASS}>{children()}</strong>;
    }
  },
};

/**
 * Drops the paragraph wrapper the editor always emits.
 *
 * TipTap serialises even a one-line field as `<p>...</p>`, but every `FormatText` call site
 * already sits inside a styled `<p>`, an `<li>` or a `<strong>`. Left in place the wrapper
 * nests a block inside an inline slot, which the browser resolves by splitting the parent —
 * so the field loses its styling, and where the markup reaches the page as text the tags
 * show up literally. Only the wrapper goes; everything inside it is kept, and a value that
 * is not paragraph-wrapped is returned untouched.
 */
const PARAGRAPH_WRAPPED = /^\s*<p(?:\s[^>]*)?>[\s\S]*<\/p>\s*$/i;

function unwrapParagraphs(html: string): string {
  if (!PARAGRAPH_WRAPPED.test(html)) return html;
  return html
    .trim()
    .replace(/^<p(?:\s[^>]*)?>/i, "")
    .replace(/<\/p>$/i, "")
    // A second paragraph in an inline slot still has to break the line.
    .replace(/<\/p>\s*<p(?:\s[^>]*)?>/gi, "<br />");
}

/**
 * Parses inline Markdown-style **bold** tags and basic HTML tags like <span class="...">.
 * Extremely lightweight and safe for inline content like paragraphs, list items, and headings.
 */
export function FormatText({ children }: { children: string }) {
  if (!children || typeof children !== "string") return <Fragment>{children}</Fragment>;

  const html = unwrapParagraphs(markdown.parseInline(children) as string);

  return <Fragment>{parse(html, options)}</Fragment>;
}

/**
 * Block-level sibling of `FormatText`, for content authored as a whole document rather
 * than a single line. Blocks land as direct children of their typography container, so
 * `.blog-body > *` rules work and an intentional `<p></p>` still occupies space.
 */
export function FormatDocument({ children }: { children: string }) {
  if (!children || typeof children !== "string") return <Fragment>{children}</Fragment>;

  return <Fragment>{parse(markdown.parse(children) as string, options)}</Fragment>;
}
