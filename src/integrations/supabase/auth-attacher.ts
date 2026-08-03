import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/**
 * Client-side half of the auth handshake: reads the current session and attaches it as
 * `Authorization: Bearer <access_token>` on every server function call.
 *
 * This MUST stay registered as a global `functionMiddleware` in src/start.ts. If it is
 * dropped, the browser silently stops sending bearer tokens and every admin RPC fails
 * with "Unauthorized: No authorization header provided" — with no clue as to why.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    // Only meaningful in the browser; during SSR the handler runs in-process and there
    // is no localStorage session to read.
    if (typeof window === "undefined") return next();

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return next({ headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      // A missing or unreadable session is not fatal — public server functions do not
      // need one. The server will reject the call if it did.
      console.warn("[auth] could not read Supabase session:", error);
    }

    return next();
  },
);
