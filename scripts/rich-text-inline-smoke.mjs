import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

// The renderer is a `.tsx` module, so it is loaded through Vite's SSR pipeline (JSX plus
// the `@/` alias) rather than imported directly by node.
//
// `cacheDir` and `optimizeDeps` matter: this server runs with `configFile: false`, so
// without its own cache directory it re-optimizes `node_modules/.vite` against a config
// the real dev server never saw, and the next `npm run dev` serves half-stale dependency
// chunks (React ends up loaded twice, and every hook reads off a null dispatcher).
// Nothing here needs the client optimizer anyway — the modules are only ever loaded SSR.
const server = await createServer({
  configFile: false,
  appType: "custom",
  server: { middlewareMode: true },
  cacheDir: fileURLToPath(new URL("../node_modules/.vite-rich-text-smoke", import.meta.url)),
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
});
const { FormatDocument, FormatText } = await server.ssrLoadModule(
  "/src/components/ui/format-text.tsx",
);

const doc = (value) => renderToStaticMarkup(React.createElement(FormatDocument, null, value));
const line = (value) => renderToStaticMarkup(React.createElement(FormatText, null, value));

/** The run wrapper the toolbar actually emits: font family, then size, then colour. */
const run = (text) =>
  `<span class="font-body"><span style="font-size: 16px">` +
  `<span style="color: rgb(0, 0, 0)">${text}</span></span></span>`;

// The reported bug. Because every run is wrapped, the spaces around a bolded phrase end up
// between two tags — the one position the old `markdown-to-jsx` renderer deleted, turning
// `a rural char village` into `arural charvillage`.
const wrappedRuns = doc(
  `<p>${run("a Meghna River crossing, a ")}` +
    `<strong>${run("rural char")}</strong>` +
    `${run(" village, and a working")}</p>`,
);
assert.match(wrappedRuns, /crossing, a <\/span>/);
assert.match(wrappedRuns, /<\/strong><span[^>]*><span[^>]*><span[^>]*> village/);

// The same boundary without the spans, which is what plain bolding emits.
assert.match(doc("<p>at <strong>Swari Ghat</strong> is dense</p>"), /at <strong[^>]*>Swari Ghat<\/strong> is/);

// Formatting may begin or end part-way through a word. The renderer preserves the exact
// text-node boundaries the editor emits, rather than inserting a guessed space.
const partialWord = doc("<p>dense <strong>w</strong>ith movement</p>");
assert.match(partialWord, /dense <strong[^>]*>w<\/strong>ith movement/);
assert.doesNotMatch(partialWord, /<\/strong> ith/);

// A selection that grabbed the spaces on both sides keeps them inside the mark. They are
// real text nodes, so the browser renders them; nothing needs hoisting out of the tag.
assert.match(
  doc("<p>at<strong> Swari Ghat </strong>is dense</p>"),
  /at<strong[^>]*> Swari Ghat <\/strong>is dense/,
);

// Nested marks — bold plus colour — keep their boundary spaces too.
assert.match(
  doc('<p>at <strong><span class="text-green">Swari Ghat</span></strong> is dense</p>'),
  /at <strong[^>]*><span class="text-green">Swari Ghat<\/span><\/strong> is/,
);

// Legacy Markdown, the shape `policy-defaults.ts` still ships, still renders.
assert.match(line("**25% deposit** — confirms your private tour."), /<strong[^>]*>25% deposit<\/strong> — confirms/);
assert.match(doc("## Head\n\n- one\n- two"), /<h2>Head<\/h2>\s*<ul>\s*<li>one<\/li>/);

// Inline values carry no block wrapper.
for (const value of [
  '<span class="text-green">Hello <strong>world</strong></span>',
  '<span style="color: #1E5F3B">Short heading</span>',
  '<span class="font-display">Table cell</span>',
]) {
  const html = line(value);
  assert.match(html, /^<span/);
  assert.doesNotMatch(html, /<p(?:\s|>)/);
}
// The editor wraps every value, one-liners included, in `<p>`. Inline slots are already
// inside a styled `<p>`, so the wrapper is dropped there — keeping it split the parent and
// left the tags visible on the page. A second paragraph still breaks the line.
assert.equal(
  line('<p><span class="font-display">TipTap paragraph</span></p>'),
  '<span class="font-display">TipTap paragraph</span>',
);
assert.equal(line("<p>one</p><p>two</p>"), "one<br/>two");

// Blocks stay direct siblings so `.blog-body > *` rules apply, and an intentional blank
// paragraph still occupies space rather than being collapsed away.
assert.equal(
  doc("<p><strong>Heading</strong></p><p></p><p>Body</p>"),
  '<p><strong class="font-semibold text-ink">Heading</strong></p><p></p><p>Body</p>',
);

// Links go through `SmartLink`: external ones open in a new tab, an executable scheme
// renders as inert text. (An internal path becomes a router `Link`, which needs a
// `RouterProvider` to render and so is covered by the app itself, not here.)
assert.match(
  line('See <a href="https://example.com">our tours</a>.'),
  /See <a href="https:\/\/example.com" class="text-orange[^"]*" target="_blank" rel="noreferrer noopener">our tours<\/a>\./,
);
assert.match(line('<a href="javascript:alert(1)">x</a>'), /^<span class="text-orange[^"]*">x<\/span>$/);

// Executable markup never reaches the page, even if a row predates `stripUnsafeHtml`.
const unsafe = doc('<p>before<script>alert(1)</script><span onclick="alert(1)">after</span></p>');
assert.doesNotMatch(unsafe, /script|onclick/i);
assert.match(unsafe, /before<span>after<\/span>/);

// `marked` follows CommonMark: Markdown inside a raw HTML block stays literal. The admin
// editor already parses values the same way, so the site now matches what it shows.
assert.match(doc("<p>text with **bold** inside</p>"), /text with \*\*bold\*\* inside/);

await server.close();

console.log(
  "Rich text preserves inline markup, whitespace at mark boundaries, and direct document blocks.",
);
