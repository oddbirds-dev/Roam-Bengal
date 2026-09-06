import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "markdown-to-jsx";

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

const repairedBoundarySource = 'The ferry terminal at<strong>Swari Ghat</strong>is dense';
const repairedBoundaryHtml = renderToStaticMarkup(
  React.createElement(
    Markdown,
    { options: { forceInline: true } },
    repairedBoundarySource.replace(/([^\s>])(<(?:a|b|code|em|i|s|span|strong|u)\b)/gi, "$1 $2")
      .replace(/(<\/(?:a|b|code|em|i|s|span|strong|u)>)(?=[^\s<])/gi, "$1 "),
  ),
);
assert.match(repairedBoundaryHtml, /at <strong>Swari Ghat<\/strong> is/);

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
