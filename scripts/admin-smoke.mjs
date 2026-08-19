/**
 * Admin API checks against a running dev server (npm run dev, port 3000).
 *
 *   npm run test:admin
 *
 * Creates a scratch tour, exercises the full lifecycle, and deletes it. Also verifies a
 * signed-in NON-admin is refused by every mutation.
 */
import { callServerFn, reporter, serverFnIds, tokenFor, userClient } from "./rpc.mjs";

const { r, done } = reporter();

const ids = await serverFnIds("/src/lib/admin-content.functions.ts");
r("admin function IDs resolved", Object.keys(ids).length >= 20, `${Object.keys(ids).length} functions`);

const admin = await tokenFor("authtest-admin@example.com");
const plain = await tokenFor("authtest-plain@example.com");

// Sweep up scratch rows left behind by an aborted earlier run, so the final
// "seed tours untouched" assertion means something.
{
  const sb = userClient(admin);
  const { data: stale } = await sb.from("tours").select("id").like("slug", "scratch-tour-%");
  for (const row of stale ?? []) await sb.from("tours").delete().eq("id", row.id);
  if (stale?.length) console.log(`(swept ${stale.length} stale scratch tour(s))`);
}

const SLUG = `scratch-tour-${Date.now()}`;
const tourPayload = {
  slug: SLUG,
  title: "Scratch Tour",
  category: "multi-day",
  duration_days: 3,
  price_usd: 123,
  destination_label: "Nowhere",
  is_published: false,
  highlights: ["First highlight"],
  itinerary: [{ day: 1, title: "Arrive", detail: "Get there." }],
  facts: { tour_type: "Test" },
};

// ---- validation ------------------------------------------------------------
const badSlug = await callServerFn(ids.adminUpsertTour, {
  token: admin, method: "POST", data: { tour: { ...tourPayload, slug: "Not A Slug!" } },
});
r("invalid slug rejected", badSlug.failed, `status=${badSlug.status} err=${String(badSlug.error?.message).slice(0,40)}`);

const badCategory = await callServerFn(ids.adminUpsertTour, {
  token: admin, method: "POST", data: { tour: { ...tourPayload, category: "cruise" } },
});
r("invalid category rejected", badCategory.failed, `status=${badCategory.status}`);

// ---- authorisation ---------------------------------------------------------
const plainCreate = await callServerFn(ids.adminUpsertTour, {
  token: plain, method: "POST", data: { tour: tourPayload },
});
r("non-admin cannot create a tour -> 403", plainCreate.status === 403, `status=${plainCreate.status}`);

const plainList = await callServerFn(ids.adminListInquiries, { token: plain });
r("non-admin cannot list inquiries -> 403", plainList.status === 403, `status=${plainList.status}`);

const noTokenCreate = await callServerFn(ids.adminUpsertTour, {
  method: "POST", data: { tour: tourPayload },
});
r("anonymous cannot create a tour -> 401", noTokenCreate.status === 401, `status=${noTokenCreate.status}`);

// ---- create ----------------------------------------------------------------
const created = await callServerFn(ids.adminUpsertTour, {
  token: admin, method: "POST", data: { tour: tourPayload },
});
const tourId = created.result?.id;
r("admin creates a tour", !created.failed && Boolean(tourId), `status=${created.status} id=${tourId} err=${String(created.error?.message ?? "").slice(0,80)}`);

if (!tourId) done();

// unpublished must not leak to the public site
const publicHtml = await (await fetch("http://localhost:3000/tours")).text();
r("unpublished tour hidden from public /tours", !publicHtml.includes("Scratch Tour"));

const detail404 = await fetch(`http://localhost:3000/tours/${SLUG}`);
r("unpublished tour detail 404s publicly", detail404.status === 404, `status=${detail404.status}`);

// but the admin list sees it
const list = await callServerFn(ids.adminListTours, { token: admin });
r("admin list includes the draft", JSON.stringify(list.result ?? "").includes(SLUG));

// ---- update ----------------------------------------------------------------
const updated = await callServerFn(ids.adminUpsertTour, {
  token: admin, method: "POST",
  data: { id: tourId, tour: { ...tourPayload, title: "Scratch Tour v2", is_published: true } },
});
r("admin updates and publishes", !updated.failed, `status=${updated.status} err=${String(updated.error?.message ?? "").slice(0,60)}`);

const publicHtml2 = await (await fetch("http://localhost:3000/tours")).text();
r("published tour now visible publicly", publicHtml2.includes("Scratch Tour v2"));

// ---- themes ----------------------------------------------------------------
const activities = await callServerFn(ids.adminListActivities, { token: admin });
const hillsId = (activities.result ?? []).find((a) => a.slug === "hills")?.id;
const themed = await callServerFn(ids.adminSetTourThemes, {
  token: admin, method: "POST", data: { tourId, activityIds: hillsId ? [hillsId] : [] },
});
r("admin sets tour themes", !themed.failed, `status=${themed.status}`);

const filtered = await (await fetch("http://localhost:3000/tours?theme=hills")).text();
r("themed tour appears under its filter", filtered.includes("Scratch Tour v2"));

// ---- non-admin still cannot touch it ---------------------------------------
const plainUpdate = await callServerFn(ids.adminUpsertTour, {
  token: plain, method: "POST", data: { id: tourId, tour: { ...tourPayload, title: "hijacked" } },
});
r("non-admin cannot update an existing tour -> 403", plainUpdate.status === 403, `status=${plainUpdate.status}`);

const stillNamed = (await userClient(admin).from("tours").select("title").eq("id", tourId).single()).data.title;
r("tour title unchanged by non-admin", stillNamed === "Scratch Tour v2", `title="${stillNamed}"`);

// ---- inquiry status flow ---------------------------------------------------
const sb = userClient(admin);
const { data: inq } = await sb
  .from("inquiries")
  .insert({ name: "Smoke", email: "smoke-admin@example.com", message: "hello" })
  .select("id")
  .single();

await callServerFn(ids.adminUpdateInquiry, {
  token: admin, method: "POST", data: { id: inq.id, status: "handled", admin_note: "done" },
});
const handled = (await sb.from("inquiries").select("status, handled_at, admin_note").eq("id", inq.id).single()).data;
r("handled stamps handled_at", handled.status === "handled" && Boolean(handled.handled_at));
r("admin_note saved", handled.admin_note === "done");

await callServerFn(ids.adminUpdateInquiry, {
  token: admin, method: "POST", data: { id: inq.id, status: "read" },
});
const reopened = (await sb.from("inquiries").select("status, handled_at").eq("id", inq.id).single()).data;
r("reopening clears the stale handled_at", reopened.status === "read" && reopened.handled_at === null);

await callServerFn(ids.adminDeleteInquiry, { token: admin, method: "POST", data: { id: inq.id } });
const goneInq = (await sb.from("inquiries").select("id").eq("id", inq.id)).data ?? [];
r("admin deletes an inquiry", goneInq.length === 0);

// ---- settings --------------------------------------------------------------
await callServerFn(ids.adminSaveSetting, {
  token: admin, method: "POST",
  data: { key: "smoke_test_key", value: { hello: "world", nested: { n: 1 } } },
});
const setting = (await sb.from("site_settings").select("value").eq("key", "smoke_test_key").maybeSingle()).data;
r("admin saves a setting", setting?.value?.hello === "world");

await callServerFn(ids.adminDeleteSetting, {
  token: admin, method: "POST", data: { key: "smoke_test_key" },
});
const goneSetting = (await sb.from("site_settings").select("key").eq("key", "smoke_test_key")).data ?? [];
r("admin deletes a setting", goneSetting.length === 0);

// ---- delete ----------------------------------------------------------------
const plainDelete = await callServerFn(ids.adminDeleteTour, {
  token: plain, method: "POST", data: { id: tourId },
});
r("non-admin cannot delete a tour -> 403", plainDelete.status === 403, `status=${plainDelete.status}`);

const deleted = await callServerFn(ids.adminDeleteTour, {
  token: admin, method: "POST", data: { id: tourId },
});
r("admin deletes the tour", !deleted.failed, `status=${deleted.status}`);

const gone = (await sb.from("tours").select("id").eq("id", tourId)).data ?? [];
r("tour is gone", gone.length === 0);

const themeRows = (await sb.from("tour_activities").select("tour_id").eq("tour_id", tourId)).data ?? [];
r("theme links cascaded away", themeRows.length === 0);

const finalCount = (await sb.from("tours").select("id")).data?.length ?? 0;
r("seed tours untouched", finalCount === 9, `${finalCount} tours`);

done();
