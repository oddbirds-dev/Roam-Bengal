// Production server entry.
//
// `vite build` emits an SSR fetch handler at dist/server/server.js and the
// browser bundle at dist/client/. Neither listens on a port, so this wires them
// together: static assets first, everything else falls through to SSR.
import { fileURLToPath } from "node:url";
import { serve } from "srvx";
import { serveStatic } from "srvx/static";
import handler from "./dist/server/server.js";

const clientDir = fileURLToPath(new URL("./dist/client", import.meta.url));

// Duplicated from src/lib/error-page.ts rather than imported: this file runs directly via
// `node server.mjs`, outside the vite/SSR build graph, so there is no `dist/server/*.js`
// module boundary that would let it import that module directly.
function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

// Vite content-hashes everything under /assets, so it is safe to cache forever.
const immutableAssets = async (request, next) => {
  const response = await next();
  if (response && new URL(request.url).pathname.startsWith("/assets/")) {
    response.headers.set("cache-control", "public, max-age=31536000, immutable");
  }
  return response;
};

// Last-resort net below `src/start.ts`'s own `errorMiddleware`: srvx has no Nitro/h3 layer
// doing this for us, so a throw that somehow escapes the SSR handler itself (rather than a
// route/loader/serverFn it wraps) would otherwise crash the request with no response at all.
async function safeFetch(request) {
  try {
    return await handler.fetch(request);
  } catch (error) {
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

serve({
  port: Number(process.env.PORT) || 3000,
  hostname: process.env.HOST || "0.0.0.0",
  middleware: [immutableAssets, serveStatic({ dir: clientDir })],
  fetch: safeFetch,
});
