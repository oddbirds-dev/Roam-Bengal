import bcrypt from "bcryptjs";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { queryOne } from "./client.server";
import { createSession } from "./session.server";
import { assertAdmin, requireMySqlAuth } from "./auth-middleware";

const credentials = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(500) });

export const signIn = createServerFn({ method: "POST" })
  .validator(credentials)
  .handler(async ({ data }) => {
    const user = await queryOne<{ id: string; email: string; password_hash: string; role: "admin" }>(
      "SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [data.email.toLowerCase()],
    );
    if (!user || user.role !== "admin" || !(await bcrypt.compare(data.password, user.password_hash))) {
      throw new Error("Invalid email or password");
    }
    return { token: createSession({ sub: user.id, email: user.email, role: user.role }), user: { id: user.id, email: user.email } };
  });

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([requireMySqlAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return { id: context.userId, email: context.email };
  });
