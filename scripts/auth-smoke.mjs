/**
 * End-to-end auth checks against a running dev server (npm run dev, port 3000).
 *
 *   npm run test:auth
 *
 * Requires the two throwaway users from PRD §13 to exist. Server function IDs are read
 * out of the dev server's compiled module rather than hardcoded — they are a base64url
 * {file, export} pair and the `?tss-serverfn-split` suffix is easy to get wrong.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ctrqaotwumvsetnpflvd.supabase.co";
const KEY = "sb_publishable_FCCiLR0kjaLdC9_Pg-MrNA_Zdb7rvR-";
const APP = "http://localhost:3000";
const PASSWORD = "TestPass!2026";

let failures = 0;
const r = (label, pass, note = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${note ? "  — " + note : ""}`);
};

const f = (input, init) => {
  const h = new Headers(init?.headers);
  if (h.get("Authorization") === `Bearer ${KEY}`) h.delete("Authorization");
  h.set("apikey", KEY);
  return fetch(input, { ...init, headers: h });
};

const anonClient = () =>
  createClient(SUPABASE_URL, KEY, { auth: { persistSession: false }, global: { fetch: f } });

/** Client scoped to a real user session — RLS evaluates as that user. */
const userClient = (token) =>
  createClient(SUPABASE_URL, KEY, {
    auth: { persistSession: false },
    global: { fetch: f, headers: { Authorization: `Bearer ${token}` } },
  });

async function serverFnIds() {
  const src = await (await fetch(`${APP}/src/lib/admin.functions.ts`)).text();
  const ids = {};
  for (const m of src.matchAll(/"([A-Za-z0-9_-]{40,})"/g)) {
    try {
      const decoded = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
      if (decoded.export) ids[decoded.export.replace("_createServerFn_handler", "")] = m[1];
    } catch {}
  }
  return ids;
}

async function callServerFn(id, token) {
  const res = await fetch(`${APP}/_serverFn/${id}`, {
    method: "GET",
    headers: {
      Origin: APP,
      "Sec-Fetch-Site": "same-origin",
      // Without this the request is not recognised as an RPC and falls through to the
      // page router, which 500s with "forgot to return a response".
      "x-tsr-serverFn": "true",
      accept: "application/x-tss-framed, application/x-ndjson, application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  return { status: res.status, text, result: decodeFramed(text) };
}

/**
 * Server functions reply in TanStack's framed (seroval) encoding, not plain JSON —
 * `accept: application/json` does not change that. This walks enough of the format to
 * read a flat result object: nodes are {t,s} scalars or {t,p:{k,v}} objects, and
 * booleans/undefined/null are encoded as t:2 with s in {2:true,3:false,1:undefined,0:null}.
 */
function decodeFramed(text) {
  let root;
  try { root = JSON.parse(text); } catch { return undefined; }
  const SCALARS = { 0: null, 1: undefined, 2: true, 3: false };
  const node = (n) => {
    if (!n || typeof n !== "object") return n;
    if (n.t === 2) return SCALARS[n.s];
    if (n.t === 1 || typeof n.s === "string" || typeof n.s === "number") return n.s;
    if (n.p?.k) {
      const out = {};
      n.p.k.forEach((key, i) => { out[key] = node(n.p.v[i]); });
      return out;
    }
    return undefined;
  };
  return node(root)?.result;
}

async function tokenFor(email) {
  const { data, error } = await anonClient().auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return data.session.access_token;
}

const ids = await serverFnIds();
r("server function IDs resolved", Boolean(ids.whoAmI && ids.adminStats), Object.keys(ids).join(", "));

// ---- sign-in ---------------------------------------------------------------
const bad = await anonClient().auth.signInWithPassword({
  email: "authtest-admin@example.com",
  password: "wrong-password",
});
r("wrong password rejected", Boolean(bad.error) && !bad.data?.session, bad.error?.message);

const adminToken = await tokenFor("authtest-admin@example.com");
const plainToken = await tokenFor("authtest-plain@example.com");
r("correct password issues a session", Boolean(adminToken && plainToken));

// ---- the RPC gate ----------------------------------------------------------
const noToken = await callServerFn(ids.whoAmI, null);
r("whoAmI without a token -> 401", noToken.status === 401, `status=${noToken.status}`);

const forged = await callServerFn(ids.whoAmI, "not.a.jwt");
r("malformed token -> 401", forged.status === 401, `status=${forged.status}`);

const keyAsToken = await callServerFn(ids.whoAmI, KEY);
r("publishable key not accepted as a session -> 401", keyAsToken.status === 401, `status=${keyAsToken.status}`);

const tampered = await callServerFn(ids.whoAmI, `${adminToken.slice(0, -4)}AAAA`);
r("tampered signature -> 401", tampered.status === 401, `status=${tampered.status}`);

const admin = await callServerFn(ids.whoAmI, adminToken);
r("admin whoAmI -> isAdmin true", admin.status === 200 && admin.result?.isAdmin === true, `status=${admin.status} isAdmin=${admin.result?.isAdmin}`);

const plain = await callServerFn(ids.whoAmI, plainToken);
r("non-admin whoAmI -> isAdmin false", plain.status === 200 && plain.result?.isAdmin === false, `status=${plain.status} isAdmin=${plain.result?.isAdmin}`);

// The one that matters: a valid session is NOT enough to reach an admin function.
const plainStats = await callServerFn(ids.adminStats, plainToken);
r("non-admin blocked from adminStats -> 403", plainStats.status === 403, `status=${plainStats.status}`);

const adminStatsRes = await callServerFn(ids.adminStats, adminToken);
r("admin reaches adminStats", adminStatsRes.status === 200 && adminStatsRes.result?.tours === 9, `status=${adminStatsRes.status} tours=${adminStatsRes.result?.tours}`);

// ---- the authoritative layer: RLS, evaluated as each real user --------------
const asPlain = userClient(plainToken);
const asAdmin = userClient(adminToken);

const before = (await asAdmin.from("tours").select("title").eq("slug", "sundarbans-wildlife-tour").single()).data.title;
await asPlain.from("tours").update({ title: "hacked-by-plain-user" }).eq("slug", "sundarbans-wildlife-tour");
const after = (await asAdmin.from("tours").select("title").eq("slug", "sundarbans-wildlife-tour").single()).data.title;
r("signed-in non-admin cannot edit a tour (RLS)", before === after, `title still "${after}"`);

const plainInquiries = await asPlain.from("inquiries").select("id");
r("non-admin cannot read inquiries (RLS)", (plainInquiries.data?.length ?? 0) === 0);

const plainRoles = await asPlain.from("user_roles").select("*");
r("non-admin sees no role rows (RLS)", (plainRoles.data?.length ?? 0) === 0);

const plainUserId = (await asPlain.auth.getUser()).data.user.id;
const escalate = await asPlain.from("user_roles").insert({ user_id: plainUserId, role: "admin" });
const stillPlain = (await asPlain.from("user_roles").select("*")).data?.length ?? 0;
r("non-admin cannot grant themselves admin (RLS)", Boolean(escalate.error) && stillPlain === 0, escalate.error?.code ?? "no error");

const adminRoles = await asAdmin.from("user_roles").select("role");
r("admin can read their own role (RLS)", (adminRoles.data?.length ?? 0) === 1);

console.log(failures === 0 ? "\nAll auth checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
