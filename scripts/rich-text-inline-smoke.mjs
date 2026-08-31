import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "markdown-to-jsx";

const cases = [
  '<span class="text-green">Hello <strong>world</strong></span>',
  '<span style="color: #1E5F3B">Short heading</span>',
  '<span class="font-display">Table cell</span>',
];

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

console.log(
  "FormatText forceInline preserves bare TipTap spans, but not TipTap paragraph wrappers; inline list/repeater controls must stay plain.",
);
