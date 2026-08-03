import { createStart, createCsrfMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

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

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
  // Runs on the CLIENT before every server function call, attaching the caller's JWT.
  // Removing this breaks every admin RPC — see auth-attacher.ts.
  functionMiddleware: [attachSupabaseAuth],
}));
