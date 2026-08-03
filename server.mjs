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

// Vite content-hashes everything under /assets, so it is safe to cache forever.
const immutableAssets = async (request, next) => {
  const response = await next();
  if (response && new URL(request.url).pathname.startsWith("/assets/")) {
    response.headers.set("cache-control", "public, max-age=31536000, immutable");
  }
  return response;
};

serve({
  port: Number(process.env.PORT) || 3000,
  hostname: process.env.HOST || "0.0.0.0",
  middleware: [immutableAssets, serveStatic({ dir: clientDir })],
  fetch: handler.fetch,
});
