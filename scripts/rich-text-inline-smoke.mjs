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

// TipTap includes boundary spaces inside the mark when the admin selects them. Raw HTML
// parsing trims those spaces unless they are moved outside the mark before rendering.
const selectedSpacesSource = 'The ferry terminal at<strong> Swari Ghat </strong>is dense';
const selectedSpacesHtml = renderToStaticMarkup(
  React.createElement(Markdown, { options: { forceInline: true } }, restoreInlineSpaces(selectedSpacesSource)),
);
assert.match(selectedSpacesHtml, /at <strong>Swari Ghat<\/strong> is/);

// The admin bolds a phrase whose selection also grabbed the spaces on both sides. TipTap
// emits `Long<strong> before Dhaka rose </strong>on`; without hoisting, markdown-to-jsx
// trims the mark's edge whitespace and the words collide as `Longbefore Dhaka roseon`.
const boldedPhraseWithSpacesSource =
  '<p>Long<strong> before Dhaka rose </strong>on the map, Sonargaon thrived</p>';
const boldedPhraseWithSpacesHtml = renderToStaticMarkup(
  React.createElement(
    Markdown,
    { options: { wrapper: null } },
    restoreInlineSpaces(boldedPhraseWithSpacesSource),
  ),
);
assert.match(
  boldedPhraseWithSpacesHtml,
  /Long <strong>before Dhaka rose<\/strong> on the map/,
);

// Same, with the font-size span TipTap nests inside the bold mark.
const boldedSizedPhraseSource =
  '<p>Long<strong><span style="font-size: 16px"> before Dhaka rose </span></strong>on the map</p>';
const boldedSizedPhraseHtml = renderToStaticMarkup(
  React.createElement(
    Markdown,
    { options: { wrapper: null } },
    restoreInlineSpaces(boldedSizedPhraseSource),
  ),
);
assert.match(boldedSizedPhraseHtml, /Long <strong><span[^>]*>before Dhaka rose<\/span><\/strong> on the map/);

const nestedSelectedSpacesSource =
  'The ferry terminal at<strong><span class="text-green"> Swari Ghat </span></strong>is dense';
const nestedSelectedSpacesHtml = renderToStaticMarkup(
  React.createElement(
    Markdown,
    { options: { forceInline: true } },
    restoreInlineSpaces(nestedSelectedSpacesSource),
  ),
);
assert.match(
  nestedSelectedSpacesHtml,
  /at <strong><span class="text-green">Swari Ghat<\/span><\/strong> is/,
);

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
