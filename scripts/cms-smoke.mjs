/**
 * CMS checks against a running dev server (npm run dev, port 3000).
 *
 *   npm run test:cms
 *
 * The admin API test proves the endpoints work. This one proves the *screens* work, by
 * submitting exactly the payload shapes the forms produce — notably empty strings for
 * untouched optional fields, which is what a React controlled input yields.
 */
import { callServerFn, reporter, serverFnIds, tokenFor, userClient } from "./rpc.mjs";

const { r, done } = reporter();
const ids = await serverFnIds("/src/lib/admin-content.functions.ts");
const admin = await tokenFor("authtest-admin@example.com");
const sb = userClient(admin);

const stamp = Date.now();
const created = { tours: [], posts: [], testimonials: [], faqs: [], activities: [] };

async function cleanup() {
  for (const id of created.tours) await callServerFn(ids.adminDeleteTour, { token: admin, method: "POST", data: { id } });
  for (const id of created.posts) await callServerFn(ids.adminDeletePost, { token: admin, method: "POST", data: { id } });
  for (const id of created.testimonials) await callServerFn(ids.adminDeleteTestimonial, { token: admin, method: "POST", data: { id } });
  for (const id of created.faqs) await callServerFn(ids.adminDeleteFaq, { token: admin, method: "POST", data: { id } });
  for (const id of created.activities) await callServerFn(ids.adminDeleteActivity, { token: admin, method: "POST", data: { id } });
}

// --- Tour editor: a brand-new tour with every optional field left untouched ---
// This is the highest-risk payload in the product: the form emits "" for ~15 optional
// text fields and [] for ~14 array fields.
const tourForm = {
  slug: `cms-tour-${stamp}`, title: "CMS Tour", category: "multi-day",
  summary: "", hero_image: "", images: [], duration_label: "", duration_days: 1,
  price_usd: null, discount_price_usd: null, price_note: "", rating: null,
  reviews_count: 0, destination_label: "", activity_label: "",
  primary_destination_slug: "", is_featured: false, activities_count: null,
  group_size_max: null, stops_count: null, facts: {}, overview: [], overview_tip: "",
  highlights: [], glance: [], addons: [], itinerary: [], offers: [], inclusions: [],
  exclusions: [], accessibility: [], advice: [], pledge: [], why_items: [], faqs: [],
  map_embed: "", video_url: "", related_slugs: [], is_published: false, sort_order: 0,
};
const tourRes = await callServerFn(ids.adminUpsertTour, { token: admin, method: "POST", data: { tour: tourForm } });
if (tourRes.result?.id) created.tours.push(tourRes.result.id);
r("tour form with all optionals blank saves", !tourRes.failed && Boolean(tourRes.result?.id),
  String(tourRes.error?.message ?? "").slice(0, 120));

// A fully populated tour — every structured field exercised at once.
const fullForm = {
  ...tourForm, slug: `cms-tour-full-${stamp}`, title: "CMS Tour Full",
  duration_days: 4, price_usd: 199, is_published: true,
  facts: { tour_type: "Wildlife", best_season: "Nov – Feb" },
  overview: ["Para one.", "Para two."], overview_tip: "Bring binoculars.",
  highlights: ["Highlight A", "Highlight B"],
  glance: [{ when: "Day 1", detail: "Arrive" }],
  addons: [{ icon: "🎣", title: "Fishing", detail: "An hour at golden hour." }],
  itinerary: [{ day: 1, title: "Arrive", detail: "Travel in." }, { day: 2, title: "Explore", detail: "Full day." }],
  offers: [{ title: "🎉 Offers", items: ["Early bird 10%"] }],
  inclusions: ["Guide"], exclusions: ["Flights"],
  accessibility: [{ label: "Pacing", detail: "Flexible stops." }],
  advice: [{ title: "📌 Essentials", items: ["Runs year-round"] }],
  pledge: ["🤝 Fair pay"], why_items: ["🌿 Local guides"],
  faqs: [{ question: "Is it safe?", answer: "Yes." }],
};
const fullRes = await callServerFn(ids.adminUpsertTour, { token: admin, method: "POST", data: { tour: fullForm } });
if (fullRes.result?.id) created.tours.push(fullRes.result.id);
r("fully populated tour saves", !fullRes.failed, String(fullRes.error?.message ?? "").slice(0, 120));

// Structured fields must survive the round trip, not arrive as strings or nulls.
if (fullRes.result?.id) {
  const row = (await sb.from("tours").select("*").eq("id", fullRes.result.id).single()).data;
  r("itinerary round-trips as objects", Array.isArray(row.itinerary) && row.itinerary[1]?.title === "Explore");
  r("facts round-trip as a map", row.facts?.best_season === "Nov – Feb");
  r("offers round-trip nested items", row.offers?.[0]?.items?.[0] === "Early bird 10%");
  r("advice round-trips", row.advice?.[0]?.items?.[0] === "Runs year-round");
  r("empty arrays stay arrays", Array.isArray(row.related_slugs) && row.related_slugs.length === 0);

  const html = await (await fetch(`http://localhost:3000/tours/cms-tour-full-${stamp}`)).text();
  r("published tour renders its itinerary publicly", html.includes("Explore") && html.includes("Bring binoculars"));
}

// --- Blog screen ------------------------------------------------------------
const postForm = {
  slug: `cms-post-${stamp}`, title: "CMS Post", excerpt: "", body: [], category: "",
  date_label: "", read_time: "", cover_image: "", author_name: "", author_role: "",
  author_avatar: "", is_featured: false, is_published: true, sort_order: 0,
};
const postRes = await callServerFn(ids.adminUpsertPost, { token: admin, method: "POST", data: { post: postForm } });
if (postRes.result?.id) created.posts.push(postRes.result.id);
r("blog form saves with blanks", !postRes.failed, String(postRes.error?.message ?? "").slice(0, 100));

const postUpdate = await callServerFn(ids.adminUpsertPost, {
  token: admin, method: "POST",
  data: { id: postRes.result?.id, post: { ...postForm, title: "CMS Post v2", body: ["One.", "Two."] } },
});
r("blog update saves body paragraphs", !postUpdate.failed);

// --- Reviews screen ---------------------------------------------------------
const testimonialForm = {
  author: "CMS Reviewer", location: "", headline: "", quote: "A quote.", tour_label: "",
  platform: "direct", avatar_url: "", images: [], rating: 5,
  is_featured: false, is_published: true, sort_order: 0,
};
const tRes = await callServerFn(ids.adminUpsertTestimonial, { token: admin, method: "POST", data: { testimonial: testimonialForm } });
if (tRes.result?.id) created.testimonials.push(tRes.result.id);
r("review form saves", !tRes.failed, String(tRes.error?.message ?? "").slice(0, 100));

// --- FAQ screen -------------------------------------------------------------
const faqForm = { question: "CMS question?", answer: "CMS answer.", category: "", is_published: true, sort_order: 0 };
const fRes = await callServerFn(ids.adminUpsertFaq, { token: admin, method: "POST", data: { faq: faqForm } });
if (fRes.result?.id) created.faqs.push(fRes.result.id);
r("FAQ form saves", !fRes.failed, String(fRes.error?.message ?? "").slice(0, 100));

// --- Themes screen ----------------------------------------------------------
const themeForm = { slug: `cms-theme-${stamp}`, name: "🧪 CMS Theme", description: "", sort_order: 99 };
const thRes = await callServerFn(ids.adminUpsertActivity, { token: admin, method: "POST", data: { activity: themeForm } });
if (thRes.result?.id) created.activities.push(thRes.result.id);
r("theme form saves", !thRes.failed, String(thRes.error?.message ?? "").slice(0, 100));

// --- Settings screen: the JSON editor round trip ----------------------------
const listSettings = await callServerFn(ids.adminListSettings, { token: admin });
r("settings list loads", Array.isArray(listSettings.result) && listSettings.result.length === 12,
  `${listSettings.result?.length} keys`);

const header = (listSettings.result ?? []).find((s) => s.key === "header");
r("settings values decode as objects", typeof header?.value === "object" && Array.isArray(header.value.nav));

// Editing one key must not disturb the others.
const before = (await sb.from("site_settings").select("value").eq("key", "footer").single()).data.value;
await callServerFn(ids.adminSaveSetting, {
  token: admin, method: "POST",
  data: { key: "header", value: { ...header.value, cta_label: "Book A Trip" } },
});
const after = (await sb.from("site_settings").select("value").eq("key", "header").single()).data.value;
const footerAfter = (await sb.from("site_settings").select("value").eq("key", "footer").single()).data.value;
r("settings save persists the edit", after.cta_label === "Book A Trip");
r("settings save preserves sibling keys", JSON.stringify(before) === JSON.stringify(footerAfter));

const homeHtml = await (await fetch("http://localhost:3000/")).text();
r("edited setting reaches the public page", homeHtml.includes("Book A Trip"));

// restore
await callServerFn(ids.adminSaveSetting, {
  token: admin, method: "POST", data: { key: "header", value: { ...header.value, cta_label: "Plan Your Trip" } },
});
const restored = (await sb.from("site_settings").select("value").eq("key", "header").single()).data.value;
r("settings restored", restored.cta_label === "Plan Your Trip");

// --- Cleanup ----------------------------------------------------------------
await cleanup();
const counts = {
  tours: (await sb.from("tours").select("id")).data?.length ?? 0,
  posts: (await sb.from("blog_posts").select("id")).data?.length ?? 0,
  testimonials: (await sb.from("testimonials").select("id")).data?.length ?? 0,
  faqs: (await sb.from("faqs").select("id")).data?.length ?? 0,
  activities: (await sb.from("activities").select("id")).data?.length ?? 0,
};
r("all scratch rows cleaned up",
  counts.tours === 9 && counts.posts === 9 && counts.testimonials === 9 && counts.faqs === 6 && counts.activities === 5,
  JSON.stringify(counts));

done();
