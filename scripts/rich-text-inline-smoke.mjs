import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "markdown-to-jsx";
import { restoreInlineSpaces } from "../src/lib/inline-markup.ts";

const cases = [
  '<span class="text-green">Hello <strong>world</strong></span>',
  '<span style="color: #1E5F3B">Short heading</span>',
  '<span class="font-display">Table cell</span>',
];

const markedBoundarySource = 'The ferry terminal at <strong>Swari Ghat</strong> is dense';
const markedBoundaryHtml = renderToStaticMarkup(
  React.createElement(Markdown, { options: { forceInline: true } }, markedBoundarySource),
);
assert.match(markedBoundaryHtml, /at <strong>Swari Ghat<\/strong> is/);

// Formatting may begin or end part-way through a word. The renderer must preserve the
// exact text-node boundaries TipTap emits, rather than inserting a guessed space.
const partialWordSource = 'The ferry terminal at Swari Ghat is dense <strong>w</strong>ith movement';
const partialWordHtml = renderToStaticMarkup(
  React.createElement(Markdown, { options: { forceInline: true } }, restoreInlineSpaces(partialWordSource)),
);
assert.match(partialWordHtml, /Ghat is dense <strong>w<\/strong>ith movement/);
assert.doesNotMatch(partialWordHtml, /<strong>w<\/strong> ith/);

const formattedPhraseSource = 'The ferry terminal at Swari Ghat <strong>is dense</strong> with movement';
const formattedPhraseHtml = renderToStaticMarkup(
  React.createElement(Markdown, { options: { forceInline: true } }, restoreInlineSpaces(formattedPhraseSource)),
);
assert.match(formattedPhraseHtml, /Ghat <strong>is dense<\/strong> with movement/);

for (const source of cases) {
  const html = renderToStaticMarkup(
    React.createElement(Markdown, { options: { forceInline: true } }, source),
  );
  assert.match(html, /^<span/);
  assert.doesNotMatch(html, /<p(?:\s|>)/);
}

const blockHtml = renderToStaticMarkup(
  React.createElement(
    Markdown,
    { options: { forceInline: true } },
    '<p><span class="font-display">TipTap paragraph</span></p>',
  ),
);
assert.match(blockHtml, /^<p>/);

const documentHtml = renderToStaticMarkup(
  React.createElement(
    Markdown,
    { options: { wrapper: null } },
    "<p><strong>Heading</strong></p><p></p><p>Body</p>",
  ),
);
assert.equal(documentHtml, "<p><strong>Heading</strong></p><p></p><p>Body</p>");

console.log(
  "Rich text preserves inline markup and direct document blocks, including intentional blank paragraphs.",
);
