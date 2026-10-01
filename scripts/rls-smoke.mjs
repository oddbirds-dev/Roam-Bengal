import { createClient } from "@supabase/supabase-js";
const url = "https://ackvhrnlmlyzqycsjjht.supabase.co";
const key = "sb_publishable_FCCiLR0kjaLdC9_Pg-MrNA_Zdb7rvR-";
const f = (input, init) => {
  const h = new Headers(init?.headers);
  if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
  h.set("apikey", key);
  return fetch(input, { ...init, headers: h });
};
const sb = createClient(url, key, { auth: { persistSession: false }, global: { fetch: f } });
const r = (label, pass, note = "") =>
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${note ? "  — " + note : ""}`);

// Pick a real published tour rather than naming one. Hardcoding a seed slug made this
// suite fail with a null-deref the moment the seed data changed, which reads like an RLS
// regression when it is only a stale fixture.
const probe = (await sb.from("tours").select("slug, title").eq("is_published", true).order("slug").limit(1)).data?.[0];

const ok = await sb.from("inquiries").insert({
  name: "RLS Smoke Test", email: "smoke@example.com", country: "UK",
  tour_slug: probe?.slug ?? null, message: "Testing the anon insert path.",
});
r("anon can submit an inquiry", !ok.error, ok.error?.message);

const read = await sb.from("inquiries").select("id").limit(1);
r("anon cannot read inquiries back", (read.data?.length ?? 0) === 0);

const bad = await sb.from("inquiries").insert({ name: "x", email: "not-an-email", message: "hi" });
r("malformed email rejected", Boolean(bad.error), bad.error?.code);

const esc = await sb.from("inquiries").insert({ name: "x", email: "a@b.co", message: "hi", status: "handled" });
r("cannot pre-set status", Boolean(esc.error), esc.error?.code);

const blank = await sb.from("inquiries").insert({ name: "x", email: "a@b.co", message: "   " });
r("blank message rejected", Boolean(blank.error), blank.error?.code);

// An UPDATE filtered to zero rows by RLS returns success, so assert on the DATA.
if (!probe) {
  r("anon cannot modify a tour", false, "no published tour to probe — seed at least one");
} else {
  const title = async () =>
    (await sb.from("tours").select("title").eq("slug", probe.slug).maybeSingle()).data?.title;
  const before = await title();
  await sb.from("tours").update({ title: "hacked" }).eq("slug", probe.slug);
  const after = await title();
  r("anon cannot modify a tour", before === after && after !== "hacked", `title still "${after}"`);
}

// Compare against the live count rather than a seed snapshot: the point is that the
// DELETE removed nothing, not that the table happens to hold nine rows.
const testimonialsBefore = (await sb.from("testimonials").select("id")).data?.length ?? 0;
await sb.from("testimonials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
const left = (await sb.from("testimonials").select("id")).data?.length ?? 0;
r(
  "anon cannot delete testimonials",
  testimonialsBefore > 0 && left === testimonialsBefore,
  `${left}/${testimonialsBefore} rows remain`,
);

const roles = await sb.from("user_roles").select("*");
r("anon cannot read user_roles", (roles.data?.length ?? 0) === 0);

const drafts = await sb.from("tours").select("id").eq("is_published", false);
r("anon sees no unpublished tours", (drafts.data?.length ?? 0) === 0);
