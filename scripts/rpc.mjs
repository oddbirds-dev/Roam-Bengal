/**
 * Shared helpers for the smoke tests: signing in, resolving server function IDs, and
 * calling them the way the browser client does.
 */
import { createClient } from "@supabase/supabase-js";
import { toJSONAsync } from "seroval";

export const SUPABASE_URL = "https://ctrqaotwumvsetnpflvd.supabase.co";
export const KEY = "sb_publishable_FCCiLR0kjaLdC9_Pg-MrNA_Zdb7rvR-";
export const APP = "http://localhost:3000";
export const PASSWORD = "TestPass!2026";

const patchedFetch = (input, init) => {
  const h = new Headers(init?.headers);
  // `sb_publishable_` keys are opaque, not JWTs — GoTrue rejects them in Authorization.
  if (h.get("Authorization") === `Bearer ${KEY}`) h.delete("Authorization");
  h.set("apikey", KEY);
  return fetch(input, { ...init, headers: h });
};

export const anonClient = () =>
  createClient(SUPABASE_URL, KEY, {
    auth: { persistSession: false },
    global: { fetch: patchedFetch },
  });

export const userClient = (token) =>
  createClient(SUPABASE_URL, KEY, {
    auth: { persistSession: false },
    global: { fetch: patchedFetch, headers: { Authorization: `Bearer ${token}` } },
  });

export async function tokenFor(email) {
  const { data, error } = await anonClient().auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return data.session.access_token;
}

/**
 * Server function IDs are base64url {file, export} pairs where `file` carries a
 * `?tss-serverfn-split` suffix. Read them out of the dev server's compiled module rather
 * than hardcoding — the format is easy to get subtly wrong.
 */
export async function serverFnIds(modulePath) {
  const src = await (await fetch(`${APP}${modulePath}`)).text();
  const ids = {};
  for (const m of src.matchAll(/"([A-Za-z0-9_-]{40,})"/g)) {
    try {
      const decoded = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
      if (decoded.export) ids[decoded.export.replace("_createServerFn_handler", "")] = m[1];
    } catch {}
  }
  return ids;
}

/**
 * Replies use the same seroval encoding; decode with the real library.
 *
 * Note the two different failure shapes:
 *   - a thrown Response (our httpError) => real HTTP status, 401/403/404
 *   - an error thrown inside the handler, e.g. a Zod failure => HTTP 200 with the error
 *     carried in the envelope's `error` field
 * So a test must check `error`, not just the status.
 */
export function decodeFramed(text) {
  let root;
  try { root = JSON.parse(text); } catch { return { result: undefined, error: undefined }; }

  // seroval's plain-JSON form. `fromJSON` cannot be used directly here: TanStack encodes
  // thrown errors with a custom "$TSR/Error" plugin node, and without that plugin
  // registered fromJSON throws — blanking the result too.
  const SCALARS = { 0: null, 1: undefined, 2: true, 3: false };
  const refs = new Map();
  const walk = (n) => {
    if (n === null || typeof n !== "object") return n;
    if (n.t === 2) return SCALARS[n.s];
    if (Array.isArray(n.a)) {
      const out = [];
      if (n.i !== undefined) refs.set(n.i, out);
      for (const item of n.a) out.push(walk(item));
      return out;
    }
    if (n.p?.k) {
      const out = {};
      if (n.i !== undefined) refs.set(n.i, out);
      n.p.k.forEach((key, idx) => { out[key] = walk(n.p.v[idx]); });
      return out;
    }
    if (n.s !== undefined) return typeof n.s === "object" ? walk(n.s) : n.s;
    if (n.i !== undefined && refs.has(n.i)) return refs.get(n.i);
    // A plain record with no seroval markers — this is how the payload of a custom
    // plugin node (e.g. "$TSR/Error" -> { message }) is carried.
    if (!("t" in n) && !("i" in n)) {
      const out = {};
      for (const [key, value] of Object.entries(n)) out[key] = walk(value);
      return out;
    }
    return undefined;
  };

  const envelope = walk(root) ?? {};
  return { result: envelope.result, error: envelope.error };
}

export async function callServerFn(id, { token, method = "GET", data } = {}) {
  const url = new URL(`${APP}/_serverFn/${id}`);
  const headers = {
    Origin: APP,
    "Sec-Fetch-Site": "same-origin",
    // Without this the request is not treated as an RPC and falls through to the router.
    "x-tsr-serverFn": "true",
    accept: "application/x-tss-framed, application/x-ndjson, application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Payloads are seroval-encoded, not plain JSON — the server runs fromJSON() on them.
  let body;
  if (method === "POST") {
    headers["content-type"] = "application/json";
    body = JSON.stringify(await toJSONAsync({ data }));
  } else if (data !== undefined) {
    url.searchParams.set("payload", JSON.stringify(await toJSONAsync({ data })));
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  const { result, error } = decodeFramed(text);
  return {
    status: res.status,
    text,
    result,
    error,
    /** True for either failure shape — HTTP status or in-envelope error. */
    failed: res.status >= 400 || error !== undefined,
  };
}

export function reporter() {
  const state = { failures: 0 };
  return {
    state,
    r(label, pass, note = "") {
      if (!pass) state.failures++;
      console.log(`${pass ? "PASS" : "FAIL"}  ${label}${note ? "  — " + note : ""}`);
    },
    done() {
      console.log(state.failures === 0 ? "\nAll checks passed." : `\n${state.failures} check(s) FAILED.`);
      process.exit(state.failures === 0 ? 0 : 1);
    },
  };
}
