import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  sub: string;
  email: string;
  role: "admin";
  exp: number;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 random characters");
  return value;
}

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function signature(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSession(payload: Omit<SessionPayload, "exp">): string {
  const body = encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 }));
  return `${body}.${signature(body)}`;
}

export function verifySession(token: string): SessionPayload | null {
  const [body, supplied] = token.split(".");
  if (!body || !supplied) return null;
  const expected = signature(body);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.role !== "admin" || !payload.sub || !payload.email || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
