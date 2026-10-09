import { createMiddleware } from "@tanstack/react-start";
import { auth } from "./auth-client";

/** Adds the locally held, short-lived admin session to protected server-function calls. */
export const attachMySqlAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = auth.getAccessToken();
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : undefined });
});
