import { createStart, createCsrfMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { createMiddleware } from "@tanstack/react-start";
import { serverClient } from "@/integrations/supabase/client";

/**
 * Global middleware.
 *
 * `csrfMiddleware` is filtered to `handlerType === "serverFn"` on purpose. Document
 * requests must NOT be blocked — an inbound link from Google, Facebook, or a WhatsApp
 * share is legitimately cross-site. Server function RPCs are a different matter: they
 * are the two public writes (`submitInquiry`, `subscribeNewsletter`) plus, later, every
 * admin mutation, and none of those should ever be invocable from another origin.
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === "serverFn",
});

const redirectsMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // We skip fetching redirects for static assets and API routes
  if (path.startsWith("/_") || path.includes(".")) {
    return next();
  }

  // Fetch from the active redirects using anon client
  const { data: redirects } = await serverClient()
    .from("redirects" as never)
    .select("from_path, to_path, status_code");

  if (redirects && Array.isArray(redirects)) {
    const match = (redirects as Array<{ from_path: string, to_path: string, status_code: number }>).find((r) => r.from_path === path);
    if (match) {
      // Build the destination URL preserving query string
      const toUrl = new URL(match.to_path, url.origin);
      toUrl.search = url.search;
      
      return new Response(null, {
        status: match.status_code || 301,
        headers: { Location: toUrl.toString() },
      });
    }
  }

  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [redirectsMiddleware, csrfMiddleware],
  // Runs on the CLIENT before every server function call, attaching the caller's JWT.
  // Removing this breaks every admin RPC — see auth-attacher.ts.
  functionMiddleware: [attachSupabaseAuth],
}));

