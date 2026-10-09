import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { queryOne, serverClient, type DbClient } from "./client.server";
import { verifySession } from "./session.server";

export interface MySqlAuthContext {
  db: DbClient;
  /** Compatibility name while existing server functions are migrated to `context.db`. */
  supabase: DbClient;
  userId: string;
  email: string;
  role: "admin";
}

export function httpError(status: number, message: string): never {
  throw new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const requireMySqlAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const header = getRequestHeader("authorization") ?? getRequestHeader("Authorization");
  if (!header?.startsWith("Bearer ")) httpError(401, "Unauthorized: No authorization header provided");
  const payload = verifySession(header.slice("Bearer ".length).trim());
  if (!payload) httpError(401, "Unauthorized: Invalid or expired session");

  // A token is only a temporary credential. Re-read the local account so a deleted account
  // or role change takes effect on the very next protected request.
  const user = await queryOne<{ id: string; email: string; role: "admin" }>(
    "SELECT id, email, role FROM users WHERE id = ? LIMIT 1",
    [payload.sub],
  );
  if (!user || user.email !== payload.email || user.role !== "admin") {
    httpError(401, "Unauthorized: Session no longer belongs to an active administrator");
  }
  const db = serverClient();
  return next({ context: { db, supabase: db, userId: user.id, email: user.email, role: user.role } satisfies MySqlAuthContext });
});

export async function assertAdmin(context: MySqlAuthContext): Promise<void> {
  if (context.role !== "admin") httpError(403, "Forbidden: Admin role required");
}

export async function isAdmin(context: MySqlAuthContext): Promise<boolean> {
  return context.role === "admin";
}
