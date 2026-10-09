# Backend — End to End

> **Historical Supabase design.** The production implementation now uses MySQL, local
> Node.js authentication, and MySQL-backed media. Use [MYSQL_HOSTINGER.md](MYSQL_HOSTINGER.md)
> for deployment and cutover; do not follow the Supabase-specific instructions below.

Everything server-side in this project, from the HTTP request that hits the Node/Worker
process down to the Postgres row and back.

There is **no separate backend service**. "The backend" is two things stitched together:

1. **The TanStack Start server** — SSR + a set of RPC endpoints (`createServerFn`) that run
   in the same process that renders the pages. Lives in `src/`.
2. **Supabase** (project `ceuwxvcazqxqjgtcmzhy`) — Postgres with Row Level Security, GoTrue
   auth, and Storage. Schema lives in `supabase/migrations/`.

---

## Table of contents

- [1. Architecture at a glance](#1-architecture-at-a-glance)
- [2. Request lifecycle](#2-request-lifecycle)
- [3. Environment variables](#3-environment-variables)
- [4. The four Supabase clients](#4-the-four-supabase-clients)
- [5. Authentication and authorization](#5-authentication-and-authorization)
- [6. Database schema](#6-database-schema)
- [7. RLS, grants, and the privilege model](#7-rls-grants-and-the-privilege-model)
- [8. Storage](#8-storage)
- [9. Server function catalog](#9-server-function-catalog)
- [10. The `site_settings` content model](#10-the-site_settings-content-model)
- [11. Live Preview system](#11-live-preview-system)
- [12. SEO subsystem](#12-seo-subsystem)
- [13. Migrations](#13-migrations)
- [14. Worked end-to-end flows](#14-worked-end-to-end-flows)
- [15. Error handling](#15-error-handling)
- [16. Deployment](#16-deployment)
- [17. Known gaps and gotchas](#17-known-gaps-and-gotchas)
- [18. Recipe: adding a new backed entity](#18-recipe-adding-a-new-backed-entity)

---

## 1. Architecture at a glance

```
                 browser
                    │
     ┌──────────────┴───────────────┐
     │                              │
 document request              serverFn RPC (POST/GET)
 (SSR page load)               fetch with Authorization: Bearer <jwt>
     │                              │
     ▼                              ▼
┌──────────────────────────────────────────────────────┐
│  TanStack Start server  (src/server.ts → start.ts)    │
│  requestMiddleware: errorMiddleware, csrfMiddleware   │
│  functionMiddleware: attachSupabaseAuth (client side) │
│                                                       │
│  route loaders ──► server functions ──► supabase-js   │
└──────────────────────────────────────────────────────┘
     │                │                    │
     │ anon key       │ anon key +         │ service_role key
     │ (RLS on)       │ user JWT (RLS on)  │ (RLS bypassed)
     ▼                ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                     Supabase                          │
│  Postgres (public schema + private.has_role)          │
│  GoTrue auth (auth.users, email/password)             │
│  Storage bucket `content-images`                      │
└──────────────────────────────────────────────────────┘
```

Key files:

| Concern | File |
| --- | --- |
| SSR entry / catastrophic error wrapper | [src/server.ts](src/server.ts) |
| Global middleware registration | [src/start.ts](src/start.ts) |
| Browser Supabase client (anon) | [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) |
| Server admin client (service role) | [src/integrations/supabase/client.server.ts](src/integrations/supabase/client.server.ts) |
| Auth middleware (server, verifies JWT) | [src/integrations/supabase/auth-middleware.ts](src/integrations/supabase/auth-middleware.ts) |
| Auth attacher (client, sends JWT) | [src/integrations/supabase/auth-attacher.ts](src/integrations/supabase/auth-attacher.ts) |
| Generated DB types | [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) |
| Public read API | [src/lib/site-content.functions.ts](src/lib/site-content.functions.ts) |
| Admin write API | [src/lib/admin-content.functions.ts](src/lib/admin-content.functions.ts) |
| Inquiry submission | [src/lib/inquiries.functions.ts](src/lib/inquiries.functions.ts) |
| SEO / redirects / robots | [src/lib/seo.functions.ts](src/lib/seo.functions.ts) |
| DTO shapes shared client↔server | [src/lib/content-types.ts](src/lib/content-types.ts) |
| Settings definitions | [src/lib/content-schema.ts](src/lib/content-schema.ts) |
| Live preview protocol | [src/lib/preview-protocol.ts](src/lib/preview-protocol.ts) |
| Live preview injector | [src/components/preview-bridge.tsx](src/components/preview-bridge.tsx) |
| Migrations | [supabase/migrations/](supabase/migrations/) |

---

## 2. Request lifecycle

### 2a. Document request (someone loads `/tours/sundarbans-3d`)

1. The platform invokes the default export of [src/server.ts](src/server.ts#L46), which lazily
   imports `@tanstack/react-start/server-entry` and calls its `fetch`.
2. `requestMiddleware` runs in the order declared in
   [src/start.ts:30](src/start.ts#L30): `errorMiddleware`, then `csrfMiddleware`.
   - `csrfMiddleware` is filtered to `handlerType === "serverFn"`, so document requests are
     **not** blocked — inbound links from Google or Facebook are legitimately cross-site.
3. TanStack Router matches the route file and runs its `loader`. For
   [tours.$slug.tsx:74](src/routes/tours.$slug.tsx#L74) that is four server functions in
   `Promise.all`: `getTourBySlug`, `listPublishedTours`, `listPublishedTestimonials`,
   `listPublishedFaqs`. During SSR these execute **in-process** — no HTTP hop.
4. Each server function builds an anon-key Supabase client and queries Postgres. RLS
   restricts the result to published rows.
5. `head()` builds `<title>`/OG tags from the loader data.
6. `__root.tsx` also calls `queryClient.ensureQueryData(siteSettingsQueryOptions)`
   ([src/routes/__root.tsx:78](src/routes/__root.tsx#L78)) so header/footer content from
   `site_settings` is present in the SSR payload.
7. HTML streams back; React hydrates; TanStack Query rehydrates the settings cache.

### 2b. Server function RPC (admin clicks "Save tour")

1. The component calls `adminUpsertTour({ data: {...} })` from the browser. Because it is a
   `createServerFn`, this becomes a `POST` to a generated same-origin endpoint.
2. `functionMiddleware` runs **on the client** first:
   `attachSupabaseAuth` ([auth-attacher.ts:7](src/integrations/supabase/auth-attacher.ts#L7))
   reads the current session from `localStorage` and sets
   `Authorization: Bearer <access_token>`.
3. On the server, `csrfMiddleware` validates origin (this *is* a `serverFn`).
4. `inputValidator` runs the Zod schema. A malformed payload throws before any DB access.
5. `requireSupabaseAuth` middleware
   ([auth-middleware.ts:33](src/integrations/supabase/auth-middleware.ts#L33)):
   - requires an `Authorization: Bearer` header with a three-segment JWT,
   - builds a Supabase client that forwards that JWT,
   - calls `supabase.auth.getClaims(token)` to *verify* it,
   - injects `{ supabase, userId, claims }` into handler `context`.
6. The handler calls `assertAdmin(context)`, which selects from `user_roles` — through the
   **user-scoped** client, so RLS applies here too.
7. The write goes through the same user-scoped client, so the `admins manage tours` RLS
   policy is the final authority. Admin-ness is therefore checked twice: once in app code
   (fast, gives a clean `Forbidden`) and once in the database (authoritative).

---

## 3. Environment variables

| Variable | Where it is read | Exposure |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser bundle (`import.meta.env`) | public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser bundle | public |
| `VITE_SUPABASE_PROJECT_ID` | build metadata | public |
| `SUPABASE_URL` | server (`process.env`) | server only |
| `SUPABASE_PUBLISHABLE_KEY` | server — anon-key reads + auth middleware | server only |
| `SUPABASE_SERVICE_ROLE_KEY` | server — `client.server.ts` only | **secret** |

`client.ts` falls back from `import.meta.env` to `process.env` so the same module works in
the browser and during SSR. All four client factories throw a descriptive error naming the
missing variables rather than failing with an opaque network error.

Both key formats are handled: the newer opaque `sb_publishable_` / `sb_secret_` keys are not
JWTs, so `createSupabaseFetch` strips the `Authorization: Bearer <key>` header supabase-js
would otherwise send and passes the key only via the `apikey` header
([client.ts:9-27](src/integrations/supabase/client.ts#L9-L27)).

---

## 4. The four Supabase clients

| # | Client | Key | RLS | Used by |
| --- | --- | --- | --- | --- |
| 1 | `supabase` (browser) | publishable/anon | enforced as `anon`, or as the signed-in user | auth pages, storage uploads |
| 2 | `serverClient()` (local helper) | publishable/anon | enforced as `anon` | public reads in `site-content.functions.ts`, `seo.functions.ts` |
| 3 | `context.supabase` (from `requireSupabaseAuth`) | publishable/anon **+ user JWT** | enforced as that user | every admin server function |
| 4 | `supabaseAdmin` | **service role** | **bypassed** | `submitInquiry` only |

Clients 1, 2 and 4 are lazy `Proxy` singletons — the underlying client is constructed on
first property access, so importing the module never throws at import time.

> **Bundle safety.** `client.server.ts` must never be imported at the top level of a
> `*.functions.ts` or route file — those ship to the browser. `inquiries.functions.ts`
> respects this with a dynamic `await import(...)` **inside** the handler
> ([inquiries.functions.ts:19](src/lib/inquiries.functions.ts#L19)). Top-level import is only
> safe from another `.server.ts` module.

Client 3 is deliberately *not* the service-role client. Admin writes run with the caller's
own JWT so that RLS remains the last line of defense even if an `assertAdmin` call is ever
forgotten in a new function.

---

## 5. Authentication and authorization

### Sign-in

Email/password only, via GoTrue. [src/routes/auth.tsx](src/routes/auth.tsx) calls
`supabase.auth.signInWithPassword`. There is no sign-up route — accounts are provisioned in
the Supabase dashboard. The page is `ssr: false` and marked `robots: noindex`.

Sessions persist in `localStorage` with `autoRefreshToken: true`
([client.ts:50-54](src/integrations/supabase/client.ts#L50-L54)).

### Route guards (client-side, cosmetic)

- `_authenticated/route.tsx` — `ssr: false`, `beforeLoad` redirects to `/auth` if
  `supabase.auth.getUser()` returns no user.
- `_authenticated/admin.tsx` — `beforeLoad` calls the `whoAmI` server function and redirects
  unless `isAdmin`.

These guards only hide UI. **They are not security.** Anyone can call the RPC endpoints
directly; the real enforcement is steps 5–7 in §2b.

### Roles

```sql
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
```

`admin` is the only role. To grant it, insert a row linking a `auth.users.id` to `'admin'`.

Every RLS policy delegates to a `SECURITY DEFINER` helper:

```sql
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
```

It lives in the `private` schema, not `public`. Migration `20260707145354` moved it there and
`DROP`ped `public.has_role` — a function in `public` is exposed as a callable PostgREST RPC,
which is not wanted for a privilege oracle. `EXECUTE` is revoked from `PUBLIC` and granted
explicitly to `authenticated, anon, service_role` so policies can still call it.

The same migration also revoked `EXECUTE` on `public.set_updated_at()` from `anon` and
`authenticated` — it is a trigger function and should not be directly callable.

---

## 6. Database schema

All tables are in `public` unless noted. Every table with an `updated_at` column has a
`BEFORE UPDATE` trigger running `public.set_updated_at()`.

### `tours`

The central content entity.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `slug` | text UNIQUE NOT NULL | URL key for `/tours/:slug` |
| `title` | text NOT NULL | |
| `category` | text NOT NULL DEFAULT `'multi-day'` | app-level enum: `day-tour`, `multi-day`, `holiday` |
| `summary` | text | |
| `hero_image` | text | URL or asset-map key |
| `images` | text[] NOT NULL DEFAULT `{}` | gallery |
| `duration_label` | text | display string e.g. "3 Days / 2 Nights" |
| `duration_days` | int NOT NULL DEFAULT 1 | |
| `price_usd` | numeric(10,2) | |
| `price_bdt` | numeric(12,2) | |
| `discount_price_usd` | numeric(10,2) | |
| `child_price_usd` | numeric(10,2) | added `20260802` |
| `discount_child_price_usd` | numeric(10,2) | added `20260802` |
| `facts` | jsonb NOT NULL DEFAULT `{}` | added `20260802`; see below |
| `rating` | numeric(3,2) | |
| `reviews_count` | int NOT NULL DEFAULT 0 | |
| `destination_label` | text | free-text display label |
| `activity_label` | text | free-text display label |
| `highlights` | text[] NOT NULL DEFAULT `{}` | |
| `itinerary` | jsonb NOT NULL DEFAULT `[]` | `[{ day, title, detail }]` |
| `inclusions` | text[] NOT NULL DEFAULT `{}` | |
| `exclusions` | text[] NOT NULL DEFAULT `{}` | |
| `primary_destination_slug` | text | soft link, not an FK |
| `video_url` | text | added `20260709` |
| `is_published` | boolean NOT NULL DEFAULT true | the publish gate for RLS |
| `sort_order` | int NOT NULL DEFAULT 0 | default ordering everywhere |
| `created_at` / `updated_at` | timestamptz | |

**`facts` jsonb.** Twelve optional string keys — `transportation`, `accommodation`,
`max_altitude`, `departure`, `best_season`, `tour_type`, `meals`, `language`,
`fitness_level`, `group_size`, `min_age`, `max_age`. Modeled as one jsonb column rather than
twelve text columns, following the existing `itinerary jsonb` precedent. Any unset key falls
back to a derived default on the trip page
([tours.$slug.tsx:44](src/routes/tours.$slug.tsx#L44) `factDefaults`) — `departure` derives
from `destination_label`, `tour_type` from `activity_label`, `accommodation` from whether the
trip is a day tour. The key list and labels are shared between the admin editor and the
public page via `TOUR_FACT_KEYS` / `TOUR_FACT_LABELS` in
[content-types.ts:24-44](src/lib/content-types.ts#L24-L44) so the two cannot drift.

### `destinations`

`id`, `slug` UNIQUE, `name`, `tagline`, `region`, `image_url`, `intro`,
`highlights text[]`, `best_time`, `sort_order`, `is_published`, timestamps.

### `activities`

`id`, `slug` UNIQUE, `name`, `description`, `sort_order`, timestamps.
Note: **no `is_published`** — activities are always public.

### `tour_destinations` / `tour_activities`

Join tables, composite PK, both FKs `ON DELETE CASCADE`:

```sql
CREATE TABLE public.tour_activities (
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  PRIMARY KEY (tour_id, activity_id)
);
```

Only `tour_activities` is currently read by the app (`listToursByActivitySlug`).
`tour_destinations` exists but is unused — tours link to a destination via the
`primary_destination_slug` text column instead.

### `blog_posts`

`id`, `slug` UNIQUE, `title`, `excerpt`, `body jsonb` (an array of paragraph strings),
`category`, `date_label`, `read_time`, `cover_image`, `is_published`, `sort_order`,
timestamps.

### `testimonials`

`id`, `author`, `location`, `quote`, `avatar_url`, `images text[]` (added `20260712134557`),
`rating smallint CHECK (rating BETWEEN 1 AND 5)` (added `20260708`), `sort_order`,
`is_published`, timestamps. Ordered by `created_at DESC`, not `sort_order`.

### `faqs`

`id`, `question`, `answer`, `category`, `sort_order`, `is_published`, timestamps.

### `inquiries`

The one table written by the public.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `name`, `email` | text NOT NULL | |
| `phone`, `destination`, `tour_slug`, `budget`, `message` | text | |
| `start_date` | date | |
| `travelers` | integer | |
| `status` | `public.inquiry_status` NOT NULL DEFAULT `'new'` | enum `new` / `read` / `handled` |
| `handled_at` | timestamptz | stamped when status flips to `handled` |
| `admin_note` | text | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

### `site_settings`

`id`, `key text UNIQUE NOT NULL`, `value jsonb NOT NULL DEFAULT '{}'`, `description`,
timestamps. See [§10](#10-the-site_settings-content-model).

### `seo_meta`

`id`, `entity_type text`, `entity_id text`, `focus_keyphrase`, `extra_keyphrases text[]`,
`synonyms text[]`, `meta_title`, `meta_description`, `canonical_url`, `og_title`,
`og_description`, `og_image`, `twitter_title`, `twitter_description`, `twitter_image`,
`robots_noindex bool`, `cornerstone bool`, `schema_type`, timestamps,
`UNIQUE (entity_type, entity_id)`, plus index `seo_meta_entity_idx (entity_type, entity_id)`.

`entity_type` is one of `tour` / `destination` / `blog` / `activity`; `entity_id` is that
row's uuid.

### `redirects`

`id`, `from_path text UNIQUE`, `to_path text`, `status_code int DEFAULT 301`, timestamps.

### `user_roles`

See [§5](#5-authentication-and-authorization).

---

## 7. RLS, grants, and the privilege model

Every table has `ENABLE ROW LEVEL SECURITY`. The model is deliberately two-layered — a
**GRANT** decides whether a role may attempt the verb at all, and a **POLICY** decides which
rows.

### Standard content-table pattern

Applied to `tours`, `destinations`, `blog_posts`, `testimonials`, `faqs`:

```sql
GRANT SELECT ON public.<t> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
GRANT ALL ON public.<t> TO service_role;

CREATE POLICY "public read published <t>" ON public.<t> FOR SELECT
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins manage <t>" ON public.<t> FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
```

So: anonymous visitors see published rows; a signed-in admin sees drafts too (which is how
`adminListTours` returns unpublished tours through the user-scoped client); a signed-in
**non-admin** has the GRANT to attempt a write but no policy permits any row, so every write
fails.

### Always-public tables

`activities`, `tour_activities`, `tour_destinations`, `site_settings` use
`FOR SELECT USING (true)` — no publish gate. `seo_meta` and `redirects` likewise allow
unrestricted read and admin-only write.

> `site_settings` being world-readable means **anything stored there is public**, including
> the `robots` key and every info-page override. Do not put secrets in it.

### `inquiries`

Asymmetric by design — write-only for the public, full access for admins:

```sql
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inquiries TO authenticated;

CREATE POLICY "anyone can submit inquiries" ON public.inquiries
FOR INSERT TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND length(btrim(name)) BETWEEN 1 AND 120
  AND email IS NOT NULL AND length(email) BETWEEN 3 AND 320
      AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND message IS NOT NULL AND length(btrim(message)) BETWEEN 1 AND 5000
  AND (phone IS NULL OR length(phone) <= 40)
  AND (status IS NULL OR status = 'new')
  AND handled_at IS NULL
  AND admin_note IS NULL
);

CREATE POLICY "admins manage inquiries" ON public.inquiries FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
```

There is no public `SELECT` policy, so a submitter cannot read back anyone's inquiry —
including their own. The `WITH CHECK` clause validates shape *in the database*, so the
constraints hold even if someone bypasses the app and posts to PostgREST directly, and it
prevents a submitter from pre-setting `status`, `handled_at` or `admin_note`.

### `user_roles`

```sql
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL
  USING (private.has_role(...)) WITH CHECK (private.has_role(...));
```

Only `SELECT` is granted to `authenticated`, so a non-admin cannot escalate themselves even
with a policy bug.

---

## 8. Storage

One bucket: **`content-images`**.

```sql
CREATE POLICY "Anyone can read content-images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'content-images');

CREATE POLICY "Admins manage content-images" ON storage.objects FOR ALL
  USING (bucket_id = 'content-images' AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'content-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));
```

Uploads happen **directly from the browser** to Supabase Storage using the user's session —
they do not pass through the app server. See
[src/components/admin/image-upload.tsx](src/components/admin/image-upload.tsx):

1. Generate a collision-resistant object path: `${Date.now()}-${random6}.${ext}`.
2. `supabase.storage.from("content-images").upload(path, file, { upsert: false })`.
3. `createSignedUrl(path, TEN_YEARS)` — a signed URL with a ten-year expiry
   (`60*60*24*365*10` seconds).
4. Store the resulting URL string in whatever content column the field is bound to.

Note that the stored value is a *signed* URL even though the bucket policy already allows
anonymous reads. `GalleryUpload` does the same in a loop for multi-image fields. Both
components also accept a pasted URL, so images can live off-Supabase.

---

## 9. Server function catalog

Every entry is a `createServerFn`. "Auth" means the `requireSupabaseAuth` middleware plus an
in-handler `assertAdmin` / `isAdmin` check.

### Public reads — [src/lib/site-content.functions.ts](src/lib/site-content.functions.ts)

Anon client, no auth. RLS filters to published rows; the `.eq("is_published", true)` in the
query is belt-and-braces.

| Function | Method | Input | Returns |
| --- | --- | --- | --- |
| `listPublishedTours` | GET | — | `TourDTO[]` by `sort_order` |
| `getTourBySlug` | GET | `{ slug }` | `TourDTO \| null` |
| `listPublishedDestinations` | GET | — | `DestinationDTO[]` |
| `getDestinationBySlug` | GET | `{ slug }` | `DestinationDTO \| null` |
| `listPublishedPosts` | GET | — | `BlogPostDTO[]` |
| `getPostBySlug` | GET | `{ slug }` | `BlogPostDTO \| null` |
| `listPublishedTestimonials` | GET | — | `TestimonialDTO[]` by `created_at DESC` |
| `listPublishedFaqs` | GET | — | `FaqDTO[]` |
| `listActivities` | GET | — | `ActivityDTO[]` |
| `getActivityBySlug` | GET | `{ slug }` | `ActivityDTO \| null` |
| `listToursByActivitySlug` | GET | `{ slug }` | `TourDTO[]` via `tour_activities` inner join |
| `getSetting` | GET | `{ key }` | `SiteSettingDTO \| null` |
| `getAllSettings` | GET | — | `SettingsMap` (`{ [key]: value }`) |

**Row → DTO mapping.** `toTour`, `toDest`, `toPost` normalize the raw row: Postgres `numeric`
arrives as a string over the wire, so prices and ratings are coerced with `Number(...)`;
`null` array columns become `[]`; jsonb columns are cast to their TS shape. The `num()` helper
([site-content.functions.ts:31-35](src/lib/site-content.functions.ts#L31-L35)) exists because
a column from an unapplied migration comes back `undefined`, which slips past a plain
`!== null` guard and becomes `NaN` — so `undefined` and non-finite are both treated as "no
value" and the UI falls back.

### Inquiry — [src/lib/inquiries.functions.ts](src/lib/inquiries.functions.ts)

| Function | Method | Auth | Notes |
| --- | --- | --- | --- |
| `submitInquiry` | POST | none | Zod-validated, inserted via **`supabaseAdmin`** (service role) |

Zod bounds: `name` ≤120, `email` valid ≤200, `phone` ≤50, `destination` ≤120, `tour_slug`
≤120, `start_date` ≤20, `travelers` int 1–50, `budget` ≤50, `message` ≤2000. Empty
`start_date` is coerced to `null` so Postgres doesn't reject `''` as a date. The raw Supabase
error is logged server-side but never returned to the caller — the client gets a generic
"We couldn't submit your inquiry. Please try again."

### Admin — [src/lib/admin-content.functions.ts](src/lib/admin-content.functions.ts)

All require auth + admin. All writes are Zod-validated.

| Function | Method | Purpose |
| --- | --- | --- |
| `whoAmI` | GET | `{ userId, isAdmin }` — powers the admin route guard (auth required, admin **not** required) |
| `adminStats` | GET | Seven parallel `head: true` count queries for the dashboard |
| `adminListTours` | GET | Projection of columns, includes drafts |
| `adminListDestinations` / `adminListActivities` / `adminListTestimonials` / `adminListFaqs` / `adminListPosts` / `adminListSettings` | GET | `select("*")`, includes drafts |
| `adminGetTour` | GET | `{ id }` → full row |
| `adminUpsertTour` | POST | `{ id?, tour }` — update when `id` present, else insert; returns `{ id }` |
| `adminDeleteTour` | POST | `{ id }` |
| `adminUpsertDestination` / `adminDeleteDestination` | POST | |
| `adminUpsertActivity` / `adminDeleteActivity` | POST | |
| `adminUpsertTestimonial` / `adminDeleteTestimonial` | POST | |
| `adminUpsertFaq` / `adminDeleteFaq` | POST | |
| `adminUpsertPost` / `adminDeletePost` | POST | |
| `adminSaveSetting` | POST | `{ key, value, description? }` upsert `onConflict: "key"` |
| `adminDeleteSetting` | POST | `{ key }` |
| `adminListInquiries` | GET | newest first |
| `adminUpdateInquiry` | POST | `{ id, status?, admin_note? }`; setting `status: "handled"` also stamps `handled_at` |
| `adminDeleteInquiry` | POST | `{ id }` |

Note that all mutations are `method: "POST"` — including deletes. TanStack Start reserves
`GET` for cacheable reads.

The `TourInput` Zod schema is the effective write contract for `tours` and is stricter than
the database: `category` is an enum of exactly `day-tour | multi-day | holiday`,
`duration_days` is 1–365, `slug` ≤160, `title` ≤240.

### SEO — [src/lib/seo.functions.ts](src/lib/seo.functions.ts)

| Function | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `getSeoMeta` | GET | none | `{ entity_type, entity_id }` → stored meta (**currently unused**, see §16) |
| `adminListAllSeoTargets` | GET | admin | Every tour/destination/post/activity joined with its `seo_meta` row |
| `adminSaveSeoMeta` | POST | admin | Upsert on `(entity_type, entity_id)` |
| `listRedirectsPublic` | GET | none | All redirects (**currently unused**, see §16) |
| `adminListRedirects` | GET | admin | |
| `adminSaveRedirect` | POST | admin | `from_path` must start with `/`; `status_code` must be 301 or 302 |
| `adminDeleteRedirect` | POST | admin | |
| `listSitemapEntries` | GET | none | Slugs + `updated_at` for all four entity types |
| `adminOrphanedPosts` | GET | admin | Posts with no `/blogs/<slug>` mention in any other post body |
| `getRobotsPublic` | GET | none | `site_settings['robots'].content` |
| `adminSaveRobots` | POST | admin | Upserts that same key |

`seo_meta` and `redirects` are accessed with `.from("seo_meta" as never)` casts because the
generated `Database` type predates those tables in some code paths.

---

## 10. The `site_settings` content model

A single key/value table backs all editable chrome and page copy. `value` is an arbitrary
jsonb object. 

**`content-schema.ts`**: The shape of these keys is no longer informal or guessed. Everything the admin settings panel renders is driven by [src/lib/content-schema.ts](src/lib/content-schema.ts). A field only appears in the admin panel if it is defined in the schema, ensuring the editor only offers fields that the site actually reads.

**Seeded keys** (migration `20260712131549` and `20260803000000`, inserted `ON CONFLICT (key) DO NOTHING` so
re-running never clobbers live edits):

| Key | Contains |
| --- | --- |
| `header` | `logo_url`, `logo_alt`, `phone_label`, `phone_number`, `phone_link`, `book_now_label`, `book_now_link`, `nav[]` of `{label, to}` |
| `footer` | `intro`, `address`, `phone`, `email`, `badges[]`, three `column_N_title` + `column_N_links[]`, `socials[]`, `copyright` |
| `hero` | homepage hero: `background_url`, two headline lines, `subtext`, primary/secondary CTA label+link |
| `homepage` | `stats[]`, section kickers/headings for popular / who / gallery / packages / why / activities / blog, `why_items[]`, CTA block |
| `about` | intro copy, images, `stats[]`, `pillars[]`, `why_items[]`, `team[]`, CTA block |
| `contact` | banner, intro, call / chat / visit blocks, `socials[]` |

**Convention keys** created on demand:

- `robots` → `{ content: string }`, served by `/robots.txt`.
- `policy_<slug>` → override for `/policies/:slug` (`refund`, `payment`, `cancellation`,
  `privacy`, `terms`). See [policies.$slug.tsx:84](src/routes/policies.$slug.tsx#L84).
- `info_<slug>` → override for standalone info pages, built by
  `infoKey()` in [info-content.ts:34](src/lib/info-content.ts#L34)
  (`/visa-information` → `info_visa-information`).
- `page_<route>` → headings and intros for the list pages (`page_tours`, `page_destinations`, `page_activities`, `page_blogs`, `page_reviews`).
- `whatsapp` → `{ enabled: boolean, number: string, button_label: string }`, powers the floating WhatsApp chat widget globally.
- `homepage_layout` → `{ sections: { id: string, visible: boolean }[] }`, stores the section ordering and visibility state for the drag-and-drop homepage builder.

**How overrides merge.** Info and policy pages ship their default copy in code and merge the
stored JSON over it via `mergeInfo()`
([info-content.ts:8](src/lib/info-content.ts#L8)) — any missing field falls back to the
default, so a partial edit is always safe.

**How chrome reads it.** `__root.tsx` prefetches `getAllSettings()` into TanStack Query;
components call `useSiteSettings()` ([src/hooks/use-site-settings.ts](src/hooks/use-site-settings.ts))
plus the `s(section, key, fallback)` and `arr(section, key, fallback)` accessors, which return
the fallback whenever a key is missing or the wrong type. `staleTime` is 60s.

Migration `20260801000000` exists because of exactly this looseness: `homepage.stats` was
seeded as `{n, l}` while the admin editor and the page both use `{value, label}`, so the stats
band rendered four empty cells. The migration rewrites existing rows onto the shared shape.

---

## 11. Live Preview system

The admin panel allows real-time previewing of unsaved content via an iframe. This applies to settings, tours, blogs, and reviews. 

The system has three main parts:
1. **`EditorShell`** (admin side): Renders the edit form on the left and an iframe of the public page on the right. It debounces the form state and sends it into the iframe using `postMessage`. It also handles "Save" and "Discard" actions centrally.
2. **`preview-protocol.ts`**: Defines the strict message types (`PreviewReadyMessage`, `PreviewSettingsMessage`, `PreviewFocusMessage`) so the iframe only listens to trusted sources and rejects unrelated extensions/widgets.
3. **`PreviewBridge`** (public side): A component rendered on every public page but completely inert unless `window.top !== window.self`. When embedded, it announces itself and listens for `settings` messages. Upon receiving one, it calls `queryClient.setQueryData()` to push the draft content directly into the TanStack Query cache. 

Because TanStack Query is the source of truth for the page components, pushing to its cache causes the entire page to re-render with the draft content instantly, without a reload and without writing anything to Supabase. The preview bridge intercepts global settings (`site-settings`) as well as entity-specific overrides (`tour-preview`, `blog-preview`, `reviews-preview`).

---

## 12. SEO subsystem

Four independent pieces:

1. **`/sitemap.xml`** — a server route handler
   ([src/routes/sitemap[.]xml.ts](src/routes/sitemap[.]xml.ts)). Merges 25 hardcoded static
   paths with `listSitemapEntries()`, using each row's `updated_at` as `<lastmod>`. Cached
   `public, max-age=3600`.
2. **`/robots.txt`** — server route handler
   ([src/routes/robots[.]txt.ts](src/routes/robots[.]txt.ts)). Serves
   `site_settings['robots'].content` if non-empty, else a built-in default that disallows
   `/admin` and `/auth` and points at the sitemap. Cached 1h.
3. **`seo_meta` table + `/admin/seo`** — per-entity meta title/description/OG/Twitter/canonical
   plus `focus_keyphrase`, `cornerstone`, `robots_noindex`. The admin screen scores content
   locally with [src/lib/seo-analysis.ts](src/lib/seo-analysis.ts) (`analyzeKeyphrase`,
   `analyzeReadability`, `overallScore`) — no external API.
4. **`redirects` table** — CRUD exists in the admin panel.

Public route `head()` functions currently build their tags from loader data directly (see
[tours.$slug.tsx:88](src/routes/tours.$slug.tsx#L88)), **not** from `seo_meta`. See §16.

---

## 13. Migrations

Applied in filename order. `supabase/config.toml` pins `project_id = "ceuwxvcazqxqjgtcmzhy"`.

| File | What it does |
| --- | --- |
| `20260702171624_…` | `inquiries` table + first public-insert policy |
| `20260705142702_…` | The big one — `app_role`, `user_roles`, `public.has_role`, `set_updated_at`, and all content tables with grants/policies/triggers |
| `20260707140022_…` | Storage policies for `content-images` |
| `20260707145354_…` | Moves `has_role` to the `private` schema, recreates **every** policy against it, drops `public.has_role`, revokes `set_updated_at` |
| `20260708110011_…` | `testimonials.rating` + backfill to 5 |
| `20260709141638_…` | `tours.video_url` |
| `20260712131549_…` | `inquiry_status` enum, `inquiries.status/handled_at/admin_note`, inquiries RLS rework, seeds the six `site_settings` content keys |
| `20260712132333_…` | Replaces the inquiry INSERT policy with the validating `WITH CHECK` version |
| `20260712134557_…` | `testimonials.images text[]` |
| `20260715190508_…` | Data fix: updates `header` phone number via `jsonb_set` |
| `20260717201215_…` | Data fix: rewrites one tour's summary |
| `20260721123746_…` | `seo_meta` + `redirects` tables |
| `20260721124158_…` | Re-declares both with `IF NOT EXISTS` — a **no-op** on any DB where the previous migration ran |
| `20260801000000_…` | Normalizes `homepage.stats` from `{n,l}` to `{value,label}` |
| `20260802000000_…` | `tours.child_price_usd`, `discount_child_price_usd`, `facts jsonb` |
| `20260803000000_…` | Content alignment: renames drifted `hero`/`homepage` keys, seeds `page_*`/`whatsapp`/`homepage_layout` |

The two `20260721` migrations disagree: the first declares `entity_id text` and adds an index;
the second declares `entity_id uuid` with a `CHECK` on `status_code` and different policy
names. Because the second guards with `IF NOT EXISTS`, whichever ran first wins. The generated
types show `entity_id: string`, so the **first** one is what is live. Treat the second file as
dead weight.

Later migrations use `ADD COLUMN IF NOT EXISTS` throughout, so they are safely re-runnable.

---

## 14. Worked end-to-end flows

### A. Visitor submits a trip inquiry

```
InquiryForm (src/components/inquiry-form.tsx)
  └─ useServerFn(submitInquiry) → POST /_serverFn/…
       ├─ csrfMiddleware: same-origin check
       ├─ inputValidator: InquirySchema.parse  ──► 400-ish throw on bad input
       └─ handler
            ├─ await import("@/integrations/supabase/client.server")  (dynamic — keeps
            │   the service-role key out of the browser bundle)
            └─ supabaseAdmin.from("inquiries").insert({...})   [RLS bypassed]
                 └─ error?  → console.error(raw) + throw generic message
                 └─ ok      → { ok: true }
```

The row lands with `status = 'new'`. An admin later loads `/admin/inquiries`
(`adminListInquiries`) and flips status via `adminUpdateInquiry`, which stamps `handled_at`
when the new status is `handled`.

### B. Admin edits a tour

```
/admin/tours/$id  (client route, guarded by _authenticated + admin.tsx)
  └─ loader: adminGetTour({ data: { id } })
       └─ requireSupabaseAuth → assertAdmin → user-scoped select   [RLS: admin sees drafts]
  ── user edits, hits Save ──
  └─ adminUpsertTour({ data: { id, tour } })
       ├─ attachSupabaseAuth (client) adds Bearer token
       ├─ csrf + TourInput.parse
       ├─ requireSupabaseAuth verifies the JWT via auth.getClaims
       ├─ assertAdmin → SELECT user_roles [RLS: users read own roles]
       └─ UPDATE tours ... [RLS: admins manage tours]  → trigger sets updated_at
```

The updated row is immediately visible to the public read path (subject to `is_published`),
and its new `updated_at` shows up in the next `/sitemap.xml` fetch.

### C. Homepage render

```
GET /
  └─ __root loader: ensureQueryData(getAllSettings)      → site_settings, all keys
  └─ index loader:  listPublishedTours()                 → tours WHERE is_published
                    listPublishedTestimonials()
                    listPublishedPosts()
                    listPublishedDestinations()
  └─ component reads useSiteSettings().hero / .homepage with s()/arr() fallbacks
```

Note the index loader awaits its four calls **sequentially**
([index.tsx:38-43](src/routes/index.tsx#L38-L43)), unlike `tours.$slug` which uses
`Promise.all`.

---

## 15. Error handling

Three layers, outermost first:

1. **`src/server.ts`** wraps the whole SSR fetch. h3 swallows in-handler throws into a plain
   500 JSON body `{"unhandled":true,"message":"HTTPError"}`, which a `try/catch` never sees —
   so `normalizeCatastrophicSsrResponse` sniffs for exactly that body, logs the real error
   recovered from `consumeLastCapturedError()`
   ([src/lib/error-capture.ts](src/lib/error-capture.ts)), and returns a rendered HTML error
   page instead of raw JSON.
2. **`errorMiddleware`** in [src/start.ts:6](src/start.ts#L6) catches thrown errors that are
   not already HTTP-shaped (no `statusCode` property) and returns `renderErrorPage()` with a
   500.
3. **Route-level** `errorComponent` / `notFoundComponent`. Detail routes `throw notFound()`
   when a slug misses.

Server function errors surface to the client as thrown `Error`s with the message string.
Supabase errors are re-thrown as `new Error(error.message)` — which means **raw Postgres
error text reaches the browser** for admin functions. That is acceptable behind the admin
gate; `submitInquiry` is the one public write and deliberately does not do this.

---

## 16. Deployment

Two targets from one codebase, switched by the `DOCKER_BUILD` env var in
[vite.config.ts:17](vite.config.ts#L17):

**Lovable (default).** Builds to a Cloudflare Worker target. `vite.config.ts` uses
`@lovable.dev/vite-tanstack-config`, which already bundles `tanstackStart`, `viteReact`,
`tailwindcss`, `tsConfigPaths`, nitro, `VITE_*` env injection and the `@` alias — adding any
of those manually breaks the build with duplicate plugins. Pushes to the connected branch sync
back into the Lovable editor (see [AGENTS.md](AGENTS.md)); do not rewrite published history.

**Docker / self-hosted.** `DOCKER_BUILD=1` switches nitro to the `node-server` preset
outputting to `.output`. [Dockerfile](Dockerfile) is a two-stage `oven/bun:1-slim` build:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=<url> \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key> \
  --build-arg VITE_SUPABASE_PROJECT_ID=<id> \
  -t bangla-quest .

docker run -p 3000:3000 -e SUPABASE_SERVICE_ROLE_KEY=<service-role-key> bangla-quest
```

The service-role key is a **runtime** `-e`, never a build arg — build args are baked into the
image. `VITE_SUPABASE_URL`/`_PUBLISHABLE_KEY` are mirrored to the unprefixed `SUPABASE_*`
names so the server-side clients find them. Serves on `:3000` with a 30s healthcheck.

The SSR entry is redirected to `src/server.ts` via `tanstackStart.server.entry`.

---

## 17. Known gaps and gotchas

These are observations from reading the code, not bugs introduced by this document.

- **`seo_meta` is written but never read by public pages.** `getSeoMeta` and `buildSeoMeta`
  ([src/lib/seo-head.ts](src/lib/seo-head.ts)) are both fully implemented and have zero
  callers outside their own modules. Admins can author meta titles, canonicals and
  `robots_noindex` flags in `/admin/seo`, and none of it reaches the rendered `<head>` —
  routes build tags from loader data instead. Wiring this up means calling `getSeoMeta` in
  each route's loader and passing the result through `buildSeoMeta` in `head()`.
- **`redirects` rows are never served.** `listRedirectsPublic` has no caller; nothing in the
  request pipeline consults the table. Redirects saved in the admin panel do nothing until a
  request middleware is added that looks up `from_path` and returns a 301/302.
- **`SITE_URL` is hardcoded** to `https://bangla-quest-dreams.lovable.app`
  ([seo-head.ts:4](src/lib/seo-head.ts#L4)). Every canonical URL and every `<loc>` in the
  sitemap uses it. It must be changed when a custom domain goes live.
- **`tour_destinations` is dead.** The join table exists with policies and grants; tours link
  to destinations through the `primary_destination_slug` text column instead. No FK, so a
  renamed destination slug silently orphans its tours.
- **Inquiry validation is enforced in two places that disagree.** The Zod schema allows
  `message` to be null/absent, but the RLS `WITH CHECK` requires a non-empty message. This
  never fires today because `submitInquiry` inserts via the service-role client, which
  bypasses RLS entirely — but a message-less inquiry would be rejected if the insert were
  ever moved to the anon client.
- **`category` has no database constraint.** It is `text NOT NULL DEFAULT 'multi-day'`, with
  the enum enforced only by `TourInput` in Zod. `tours.$slug.tsx` additionally tolerates a
  legacy `"day"` value that the Zod enum would reject
  ([tours.$slug.tsx:51](src/routes/tours.$slug.tsx#L51)).
- **Storage objects are never deleted.** Removing an image from a content field drops the URL
  but leaves the object in the bucket.
- **Signed URLs with a 10-year expiry** are stored in content columns even though the bucket
  allows anonymous reads. They will eventually expire, and they are opaque to any CDN
  rewriting.
- **`types.ts` is generated.** So are `client.ts`, `client.server.ts`, `auth-middleware.ts`
  and `auth-attacher.ts` — all five carry a "do not edit directly" header. Regenerate rather
  than hand-patch after a schema change.
- **`attachSupabaseAuth` must stay registered** as a global `functionMiddleware` in
  `src/start.ts`, or the browser silently stops sending bearer tokens and every admin RPC
  fails with `Unauthorized: No authorization header provided`.

---

## 18. Recipe: adding a new backed entity

Say you are adding `guides`.

1. **Migration** — `supabase/migrations/<timestamp>_add_guides.sql`. Copy the standard
   content-table pattern from §7: table with `slug`/`is_published`/`sort_order`/timestamps,
   the three `GRANT`s, the two policies (`public read published guides`,
   `admins manage guides`), and the `set_updated_at` trigger.
2. **Regenerate types** into `src/integrations/supabase/types.ts`.
3. **DTO** — add `GuideDTO` to [src/lib/content-types.ts](src/lib/content-types.ts).
4. **Public reads** — add `listPublishedGuides` / `getGuideBySlug` to
   [src/lib/site-content.functions.ts](src/lib/site-content.functions.ts) with a `toGuide`
   mapper that coerces numerics and defaults null arrays.
5. **Admin API** — add `adminListGuides`, `adminUpsertGuide`, `adminDeleteGuide` to
   [src/lib/admin-content.functions.ts](src/lib/admin-content.functions.ts), each with
   `.middleware([requireSupabaseAuth])`, a Zod `inputValidator`, and `await assertAdmin(context)`
   as the first line of the handler.
6. **Routes** — `src/routes/guides.index.tsx`, `src/routes/guides.$slug.tsx`, and
   `src/routes/_authenticated/admin.guides.tsx`. Add the admin link to the `NAV` array in
   [admin.tsx:18](src/routes/_authenticated/admin.tsx#L18).
7. **Sitemap** — add the table to `listSitemapEntries` and emit its URLs in
   [sitemap[.]xml.ts](src/routes/sitemap[.]xml.ts).
8. **SEO targets** — add it to the four-way `Promise.all` in `adminListAllSeoTargets` so it
   appears in `/admin/seo`.
9. **Dashboard** — add a count query to `adminStats` if it should show on the admin home.
