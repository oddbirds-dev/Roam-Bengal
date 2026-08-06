import { compiler } from "markdown-to-jsx";
console.log(JSON.stringify(compiler(`Hello <span class="text-green text-xl">world</span>!`, { forceInline: true })));
