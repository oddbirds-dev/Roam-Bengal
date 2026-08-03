# Roam Bengal — Product Requirements Document

**Version** 1.0 · **Date** 2026-08-03 · **Status** Draft for build

---

## 0. What exists today

| Asset | What it is | How to treat it |
| --- | --- | --- |
| [BACKEND.md](BACKEND.md) | A complete, 850-line server/database architecture spec written against a Supabase project (`ceuwxvcazqxqjgtcmzhy`) and a `src/` tree | **Normative for architecture.** It is a spec, not a description of this repo — none of the files it references exist here yet |
| [reference design/](reference design/) | 12 standalone HTML pages, self-contained CSS, no build step, image paths that 404 by design | **Normative for visual design and copy.** Port them; do not redesign |
| Repo source | Nothing. One commit, no `src/`, no `package.json`, no `supabase/` | Everything below is greenfield |

Two facts that shape the whole plan:

1. **The Supabase project named in BACKEND.md is not reachable from the connected account.** A fresh one — `Roam Bengal` / `ctrqaotwumvsetnpflvd` — has been provisioned in the `Platiroll` org, fully migrated and seeded; see [§13](#13-provisioning-supabase).
2. **`payment-system.html` is a policy page, not a checkout.** It describes bKash/Nagad/Rocket/card/bank as things you arrange with a human. There is no payment gateway in scope for v1 — see [§2 Non-goals](#2-goals-and-non-goals).

---

## Table of contents

- [1. Product summary](#1-product-summary)
- [2. Goals and non-goals](#2-goals-and-non-goals)
- [3. Users and jobs to be done](#3-users-and-jobs-to-be-done)
- [4. Architecture](#4-architecture)
- [5. Design system](#5-design-system)
- [6. Route map](#6-route-map)
- [7. Page specifications](#7-page-specifications)
- [8. Data model](#8-data-model)
- [9. Server function catalog](#9-server-function-catalog)
- [10. Admin CMS](#10-admin-cms)
- [11. SEO](#11-seo)
- [12. Media and images](#12-media-and-images)
- [13. Provisioning (Supabase)](#13-provisioning-supabase)
- [14. Delivery phases](#14-delivery-phases)
- [15. Acceptance criteria](#15-acceptance-criteria)
- [16. Gaps in the reference designs](#16-gaps-in-the-reference-designs)
- [17. Open questions](#17-open-questions)

---

## 1. Product summary

Roam Bengal is an inbound tour operator selling private, guided, multi-day trips across
Bangladesh to international travellers. The product is a **content-driven marketing site with
a lead-capture funnel and a self-service admin CMS**.

The commercial model is inquiry-to-booking: a visitor reads a tour page, submits an inquiry
(or messages WhatsApp), and a human closes the sale. The site's job is to build enough trust
to earn that message.

The trust argument runs through every page and must survive the port:

- private tours only, never fixed departures
- transparent pricing, no shopping-commission detours
- guides who are local to the specific route
- book direct and skip the 15–30% OTA markup
- honesty about what a trip cannot promise ("This isn't a wildlife guarantee tour")

---

## 2. Goals and non-goals

### Goals

| # | Goal | Measured by |
| --- | --- | --- |
| G1 | Every page in `reference design/` renders as a live, database-backed route | 12/12 pages ported, visually equivalent at 1440px and 375px |
| G2 | Non-technical staff can edit all content without a deploy | Every string, price, image, and list on a public page is reachable from `/admin` |
| G3 | Inquiries are captured reliably and worked to completion | Inquiry submitted → row with `status='new'` → admin flips to `handled` |
| G4 | The site is indexable and ranks for Bangladesh tour queries | `sitemap.xml`, `robots.txt`, per-entity meta actually rendered into `<head>` |
| G5 | The design survives on mobile | No horizontal scroll 320–1920px; working mobile navigation |

### Non-goals for v1

- **Online payment / checkout.** No Stripe, no bKash API, no cart. Money is arranged offline.
- **Live availability or a booking calendar.** "Book Now" opens an inquiry form.
- **User accounts for travellers.** Auth exists only for admins; there is no sign-up route.
- **Multi-currency at runtime.** USD is the display currency; `price_bdt` is stored but not surfaced in v1.
- **Multi-language.** English only.
- **Review collection in-product.** "Leave A Review" links to contact; testimonials are entered by an admin.

---

## 3. Users and jobs to be done

**Traveller (anonymous, international, English-speaking).** Arrives from Google or social.
Wants to know: is this real, what exactly do I get, what does it cost, who is taking me, and
what happens if I cancel. Leaves by submitting an inquiry or opening WhatsApp.

**Admin (Roam Bengal staff, Dhaka).** Provisioned by hand in the Supabase dashboard; there is
no sign-up. Wants to publish and edit tours, blog posts, testimonials and FAQs, edit site
chrome and page copy, and work the inquiry queue. Not a developer — the CMS must never
require touching JSON by hand for routine edits.

---

## 4. Architecture

Adopt BACKEND.md wholesale. Summary of what that means concretely:

- **TanStack Start** — SSR plus RPC via `createServerFn` in one process. No separate API service.
- **Supabase** — Postgres with RLS on every table, GoTrue email/password auth, Storage.
- **Four Supabase clients**, per BACKEND.md §4: browser anon, server anon, server user-scoped
  (anon key + caller JWT), and service-role. Admin writes use the **user-scoped** client so RLS
  stays the last line of defense. Service role is used only by `submitInquiry`.
- **Two enforcement layers for admin.** `assertAdmin()` in app code for a clean `Forbidden`,
  and an RLS policy in Postgres as the authority.
- **Middleware order** per BACKEND.md §2: `errorMiddleware`, `csrfMiddleware` (serverFn only),
  then `inputValidator` (Zod), then `requireSupabaseAuth`.
- **Roles**: single `app_role` enum with one value, `admin`. Privilege oracle is
  `private.has_role(uuid, app_role)` — in the `private` schema, never `public`, so PostgREST
  cannot call it.

### Deliberate deviations from BACKEND.md

BACKEND.md §16 lists known gaps in the system it describes. Since this is a fresh build, fix
them at the start rather than inheriting them:

| BACKEND.md gap | Decision for this build |
| --- | --- |
| `seo_meta` written but never read | **Fix.** Every public route loader fetches `seo_meta` and feeds `buildSeoMeta()` in `head()` |
| `redirects` rows never served | **Fix.** Add a request middleware that looks up `from_path` and returns 301/302 |
| `SITE_URL` hardcoded to a Lovable domain | **Fix.** Read from `VITE_SITE_URL` with a sane fallback |
| `tour_destinations` join table dead; tours link by `primary_destination_slug` text | **Keep the text link for v1** (no destination pages shipping), but do not create the dead join table |
| Storage objects orphaned when an image is removed | **Accept for v1**, log as tech debt |
| 10-year signed URLs stored in content columns | **Fix.** Store public URLs (`getPublicUrl`) — the bucket already allows anonymous reads |
| `category` has no DB constraint | **Fix.** Add a CHECK constraint matching the Zod enum |
| Inquiry Zod schema and RLS `WITH CHECK` disagree on `message` | **Fix.** Make `message` required in both |

---

## 5. Design system

Extracted from the reference CSS. These are the single source of truth; put them in
`src/styles/tokens.css` and map them onto Tailwind theme values.

### Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--green` | `#1E5F3B` | primary brand, headings |
| `--green-dark` | `#123D26` | primary button fill, footer |
| `--orange` | `#F0791E` | accent, ribbons |
| `--gold` | `#F2B705` | script accents, stars |
| `--blue` (misnomer — it is a red) | `#C4390E` | secondary accent |
| `--ink` | `#20291F` | body text |
| `--paper` | `#FFFFFF` | page background |
| `--mint` | `#EAF4EC` | tinted panels |
| `--cream` | `#FBF7F0` | reviews-page background |
| `--muted` | `#6B7770` | secondary text |
| `--rule` | `#E7E1D3` | hairlines |

Gradient pairs used on photo placeholders: `#22B57A→#0B6B47` (green), `#F0791E→#C4390E`
(orange), `#8C6A3D→#5A3E1B` (brown), `#3E7A6E→#123D30` (teal), `#F2B705→#8C6A3D` (gold),
`#1E5F3B→#0B2818` (deep green). Keep these — they are the fallback when an image is missing.

### Type

| Family | Weights | Use |
| --- | --- | --- |
| Playfair Display | 600, 700, 900, 600i | `h1`–`h3`, all display headings |
| Poppins | 400, 500, 600, 700 | body, UI, buttons |
| Caveat | 600, 700 | the `.script` accent above hero headlines |
| Permanent Marker | 400 | occasional hand-lettered accents |
| Kalam | 700 | occasional hand-lettered accents |

Self-host these (`@fontsource`) rather than hitting the Google Fonts CDN — five families over
CDN is the single biggest LCP risk in the design.

### Layout and components

- Container `.wrap`: `max-width: 1240px`, `padding: 0 40px`.
- Buttons: pill, `border-radius: 30px`, `padding: 12px 24px`, `font-weight: 600`,
  `font-size: 0.88rem`, `1.5px` transparent border. Variants: `btn-green`, `btn-green-dark`,
  `btn-outline-light`, `btn-outline-dark`, `btn-blue`, `btn-whatsapp`.
- Single breakpoint in the designs: **980px**, plus 640px on contact. Standardise on
  Tailwind's `md`/`lg` and verify against the reference at 1440 / 980 / 375.
- Emoji are used as section-heading icons throughout (`📜 Trip Overview`, `💵 Tour Price`).
  They are content, stored in the database with the heading — not hardcoded in components.
- Decorative inline SVG (rickshaws, domed buildings, mangrove line art, the logo mark) is
  static. Extract to React components in `src/components/art/`; do not store in the DB.

### Repeated chrome

- **Header** — logo mark SVG + "Roam" / "Bengal" wordmark + tagline "EXPLORE THE HEART OF
  BANGLADESH", nav links (Home, Tours, Blog, Reviews, Contact), right-side CTA "Plan Your Trip".
- **Footer** — 6 columns: brand blurb, Explore, Travel Essential, Guest Support, Company,
  Contact; bottom bar with copyright.
- **WhatsApp float** — fixed bottom-right pill, `.wa-float`, present on every page.

---

## 6. Route map

| Route | Source design | Data | SSR |
| --- | --- | --- | --- |
| `/` | `roam-bengal-v3.html` | tours, testimonials, posts, `site_settings` | yes |
| `/tours` | `tours.html` | tours + activities (filter) | yes |
| `/tours/:slug` | `package-sundarbans (1).html` | one tour + related | yes |
| `/blog` | `blog.html` | posts, categories | yes |
| `/blog/:slug` | **no design** — see §16 | one post | yes |
| `/reviews` | `reviews.html` | testimonials + `site_settings.reviews` | yes |
| `/about` | `about.html` | `site_settings.about`, testimonials | yes |
| `/contact` | `contact.html` | `site_settings.contact`, tours (select) | yes |
| `/policies/refund` | `refund-policy.html` | code default + `site_settings.policy_refund` | yes |
| `/policies/payment` | `payment-system.html` | ↑ | yes |
| `/policies/cancellation` | `cancellation-policy.html` | ↑ | yes |
| `/policies/privacy` | `privacy-policy.html` | ↑ | yes |
| `/policies/terms` | `terms-and-conditions.html` | ↑ | yes |
| `/visa-information`, `/embassy-directory`, `/travel-faqs`, `/responsible-travel`, `/guides`, `/careers` | **no design** — footer links only | `site_settings.info_<slug>` | yes |
| `/gallery` | **no design** — "View Full Gallery" button | `site_settings.gallery` | yes |
| `/auth` | none | — | **no** (`ssr:false`, noindex) |
| `/admin`, `/admin/*` | none | admin fns | **no** |
| `/sitemap.xml` | — | `listSitemapEntries` | server handler |
| `/robots.txt` | — | `site_settings.robots` | server handler |

Reference-design links to fix during the port: `roam-bengal-v3.html` → `/`,
`package-sundarbans.html` → `/tours/:slug`, `index.html` (in policy breadcrumbs) → `/`,
`#reviews` anchor → `/reviews`, `#contact` anchor → `/contact`.

---

## 7. Page specifications

### 7.1 Homepage — `/`

Sections in order, each mapped to its data source:

| # | Section | Content source |
| --- | --- | --- |
| 1 | Hero — full-bleed photo, `.script` "Explore", `h1` "The Soul of Bangladesh", subtext, two CTAs ("Explore Tours", "▷ Watch Video") | `site_settings.hero` |
| 2 | Feature strip — 6 items (Handpicked Tours, Local Experts, Safe & Trusted, Visa Assistance, 24/7 Support, Airport Pickup), each icon + title + line | `site_settings.homepage.features[]` |
| 3 | Popular tours — eyebrow, `h2`, divider, tour card grid | `listPublishedTours()`, `is_featured` first, then `sort_order` |
| 4 | Gallery — heading, blurb, "View Full Gallery", 4 tagged photos | `site_settings.gallery` |
| 5 | "Why Travellers Keep Faith" — 2 photo frames + pin, 5-item list, 2 callouts | `site_settings.homepage.faith` |
| 6 | Journal — 3 blog cards, horizontal scroll | `listPublishedPosts()` limit 3 |
| 7 | Reviews — 4 platform badges, 3 review cards, carousel dots, "View All Testimonials" | `listPublishedTestimonials()` + `site_settings.reviews` |
| 8 | "Why You Choose Our Company" — 3 icon rows + photo | `site_settings.homepage.why_items[]` |
| 9 | Dream CTA — heading, two paragraphs, button, large decorative SVG | `site_settings.homepage.cta` |

**Tour card** (shared component, used on `/`, `/tours`, and the tour page's related rail):
photo frame with optional `👑 Featured` ribbon, title, `📍 destination_label`, summary,
4 stats (`🕐 Days`, `🚶 Activities`, `👥 Group`, `📍 Stops`), footer with "From $X" and
"View Details →".

> Load the four loader calls with `Promise.all`, not sequentially. BACKEND.md §13C notes the
> original homepage awaited them in series.

### 7.2 Tours index — `/tours`

Banner (`h1` "Signature Private Tours of Bangladesh") → intro block → **filter pills** →
count line → card grid → dream CTA.

Filter pills in the design are `All Tours · 🐅 Wildlife · 🍃 Nature · 🏖️ Beach · ⛰️ Hills ·
🕌 Culture`. These are **themes, not the `tours.category` enum** (which is
`day-tour | multi-day | holiday`, a duration axis). Drive the pills from the `activities`
table via `tour_activities` — that join already exists in the schema and already has a read
function. Each activity row carries its emoji in `name`.

Filtering is client-side over the SSR'd list (there are ~9 tours). The count line reads
`Showing all N tours` / `Showing N <theme> tours`. Reflect the active filter in the URL
(`/tours?theme=wildlife`) so it is linkable and indexable.

### 7.3 Tour detail — `/tours/:slug`

The richest page in the product — 1,245 lines of reference HTML. Structure:

1. **Gallery** — 4-image mosaic (1 large + 3), from `tours.images`
2. **Title row** — breadcrumb, `h1`, day badge
3. **Facts grid** — 15 icon/label/value cells: Tour Type, Duration, Location, Best Season,
   Group Size, Accommodation, Transport, Meals, Guiding Method, Language, Age Limit, Fitness
   Level, Pickup & Drop, Arrival On, Depart From → `tours.facts` jsonb
4. **Sticky tab rail** — anchors to Overview, Highlights, Itinerary, Cost, Inclusions, Advise,
   FAQs, Map, Video
5. **Sections** — `📜 Overview` (paragraphs + `💡 Good to know` tip), `⭐ Highlights`,
   `📍 Journey at a Glance`, `➕ Optional Add-Ons`, `🗺️ Day-by-Day Itinerary` (numbered),
   `💵 Tour Price & Offers` (3 offer cards), `🛑 What's Included` (✅/❌ two columns),
   `♿ Accessibility`, `🎯 Trip Advice` (3 blocks), `🌍 Responsible Travel Pledge`,
   `❓ FAQs` (per-tour), `🗺️ Map`, `📽️ Video`, `🌟 Why Choose Roam Bengal for This Tour`
6. **Sticky sidebar** — price box (`$175 / Person* From`, 6 promise bullets, "Book Now") and a
   "You Might Also Like" mini-card rail
7. **Related tours** grid at the bottom

"Book Now" opens the inquiry form pre-filled with `tour_slug`.

### 7.4 Blog — `/blog` and `/blog/:slug`

Index: masthead ("The Roam Bengal Journal — Vol. 04"), category rail (All Stories, Wildlife,
Culture, Travel Tips, Food, Guides), one featured card, "Latest Stories" grid with article
count, newsletter signup box.

Cards carry a category tag, read time, author name + initial avatar, and a date label.
`/blog/:slug` has **no reference design** — see §16.

### 7.5 Reviews — `/reviews`

Hero with decorative line-art SVGs, aggregate score (`4.9 / 5`, "Based on 340+ verified
reviews"), 4 platform badges (Tripadvisor, Google, Trustpilot, Facebook, each with its brand
colour), then full-width review rows: photo, author + country, tour label + duration, stars, a
pull-quote, and the body. "Load More Reviews" button, then a "Been On A Trip With Us?" CTA.

Aggregate score, review count, and platform badges are **editorial claims** — store them in
`site_settings.reviews`, not computed from the `testimonials` table (the table holds a curated
subset, not all 340).

### 7.6 About — `/about`

Hero (copy + photo), intro strip, 4-stat band (40+ tours, 25+ activities, 6 regions, 6.5K+
travellers), Mission/Vision/Values cards, 6-item "Why Travel With Roam Bengal" grid, reviews
band, dream CTA. All from `site_settings.about`.

### 7.7 Contact — `/contact`

Banner, contact detail cards (phone, email, office hours), the inquiry form, decorative SVG
with a pull quote, WhatsApp strip, map embed.

Form fields: **Full Name\*, Email\*, Phone/WhatsApp, Country, Interested Tour (select),
Message\***. The tour select is populated from `listPublishedTours()` plus a final
"Not sure yet — help me choose" option. Submitting calls `submitInquiry`.

### 7.8 Policy pages — `/policies/:slug`

Five pages sharing one layout: banner with eyebrow + `h1` + breadcrumb, a `pay-subhead` line
with a coloured accent phrase, an intro paragraph, then N `pay-section` blocks each with an
emoji `h2` and prose/lists, closing with a highlighted "Questions?" contact card.

Default copy ships in code (`src/lib/policy-content.ts`), and `site_settings.policy_<slug>`
merges over it field-by-field so a partial edit is always safe — the `mergeInfo()` pattern from
BACKEND.md §10.

---

## 8. Data model

Start from BACKEND.md §6, then apply the delta below. The reference designs need materially
more per-tour structure than that schema carries.

### 8.1 Tables kept as specified

`user_roles`, `destinations`, `activities`, `tour_activities`, `faqs`, `site_settings`,
`seo_meta`, `redirects`, plus `private.has_role()` and `public.set_updated_at()`.

**Dropped:** `tour_destinations` (dead in the source system, and no destination pages ship in v1).

### 8.2 `tours` — additions

| Column | Type | Why |
| --- | --- | --- |
| `is_featured` | `boolean NOT NULL DEFAULT false` | 👑 Featured ribbon |
| `activities_count` | `int` | card stat `🚶 Activities: 6+` |
| `group_size_max` | `int` | card stat `👥 Group: 8` |
| `stops_count` | `int` | card stat `📍 Stops: 5+` |
| `price_note` | `text` | "per person for a group of 2" |
| `overview` | `jsonb NOT NULL DEFAULT '[]'` | array of paragraph strings |
| `overview_tip` | `text` | the `💡 Good to know` callout |
| `glance` | `jsonb NOT NULL DEFAULT '[]'` | `[{ when, detail }]` |
| `addons` | `jsonb NOT NULL DEFAULT '[]'` | `[{ icon, title, detail }]` |
| `offers` | `jsonb NOT NULL DEFAULT '[]'` | `[{ title, items[] }]` — the 3 offer cards |
| `accessibility` | `jsonb NOT NULL DEFAULT '[]'` | `[{ label, detail }]` |
| `advice` | `jsonb NOT NULL DEFAULT '[]'` | `[{ title, items[] }]` — Essential / Practical / Safety |
| `pledge` | `text[] NOT NULL DEFAULT '{}'` | Responsible Travel Pledge bullets |
| `why_items` | `text[] NOT NULL DEFAULT '{}'` | "Why Choose Roam Bengal for This Tour" |
| `faqs` | `jsonb NOT NULL DEFAULT '[]'` | `[{ question, answer }]`, per-tour |
| `map_embed` | `text` | map iframe URL |
| `related_slugs` | `text[] NOT NULL DEFAULT '{}'` | "You Might Also Like"; empty ⇒ auto-pick by category |

Plus a `CHECK (category IN ('day-tour','multi-day','holiday'))` constraint.

**`facts` jsonb key list extends from 12 to 15.** BACKEND.md defines `transportation`,
`accommodation`, `max_altitude`, `departure`, `best_season`, `tour_type`, `meals`, `language`,
`fitness_level`, `group_size`, `min_age`, `max_age`. The tour page's facts grid also needs
`arrival`, `pickup_drop`, and `guiding_method`. Keep the key list and labels in
`TOUR_FACT_KEYS` / `TOUR_FACT_LABELS` in `src/lib/content-types.ts` so the admin editor and the
public page cannot drift, and keep the derived-default behaviour for unset keys.

### 8.3 `blog_posts` — additions

`author_name text`, `author_role text`, `author_avatar text`,
`is_featured boolean NOT NULL DEFAULT false`.

### 8.4 `testimonials` — additions

`tour_label text` ("Bandarban Hill Trek — 3 Days"), `headline text` (the pull-quote, distinct
from the body), `platform text` (`tripadvisor|google|trustpilot|facebook|direct`),
`is_featured boolean NOT NULL DEFAULT false` (which 3 show on the homepage).

### 8.5 `inquiries` — additions

`country text` — the contact form asks for it and it is a real qualifier for an inbound
operator. Keep everything else from BACKEND.md §6, including the validating `WITH CHECK` INSERT
policy, and make `message` required in **both** Zod and the policy.

### 8.6 New table: `newsletter_subscribers`

Backs the blog page's "Get New Stories In Your Inbox" box.

```text
id uuid PK · email text NOT NULL · source text · created_at timestamptz
UNIQUE INDEX on lower(email)
```

Case-insensitive uniqueness comes from the functional index rather than a `citext` column, so
no extension has to be installed into `public` (which the security advisor flags).

RLS: `INSERT` granted to `anon`/`authenticated` with a `WITH CHECK` email-format constraint
mirroring `inquiries`; `SELECT`/`UPDATE`/`DELETE` admin-only. Public cannot read the list.

### 8.7 `site_settings` keys

Seeded (`ON CONFLICT (key) DO NOTHING`) from BACKEND.md §10: `header`, `footer`, `hero`,
`homepage`, `about`, `contact`. **New keys for this build:**

| Key | Shape |
| --- | --- |
| `reviews` | `{ score, score_out_of, count_label, platforms[{name, score, colour, icon}] }` |
| `gallery` | `{ heading, blurb, cta_label, cta_link, photos[{tag, image_url}] }` |
| `tours_page` | `{ banner_title, intro_heading, intro_paragraphs[], intro_bold }` |
| `blog_page` | `{ volume_label, heading, subtext, categories[], newsletter{...} }` |
| `whatsapp` | `{ number, link, float_label, strip_heading, strip_body }` |
| `policy_<slug>` | override for the 5 policy pages |
| `info_<slug>` | override for the 6 footer info pages |
| `robots` | `{ content }` |

> `site_settings` is world-readable by design. **Never put a secret in it.**

### 8.8 RLS

Apply BACKEND.md §7 unchanged: the standard content-table pattern (`public read published X`
plus `admins manage X`) for `tours`, `destinations`, `blog_posts`, `testimonials`, `faqs`;
always-public `SELECT` for `activities`, `tour_activities`, `site_settings`, `seo_meta`,
`redirects`; asymmetric write-only-for-public on `inquiries` and `newsletter_subscribers`;
`SELECT`-only grant on `user_roles`. Every policy delegates to `private.has_role`.

---

## 9. Server function catalog

Per BACKEND.md §9, with these additions:

**Public reads** (`site-content.functions.ts`): everything in BACKEND.md, plus
`listFeaturedTours`, `listRelatedTours({ slug })`, `getPostBySlug`, `listPostsByCategory`.

**Public writes**: `submitInquiry` (service-role, as specified) and new
`subscribeNewsletter({ email })` — same pattern, generic error message to the client, raw
error logged server-side.

**Admin** (`admin-content.functions.ts`): the full BACKEND.md list. All mutations are `POST`,
including deletes. All Zod-validated. `assertAdmin(context)` is the first line of every handler.

> **Two distinct failure shapes reach the client, and callers must handle both.** A thrown
> `Response` (our `httpError`) arrives as a real HTTP status — 401, 403, 404. An error thrown
> *inside* a handler, such as a Zod validation failure, arrives as **HTTP 200** with the error
> carried in the reply envelope's `error` field. Checking only the status code will silently
> treat a rejected save as a success.
>
> **An UPDATE filtered to zero rows by RLS returns success with no row**, not an error. Every
> update here therefore does `.select("id").maybeSingle()` and 404s on an empty result —
> otherwise a save that RLS silently discarded would look like it worked.

**SEO** (`seo.functions.ts`): as specified, but `getSeoMeta` and `listRedirectsPublic` must
actually be wired in this build (see §4 deviations).

Mapper rules that must not be skipped: Postgres `numeric` arrives as a string — coerce with
`Number()`; treat `undefined` and non-finite as "no value" so an unapplied migration degrades
to a UI fallback instead of `NaN`; `null` array columns become `[]`.

---

## 10. Admin CMS

Routes under `_authenticated/admin`, `ssr: false`, guarded by `whoAmI`. The guards are
cosmetic — real enforcement is Zod + `requireSupabaseAuth` + `assertAdmin` + RLS.

| Screen | Function |
| --- | --- |
| `/admin` | Dashboard — 8 parallel `head:true` counts |
| `/admin/tours`, `/admin/tours/$id` | List + full editor: basics, pricing, facts (15 keys), itinerary, glance, add-ons, offers, inclusions/exclusions, accessibility, advice, pledge, FAQs, gallery, video, map |
| `/admin/posts` | Blog CRUD with paragraph-array body editor |
| `/admin/testimonials` | CRUD incl. rating, platform, tour label, images |
| `/admin/faqs` | Global FAQ CRUD |
| `/admin/destinations`, `/admin/activities` | CRUD; activities double as the tours-page filter themes |
| `/admin/inquiries` | Queue: new / read / handled, admin note, `handled_at` stamped on handled |
| `/admin/newsletter` | Subscriber list + CSV export |
| `/admin/settings` | Key/value editor for all `site_settings` keys, with a typed form per known key rather than raw JSON |
| `/admin/seo` | Per-entity meta + local keyphrase/readability scoring |
| `/admin/redirects` | `from_path` must start with `/`; `status_code` ∈ {301, 302} |

The tour editor is the highest-risk screen: 17 fields are arrays or structured JSON. Build
reusable `RepeaterField` / `KeyValueField` / `TwoColumnListField` controls once; do not
hand-roll each section.

---

## 11. SEO

1. `/sitemap.xml` — static paths merged with `listSitemapEntries()`, `<lastmod>` from
   `updated_at`, cached 1h.
2. `/robots.txt` — from `site_settings.robots`, falling back to a built-in that disallows
   `/admin` and `/auth` and points at the sitemap.
3. `seo_meta` per entity — **rendered**, unlike the source system. Each public loader fetches
   it; `head()` runs it through `buildSeoMeta()`, falling back to loader-derived tags.
4. `redirects` — served by request middleware.
5. JSON-LD: `TouristTrip` on tour pages, `Article` on posts, `Organization` +
   `AggregateRating` on `/reviews`, `FAQPage` where FAQs are present.
6. `SITE_URL` from env, never hardcoded.

---

## 12. Media and images

Every reference page uses the same placeholder pattern: a gradient-filled frame, a visible
`📷 images/foo.jpg` label, and `<img onerror="this.style.display='none'">`.

Port this as a `<PhotoFrame>` component: gradient background, `alt` always required,
`loading="lazy"` except the hero, explicit `width`/`height` to reserve space, and a graceful
gradient fallback when `src` is empty or fails. Keep the `📷 path` label in **development
only** — it must not ship to production.

Uploads go browser-direct to the `content-images` Storage bucket using the admin's session,
never through the app server. Store the **public** URL (`getPublicUrl`), not a signed one.
Object paths are `${Date.now()}-${random6}.${ext}`. Both components also accept a pasted URL so
images can live off-Supabase.

**Every image in the reference designs is a placeholder.** Real photography is a content
dependency, not an engineering one — flag it early ([§17](#17-open-questions)).

---

## 13. Provisioning (Supabase)

**Status: complete.**

| | |
| --- | --- |
| Project | **Roam Bengal** |
| Ref | `ctrqaotwumvsetnpflvd` |
| URL | `https://ctrqaotwumvsetnpflvd.supabase.co` |
| Org | Platiroll (`acnxxdxuctlflmtaattc`) |
| Region | `ap-south-1` (Mumbai) |
| Postgres | 17 |
| Cost | $0/month (free tier) |
| Security advisor | **0 findings** |

Ten migrations applied:

| # | Name | Contents |
| --- | --- | --- |
| 01 | `foundation_roles_and_helpers` | `private` schema, `app_role` enum, `user_roles`, `private.has_role()`, `public.set_updated_at()`, grants/revokes, `user_roles` RLS |
| 02 | `content_tables` | `tours` (all §8.2 additions), `destinations`, `activities`, `tour_activities`, `blog_posts`, `testimonials`, `faqs`, `site_settings` + triggers, grants, RLS, indexes |
| 03 | `capture_tables` | `inquiry_status` enum, `inquiries`, `newsletter_subscribers`, validating `WITH CHECK` insert policies |
| 04 | `seo_meta_and_redirects` | `seo_meta`, `redirects` (with `from_path LIKE '/%'` and `status_code IN (301,302)` checks) |
| 05 | `storage_content_images` | public `content-images` bucket, 10 MB limit, image MIME allowlist, admin-write policy |
| 06 | `seed_site_settings` | 12 keys with copy lifted from `reference design/` |
| 07 | `fix_seed_apostrophe_escaping` | data fix — see note below |
| 08 | `seed_activities_and_tours` | 5 theme activities, 9 tours (Sundarbans fully populated), 9 `tour_activities` links |
| 09 | `seed_posts_testimonials_faqs` | 9 blog posts, 9 testimonials, 6 global FAQs |
| 10 | `restrict_bucket_listing` | dropped the broad anon SELECT on `storage.objects` |

Seeded row counts: tours 9 · activities 5 · tour_activities 9 · blog_posts 9 ·
testimonials 9 · faqs 6 · site_settings 12.

> **Migration 07 exists because of a real bug.** Migration 06 wrote its JSON inside
> dollar-quoted (`$j$…$j$`) strings while still using SQL's doubled-apostrophe escape. Dollar
> quoting does **not** unescape, so six keys stored `world''s largest` literally. Migration 07
> repaired them. The rule going forward: **inside dollar quotes, write plain apostrophes.**
>
> **Migration 10 exists because of an advisor finding.** A public bucket serves object URLs
> without any `SELECT` policy on `storage.objects`; the broad anon policy only added the
> ability to *list* every file. Admins keep `SELECT` through the `FOR ALL` admin policy.

### Remaining provisioning steps

1. **Create the first admin.** Create the user in the Supabase **dashboard** (Auth → Users),
   then grant the role:

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<auth.users.id>', 'admin');
   ```

   There is no sign-up route and `enable_signup = false` in `supabase/config.toml` — admins are
   provisioned by hand, by design.

   > **Do not create auth users with `INSERT INTO auth.users`.** GoTrue scans
   > `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`,
   > `email_change_token_current`, `phone_change`, `phone_change_token` and
   > `reauthentication_token` into non-nullable Go strings. A hand-inserted row leaves them
   > `NULL`, and *every* password grant for the whole project then fails with a
   > `500 "Database error querying schema"` — which looks like an outage, not a bad row. If
   > you must seed a user in SQL, set all eight to `''`.

2. **Pull the migrations into the repo.** They were applied remotely; the repo must become the
   source of truth. In Phase 1, after the toolchain exists:

   ```bash
   npx supabase link --project-ref ctrqaotwumvsetnpflvd
   npx supabase db pull        # writes supabase/migrations/*.sql
   ```

3. **Generate types** into `src/integrations/supabase/types.ts` (Phase 1).
4. **Re-run the security advisor** after any future DDL, and before every deploy.

---

## 14. Delivery phases

| Phase | Scope | Exit condition |
| --- | --- | --- |
| **0. Provision** ✅ | Supabase project, migrations 01–10, seed content | **Done.** Advisor clean; `tours` = 9. Outstanding: first admin user, `db pull`, generated types |
| **1. Skeleton** | TanStack Start scaffold, Tailwind + tokens, the 4 Supabase clients, middleware, error pages, `Header`/`Footer`/`PhotoFrame`/`Button`/`TourCard` | `/` renders chrome with live `site_settings` |
| **2. Public read paths** | `site-content.functions.ts` + DTO mappers | Every list/detail function returns typed data in a test route |
| **3. Marketing pages** | `/`, `/tours`, `/tours/:slug`, `/about` | Pixel-comparable to the reference at 1440px |
| **4. Content pages** | `/blog`, `/blog/:slug`, `/reviews`, `/contact`, 5 policy pages, 6 info pages, `/gallery` | All footer links resolve; no 404s |
| **5. Capture** | `submitInquiry`, `subscribeNewsletter`, WhatsApp float/strip, "Book Now" prefill | Inquiry appears in DB with `status='new'` |
| **6a. Auth** ✅ | `/auth`, `requireSupabaseAuth`, `attachSupabaseAuth`, `assertAdmin`, `whoAmI`, route guards, admin shell + dashboard | **Done.** `npm run test:auth` — 16 checks green |
| **6b. Admin API** ✅ | 28 server functions across tours, destinations, activities, posts, testimonials, FAQs, settings, inquiries, subscribers | **Done.** `npm run test:admin` — 27 checks green |
| **6c. Admin CMS screens** ✅ | Tours list + full editor, blog, reviews, FAQs, themes, inquiries queue, settings, image upload | **Done.** `npm run test:cms` — 20 checks green |
| **7. SEO** | sitemap, robots, `seo_meta` rendering, redirect middleware, JSON-LD | Rich-results test passes on a tour page |
| **8. Responsive + a11y** | Mobile nav (new — see §16), 320–1920px sweep, focus states, contrast | Lighthouse a11y ≥ 95, no horizontal scroll |
| **9. Deploy** | Env wiring, Docker or Lovable target, custom domain, `SITE_URL` | Production URL live with real content |

---

## 15. Acceptance criteria

- [ ] All 12 reference pages exist as live routes with database-backed content.
- [ ] No string, price, image, or list item on a public page is hardcoded in a component —
      everything traces to `tours`, `blog_posts`, `testimonials`, `faqs`, or `site_settings`.
- [ ] An admin can create, edit, publish, unpublish, and delete a tour, post, testimonial, and
      FAQ without touching SQL or raw JSON.
- [ ] A signed-in **non-admin** is rejected by every admin RPC even when calling the endpoint
      directly with a valid JWT — verified by test, not by inspection.
- [ ] An anonymous caller can `INSERT` into `inquiries` but cannot `SELECT` from it, including
      rows they submitted.
- [ ] The Supabase security advisor reports zero findings.
- [ ] `/sitemap.xml` lists every published tour, post, destination, and activity with a correct
      `<lastmod>`; `/robots.txt` disallows `/admin` and `/auth`.
- [ ] A `seo_meta` row authored in `/admin/seo` visibly changes the rendered `<title>`,
      canonical, and OG tags.
- [ ] A redirect row saved in `/admin/redirects` actually returns 301/302.
- [ ] No horizontal scroll at 320px on any route; navigation is reachable on mobile.
- [ ] Lighthouse: performance ≥ 90, a11y ≥ 95, SEO = 100 on `/` and one tour page.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` appears in no client bundle — verified by grepping build output.

---

## 16. Gaps in the reference designs

Things the build needs that the HTML does not provide. Each needs a design decision before its
phase starts.

| Gap | Impact | Proposed resolution |
| --- | --- | --- |
| **No mobile navigation.** Below 980px the CSS is `.navlinks{display:none}` with no hamburger | Site is unnavigable on phones — likely the majority of traffic | Design and build a drawer menu; blocks Phase 8 |
| **No blog post detail page.** `blog.html` links to `blog-post-sundarbans.html`, which does not exist | `/blog/:slug` has no design | Derive from the policy-page layout: banner, prose column, author block, related posts |
| **No gallery page.** "View Full Gallery" links to `#` | Dead CTA | Build a simple masonry grid from `site_settings.gallery`, or drop the CTA for v1 |
| **No info pages.** 6 footer links (visa, embassy, custom booking, travel FAQs, responsible travel, guides, careers) point at `#` | Dead footer links | Reuse the policy-page layout with `info_<slug>` overrides |
| **No admin UI design at all** | Largest single build surface | Use shadcn/ui defaults; do not attempt to match the marketing aesthetic |
| **No destination pages**, though `destinations` is in the schema | Table would ship unused | Keep the table, defer the pages to v2 |
| **Only one tour page exists** (Sundarbans); 8 other tours are cards linking to `#` | Content gap | The one page is the template; the other 8 need copy written |
| **No 404 / 500 page design** | — | Style from the policy banner + a `btn-green-dark` back-home |
| **No loading or empty states** | e.g. tours filter with zero matches | Define per component in Phase 3 |
| **No form success / error states** on the contact form | Users get no feedback | Inline success panel replacing the form; field-level Zod errors |

---

## 17. Open questions

1. **Admin account** — which email should hold the first `admin` role? Needed to finish Phase 0
   (create the user in the dashboard, then insert the `user_roles` row).
2. **Photography** — every image is a placeholder. Who supplies the ~40 photos, and when?
   Without them the site cannot launch regardless of engineering progress.
3. **Domain** — `roambengal.com` appears in the footer. Is it registered? `SITE_URL` and every
   canonical depend on it.
4. **Real contact details** — the designs carry `+880 1XXX-XXXXXX` and `hello@roambengal.com`.
   Need the live WhatsApp number and inbox.
5. **The other 8 tours** — is the copy written, or does it need commissioning? Each tour page is
   roughly 1,500 words plus 15 structured facts.
6. **Review claims** — "4.9/5 based on 340+ verified reviews" and the four platform scores are
   presented as fact. Are the platform profiles live? Publishing unverifiable aggregate ratings
   with `AggregateRating` schema markup is a compliance risk in some jurisdictions.
7. **Deploy target** — Lovable (per BACKEND.md's `vite.config.ts` notes) or self-hosted Docker?
   It changes the Vite config materially and should be settled before Phase 1.
8. **Blog authors** — "Rafiq Ahmed, Lead Guide" and "Nasrin Khan" are named. Real people with
   real bios, or placeholders?
