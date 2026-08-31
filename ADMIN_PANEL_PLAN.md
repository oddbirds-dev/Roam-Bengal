# Replicate the Bangladesh Travel Hub admin panel in Roam Bengal

## Context

`D:\Coding\Bangladesh travel hub` and `D:\Coding\Roam Bengal` are sibling TanStack Start + Supabase
projects with near-identical database schemas (13 tables, same names and columns) and the same
server-function contract. Their admin panels diverged: the reference settled on **one editing
model** applied uniformly to every content type, while Roam Bengal grew three different ones and
left several screens unbuilt.

Concretely, Roam Bengal today:

- has **no Destinations screen** even though `adminListDestinations` / `adminUpsertDestination` /
  `adminDeleteDestination` all exist and the `destinations` table is populated (the functions are
  dead code; only the list feeds the tour editor's dropdown)
- calls the same entities by different names — Posts vs Blogs, Testimonials vs Reviews
- edits FAQs/Activities/Posts/Testimonials in an **inline card above the table**, while Tours gets a
  bespoke full-screen split pane and only the two Settings routes use `EditorShell`. Only the
  Settings routes have an unsaved-changes guard; the tour editor — the one with the most work at
  risk — has none
- duplicates the preview implementation (`usePreviewPane` vs the tour editor's hand-copied
  debounce/ready-listener/`startResize`), the resize implementation, the repeater, and `slugify()`
- reports save state with a static `SavedNote` rather than the reference's transient toasts
- is missing the SEO console's SERP preview, social-card preview, summary stat cards, sitemap tab
  and pages search/type filter
- authors rich text through a ~500-line hand-rolled `contentEditable` in `fields.tsx`

**Outcome:** Roam Bengal's admin gains every screen, nav entry, field, flow and interaction the
reference has, rendered in Roam Bengal's own scrapbook design language, with the internal
duplication collapsed onto one editing model.

## Implementation status — 2026-08-31

The repository was audited against this plan after the earlier partial implementation. Current
status:

- [x] Phase 1 — tokens, shared slug/error/sanitization helpers, toasts and icons.
- [x] Phase 2 — shared list/editor primitives, guarded `EditorShell`, preview channels/focus and
  consolidated draggable/nested repeaters.
- [x] Phase 3 — final nav and inquiry badge, Blogs/Reviews renames, Destinations, unified CRUD
  screens, dashboard/tour-list updates, shared guarded tour preview/save shell, and inquiry details
  with a URL-backed status filter.
- [x] Phase 4 — TipTap editor, custom marks/fonts/colours, tables/link picker/source mode, legacy
  Markdown normalization and the `FormatText` inline regression check. Short inline/list fields
  stay plain because TipTap paragraph wrappers are block-level.
- [x] Phase 5 — extracted content registry, server-side sanitized patching, complete homepage
  field registry, preview anchors, guarded raw editor and legacy standalone-page hydration.
- [x] Phase 6 — stat cards, searchable/type-filtered pages, URL-backed tabs, Sitemap, two-column SEO
  editor with SERP/social previews and checks, missing inputs, toasts and dirty protection.
- [x] Phase 3 follow-up: `blog_posts.author_avatar` now has an `ImageField` control ("Author photo")
  in the blogs editor. It was the last of the plan's "missing inputs" still carrying a value through
  `blank()`/payload with no way to set it. The SEO `twitter_description` / `schema_type` inputs were
  already in place.
- [x] Automated local verification: `npm run typecheck`, `npm run test:rich-text`, `npm run build`,
  and `git diff --check` — all clean as of 2026-08-31.
- [x] Smoke scripts de-seeded. `rls-smoke.mjs` and `auth-smoke.mjs` still hardcoded the seed slug
  `sundarbans-wildlife-tour` and the counts `testimonials === 9` / `adminStats.tours === 9`. Both
  crashed with a null-deref on the current database, which reads like an RLS regression when it is
  only a stale fixture. They now probe whichever tour exists, compare row counts against a
  before/after snapshot taken in the same run, and check `adminStats.tours` against the count an
  admin can actually read — so the assertion is "adminStats tells the truth", which survives content
  changes. This completes the de-seeding already done for `cms-smoke.mjs`.
- [x] Environment-backed verification run 2026-08-31 against the hosted project with `npm run dev`
  on port 3000: `test:users:seed` clean · **`test:admin` 27/27** · **`test:cms` 18/20** ·
  **`test:rls` 9/9** · **`test:auth` 16/16** · `test:users:teardown` clean (also swept 3 smoke
  inquiries).
- [ ] **`test:cms`'s two blog assertions still fail, and this is a real user-facing bug, not a test
  artifact.** Every save from `/admin/blogs` returns `400 Could not find the 'related_slugs' column
  of 'blog_posts' in the schema cache`, because the migration adding that column is unapplied — see
  "Pending migrations" under Verification. No code change is warranted: `PostInput`, the editor's
  `RelatedContentField`, `post-dto.ts` and the public `/blog/<slug>` related-posts block are all
  written against the intended post-migration schema. Apply the migration and re-run `test:cms`.
- [ ] Manual `/admin` walkthrough (step 3 below) — not yet performed.

One non-behavioural cleanup remains optional: the tour editor uses the new typed
`src/components/admin/tour-form.tsx` shell, but its Roam-specific field composition remains in the
route file. Moving those field sections verbatim would reduce route length without changing the
implemented editing model.

## Decisions already made

| Question | Answer |
|---|---|
| Visual fidelity | **Same structure, Roam's look.** Keep `admin-ui.tsx` + the `@theme` tokens (paper/rule/ink/green/mint/cream/rust). No Radix, no shadcn. |
| Nav | **Match the reference exactly, and keep Links.** Add Destinations; rename Posts→Blogs, Testimonials→Reviews. |
| Rich text | **Port TipTap**, replacing the hand-rolled `RichTextEditor`. |

Two judgement calls that follow from those, flagged rather than asked:

- **Toasts** — the reference uses `sonner` on every save/delete/error. Rather than add the
  dependency, hand-roll a ~90-line `Toaster` + `toast` in `admin-ui.tsx` using Roam's tokens, the
  way `AdminModal` is already hand-rolled. `ErrorBanner` stays for inline validation errors.
- **Do not regress where Roam is ahead.** Roam's tour editor, settings schema and rich-text editor
  are all *richer* than the reference's. `seo_meta` is already wired into `tours.$slug` / `blog.$slug`
  `head()` in Roam and is **not** wired in the reference (BACKEND.md §17 claims otherwise — it is
  stale). Nothing below removes a Roam capability to match a reference limitation.

---

## Phase 1 — Foundations

**Design tokens.** Add to `src/styles/app.css` `@theme`: `--color-admin-bg: #F6F8F6`,
`--spacing-sidebar: 13.75rem`, `--spacing-sidebar-collapsed: 4.75rem`. Replace the magic
`bg-[#F6F8F6]` / `w-55` / `w-19` / `lg:left-55` values duplicated across
[_authenticated.admin.tsx](src/routes/_authenticated.admin.tsx),
[editor-shell.tsx](src/components/admin/editor-shell.tsx) and
[_authenticated.admin.tours.$id.tsx](src/routes/_authenticated.admin.tours.$id.tsx).

**`src/lib/slugify.ts`** — one export, replacing the verbatim copy in
`_authenticated.admin.activities.tsx`, `_authenticated.admin.posts.tsx` and
`_authenticated.admin.tours.$id.tsx`.

**`src/lib/utils.ts`** — add `getErrorMessage(e, fallback)`, reusing the Zod-issue unwrapping that
currently lives privately as `readableError` in `admin-ui.tsx`. Delete the empty `src/lib/utils/`
directory.

**`src/lib/sanitize.ts`** — add `deepStripUnsafeHtml<T>(value: T): T` (port from the reference,
lines 60–77) and call it in `adminSaveSetting` / the new `adminPatchSetting`, so every rich-text
field nested anywhere in a `site_settings` JSON blob is hardened on write.

**Toasts.** Add `Toaster` + `toast.success/error` to `admin-ui.tsx`; mount `<Toaster />` once in
`_authenticated.admin.tsx`.

**Icons.** `AdminIcon` in [icons.tsx](src/components/admin/icons.tsx) needs new glyphs for the
screens below: `pin` (already present), `sparkles`, `trash`, `pencil`, `arrowLeft`, `grip`,
`table`, `quote`, `listBullet`, `listOrdered`. Its silent fallback to `dashboard` on an unknown
name should become a dev-time `console.warn`.

## Phase 2 — One editing model

This is the core of the replication and everything else builds on it.

**Extend `admin-ui.tsx`** with the reference's `ui.tsx` primitives, written against Roam's tokens:

| New export | Reference source | Notes |
|---|---|---|
| `AdminPage({title, subtitle, action, children})` | `ui.tsx:16` | replaces the bare `PageHeader` usage on list screens |
| `ListTable({head, children, footNote})` | `ui.tsx:116` | wrap the existing `Table`; auto-append the empty actions `<th>` |
| `StatusBadge({tone, children})` | `ui.tsx:102` | map `published/draft/accent/muted` onto the existing `Badge` tones |
| `EmptyState({children})` | `ui.tsx:227` | replaces `Table`'s hardcoded "Nothing here yet." |
| `ViewPublicLink({href, children})` | `ui.tsx:79` | every list page gets one in the footer |
| `ConfirmButton({title, description, confirmLabel, onConfirm, children})` | `ui.tsx:236` | **replaces `DeleteButton`** — a real dialog (via the existing `AdminModal`) that can say what is about to be lost. Cancel reads "Keep it". |
| `Field({label, help, htmlFor, className, children})` | `ui.tsx:181` | |

`DeleteButton`'s two-step arm/confirm goes away; `ConfirmButton` supersedes it everywhere.

**Rework [editor-shell.tsx](src/components/admin/editor-shell.tsx)** into the single chrome for
*all* editors. It already has `useBlocker`, the localStorage preview preference and
`react-resizable-panels`; it needs:

- `onBack?: () => void` alongside the existing `backTo` link, so a list screen can toggle
  list↔form in place (the reference's pattern, `editor-shell.tsx:81-97`)
- `previewAnchor?: string` passed through to the preview pane
- to stop being `fixed inset-0 top-14` and instead fill the shell's `<main>` — see below

**`_authenticated.admin.tsx`**: make `<main>` `relative` so a full-height editor can use
`absolute inset-0` instead of recomputing the sidebar offset. This is what lets the tour editor
drop its `useSidebarCollapsed` + `lg:left-19`/`lg:left-55` arithmetic entirely.

**Delete the duplicate preview implementation.** `_authenticated.admin.tours.$id.tsx` re-implements
the debounce effect, the ready listener and `startResize` inline. Point it at `usePreviewPane` /
`PreviewDivider` / `PreviewPane` in [preview-pane.tsx](src/components/admin/preview-pane.tsx) —
or, once it uses `EditorShell`, at nothing at all, since `EditorShell` owns the split.

**Preview channels.** [src/lib/preview.ts](src/lib/preview.ts)'s `createDraftChannel<T>(kind)`
already generalises this. Add channels for `destination`, `activity` and `faq` to match the
reference's `_destination` / `_activity` / `_faq` overrides, plus a `focus` message type that
scrolls the iframe to `#anchor` and flashes a 3px outline for 1200ms
(reference: `preview-bridge.tsx`).

**Consolidate the repeaters.** `RepeaterField` (arrow buttons) and `DraggableRepeaterField`
(dnd-kit) in [fields.tsx](src/components/admin/fields.tsx) do the same job. Keep the draggable one,
re-export `RepeaterField` as an alias, and add the reference `ListEditor`'s two behaviours it
lacks: columns derived from the schema rather than the first stored row (so an empty list is still
editable), and **recursive nesting** for list-of-list fields.

## Phase 3 — Screens: rename, add, align

**Nav** in `_authenticated.admin.tsx` becomes exactly:

```
Overview      Dashboard /admin · Inquiries /admin/inquiries  (badge: stats.newInquiries)
Your content  Tours /admin/tours · Destinations /admin/destinations · Activities /admin/activities
              · Blogs /admin/blogs · Reviews /admin/reviews · FAQs /admin/faqs
Your website  Site content /admin/settings · SEO /admin/seo · Links /admin/links
```

Remove the "Destinations is deliberately omitted" comment. Add the reference's **inquiry badge on
the layout loader** (`loader: () => adminStats()`, `staleTime: 60_000`) so the count shows on every
admin page, not just the dashboard — collapsed sidebar shows it as a corner dot.

**Renames** (URL changes, so update `routeTree.gen.ts` by running the dev server, plus every
`to="/admin/posts"` / `to="/admin/testimonials"` reference and the smoke scripts):

- `_authenticated.admin.posts.tsx` → `_authenticated.admin.blogs.tsx` (`/admin/blogs`)
- `_authenticated.admin.testimonials.tsx` → `_authenticated.admin.reviews.tsx` (`/admin/reviews`)

**New: `_authenticated.admin.destinations.tsx`.** Straight port of the reference's
`admin.destinations.tsx` — the cleanest template for the whole pattern. Fields: Name (auto-slugs
until the slug is touched), Web address, Tagline, Region, Best time to visit, Order, Photo
(`ImageField`), Introduction, Highlights (one per line), Show on the website. Server functions
already exist and need no change. Roam has no public `/destinations` route, so
`previewPath` is `/` with `previewAnchor: "section-gallery"` — the homepage photo grid is what
destination images actually feed (`src/components/home/registry.ts:57`). Add a `ViewPublicLink`
to `/` rather than a dead `/destinations` link.

**Convert the five CRUD screens to the reference shape.** `faqs`, `activities`, `blogs`, `reviews`,
`destinations` all become:

```tsx
const [editingId, setEditingId] = useState<string | null>(null);
if (editingId !== null) return <RowForm row={rows.find(r => r.id === editingId)} onBack={...} />;
return <AdminPage title action={<New…>}>{rows.length ? <ListTable/> : <EmptyState/>}<ViewPublicLink/></AdminPage>;
```

`RowForm` holds local `v` state, a `useMemo` field-by-field `dirty`, `reset()`, and `save()` /
`remove()` that each end in `router.invalidate()` → `toast` → **`onBack()`**. That trailing
`onBack()` is not cosmetic: without it, deleting from inside the form leaves the form mounted and
a subsequent save resurrects the row (`ADMIN_PANEL_REVIEW.md` #1).

Per-screen field lists are in the reference's table (§6). Two Roam-specific notes: Blogs stores
`body` as `string[]` — load `(row.body ?? []).join("\n\n")`, save `v.body.trim() ? [v.body] : []`;
and Roam's Reviews screen has extra fields (platform, tour label, headline, gallery) the reference
lacks — keep them all.

**Missing inputs to add while in there:** `blog_posts.author_avatar` (in `blank()`/`hydrate()`,
no control) and the SEO modal's `twitter_description` + `schema_type` (in state and payload,
no controls).

**Dashboard** — add a Destinations tile (`adminStats` needs a `destinations` count). Fix the
highlight predicate: `stats.newInquiries > 0` only; an empty inbox should not read as urgent.

**Tours list** — add the reference's footNote about deletion being permanent, `ViewPublicLink`,
`EmptyState`, and replace `window.open("/tours")` with the anchor. Roam already serves
`/admin/tours/new` through `$id === "new"`; that matches the reference URL, so no new route file.

**Tour editor** — extract the form body from the 1109-line
`_authenticated.admin.tours.$id.tsx` into `src/components/admin/tour-form.tsx`, mirroring the
reference's split, and render it inside `EditorShell`. **Every existing section stays** (SectionPicker,
price tiers, trip facts, itinerary, offers, advice, tour FAQs, related content) — this is a
re-housing, not a reduction. It gains `useBlocker`, the shared save bar, and the shared preview.
Also fold `adminSetTourThemes` into the save path's error handling so a theme failure doesn't
silently leave the tour saved with stale themes.

**Inquiries** — add the reference's "Show details" toggle revealing Destination, Tour, Travellers,
Travel dates and Budget. All five columns exist in the table and are currently never displayed.
Move the filter from `useState` to a URL search param so refresh and back preserve it. Swap
`DeleteButton` → `ConfirmButton`.

## Phase 4 — TipTap rich text

**Dependencies:** `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`,
`@tiptap/extension-placeholder`, `marked`.

**New `src/lib/tiptap-rich-marks.ts`** — port the reference's `classSpanMark` factory, but with
Roam's palette: `FONT_OPTIONS` from `--font-display/-body/-script/-marker/-kalam` **plus the
families read from the `custom_fonts` setting** (`src/lib/custom-fonts.ts`), and `COLOR_OPTIONS`
from `text-green`, `text-orange`, `text-accent`, `text-rust`, `text-muted`. Keep Roam's arbitrary
hex colour as a second `style`-based mark so the existing `<input type=color>` control survives.

**New `src/components/admin/rich-textarea.tsx`** — port `rich-textarea.tsx` (435 lines) in Roam's
styling, with `AdminIcon` in place of lucide and Roam's existing `LinkPicker` for the link flow
(the reference's `getMarkRange` edit/insert branch ports as-is). Toolbar keeps Roam's extras:
custom-font list, hex colour, view-source toggle.

**Storage format.** The reference stores `editor.getHTML()` and normalises legacy content once on
load with `marked.parse(value)`. This works in Roam unchanged because
[format-text.tsx](src/components/ui/format-text.tsx)'s `markdown-to-jsx` renders raw HTML on
purpose and applies its `a → SmartLink` / `strong` overrides to HTML tags too. **Verify explicitly**
that `FormatText`'s `forceInline: true` path still behaves for the short fields (headings, list
items, table cells) once they contain `<span>`s — if it does not, those fields stay on the plain
`TextArea`, which is what `plain` is already for.

**Retire** `RichTextEditor`, `sourceToHtml`, `htmlToSource` and the ~350 lines of caret/selection
machinery from `fields.tsx`. `TextArea` keeps delegating to the editor unless `plain` is passed.

## Phase 5 — Settings & content schema

**Extract the registry.** `settings-form.tsx` is 1341 lines of data and rendering mixed together.
Move the data — `SettingsField`, `SettingsSection`, `SettingsSchema`, `SETTINGS_SCHEMA`,
`SETTINGS_ORDER`, `PAGE_SETTINGS_ORDER`, `HOMEPAGE_SECTION_FIELDS`, the icon option sets, the
`pageSchema` factory and the `as*` coercion helpers — into **`src/lib/content-schema.ts`**, matching
the reference's separation. `settings-form.tsx` keeps only `SettingsSections`, `FieldControl`,
`mergeSetting`, `hydrateSetting`. This is a mechanical move; no behaviour changes.

While moving, add the two `ContentGroupDef` fields the reference has and Roam lacks:
`previewAnchor` (wire into `EditorShell` → preview `focus` message) and `where` used as a chip on
the hub cards.

**New server function `adminPatchSetting`** in `admin-content.functions.ts` — read-merge-write
(`{...base, ...patch}`) server-side, `deepStripUnsafeHtml` on the way in. `settings.$group` and
`settings.homepage-sections` switch to it. Roam's current shallow client-side `mergeSetting`
relies on the loader's copy being fresh; a server-side merge is what makes two screens editing
different slices of the `homepage` row safe.

**Fill in `HOMEPAGE_SECTION_FIELDS`** — 3 of 8 sections have entries; the reference covers 15 of 16.
Add field definitions for the remaining Roam sections (`popular`, `gallery`, `reviews`, `whyChooseUs`,
`dreamCta`) reading the keys the components actually consume in `src/components/home/*.tsx`.

*Resolved 2026-08-31:* `HOMEPAGE_SECTION_FIELDS` now covers `features`, `popularTours`, `faith`,
`journal`, `whyChooseUs` and `dreamCta`. `gallery` and `reviews` are **deliberately excluded** — they
are rich enough to own their own `site_settings` rows, so `HOME_SECTION_SETTINGS_KEY`
(`src/components/home/registry.ts:94`) routes them to `/admin/settings/gallery` and
`/admin/settings/reviews`, and the builder renders a `Link` to that group in place of the inline
expander when a section has no nested fields. Every section is editable; two just editing elsewhere.

**Raw JSON editor** (`RawEditor` in `settings.$group.tsx`) gets wrapped in `EditorShell` so it has
the same unsaved-changes guard as the schema path.

**Legacy `sections[]` → `body` migration on read** for `info_*`/`policy_*` rows, matching the
reference's `withStandaloneBody()`, so old rows open styled rather than blank in the new editor.

**Fixed 2026-08-31 — the standalone pages had no preview.** Two independent faults, both needed:

1. `pageSchema()` passed its `path` argument to `where` (the hub-card chip added in this phase) but
   never to `previewPath`. `EditorShell` guards the preview pane, the divider *and* the toggle button
   on `previewPath`, so all eleven `info_*` / `policy_*` editors rendered with no preview UI at all.
   Now sets `previewPath: path` as well.
2. Even with that, the preview would have shown saved content frozen. `settingsPreviewChannel` is
   wired into `useSiteSettings()`, whose comment claimed "every public page already calls
   `useSiteSettings()`, so wiring the channel in here, once, reaches all of them for free". That was
   untrue for exactly these pages: `$infoSlug.tsx` and `policies.$slug.tsx` read their keyed row
   straight off the root loader (`stored?.[`info_${slug}`]`) and never touched the channel. Added
   `useSettingGroup(key, defaults)` to `use-site-settings.ts` — same merge, with the draft applied —
   and pointed both routes at it. The misleading comment is corrected in place.

## Phase 6 — SEO console

Bring `_authenticated.admin.seo.tsx` to the reference's shape:

- **Four stat cards** above the tabs: Pages, Missing meta description (red when > 0), Missing
  keyphrase (red when > 0), Cornerstone.
- **Pages tab** — add the search box (title or slug) and the entity-type `<select>`
  (All / Tours / Destinations / Blog posts / Activities).
- **Fifth tab: Sitemap** — informational, links `/sitemap.xml`, shows the dynamic page count.
- **Editor** — reshape `SeoEditModal` into the reference's two-column sheet: form on the left,
  and on the right a **Google SERP preview**, a **social card preview** (1200/630, host from
  `new URL(url).host`), and the two `ChecksList` panels. `analyzeKeyphrase` / `analyzeReadability` /
  `overallScore` in [seo-analysis.ts](src/lib/seo-analysis.ts) are already identical to the
  reference's — only the presentation is missing. Add dirty tracking + the unsaved guard, which the
  reference itself lacks here.
- Add the missing `twitter_description` and `schema_type` inputs.
- Move tab state to a URL search param.

**Out of scope, stated plainly:** `redirects` rows are still never served by either project — no
request middleware consults the table. Wiring that is a public-site change, not an admin-panel one.
The dead `adminListSubscribers` / `adminDeleteSubscriber` pair stays dead; the reference has no
subscribers screen to replicate.

---

## Files touched

**New:** `src/lib/content-schema.ts`, `src/lib/slugify.ts`, `src/lib/tiptap-rich-marks.ts`,
`src/components/admin/rich-textarea.tsx`, `src/components/admin/tour-form.tsx`,
`src/routes/_authenticated.admin.destinations.tsx`

**Renamed:** `_authenticated.admin.posts.tsx` → `.blogs.tsx`,
`_authenticated.admin.testimonials.tsx` → `.reviews.tsx`

**Heavily edited:** `src/components/admin/admin-ui.tsx`, `editor-shell.tsx`, `fields.tsx`,
`settings-form.tsx`, `src/routes/_authenticated.admin.tsx`, `.tours.$id.tsx`, `.seo.tsx`,
`.faqs.tsx`, `.activities.tsx`, `.inquiries.tsx`, `.settings.$group.tsx`,
`.settings.homepage-sections.tsx`, `src/lib/admin-content.functions.ts`, `src/lib/admin.functions.ts`,
`src/lib/preview.ts`, `src/lib/sanitize.ts`, `src/styles/app.css`

**Reference files to port from** (`D:\Coding\Bangladesh travel hub`): `src/components/admin/ui.tsx`,
`editor-shell.tsx`, `field-editor.tsx`, `list-editor.tsx`, `rich-textarea.tsx`, `live-preview.tsx`,
`src/lib/tiptap-rich-marks.ts`, `src/lib/content-schema.ts`,
`src/routes/_authenticated/admin.destinations.tsx`, `admin.seo.tsx`

---

## Verification

Run after each phase, not just at the end.

1. **`npm run typecheck`** — clean.

   *(Clarified 2026-08-31: `types.ts` is not stale **relative to the hosted database** — regenerating
   and diffing the `public` schema column-by-column produces no differences, and the only lines a
   fresh generation adds are the `storage` and `graphql_public` schemas the checked-in file
   deliberately trims. The real problem is one level down: **the hosted database is behind
   `supabase/migrations/`.** See "Pending migrations" below. Regenerating types will not fix that and
   is not a useful prerequisite; applying the migrations is. Note also that `types:gen` redirects
   with `>`, so if `supabase` is not on `PATH` it truncates `types.ts` to zero bytes before failing —
   generate to a temp file and move it.)*

   **Pending migrations (blocking, discovered 2026-08-31).** Two of the five files in
   `supabase/migrations/` have been applied to the hosted project (`tours.price_tiers`,
   `tours.hidden_sections` are both live); three have not:

   | Migration | Effect | Consequence of it being unapplied |
   |---|---|---|
   | `20260806000000_blog_posts_related_slugs.sql` | adds `blog_posts.related_slugs text[]` | **Hard breakage.** `PostInput` defaults the field and the blogs editor renders a `RelatedContentField` for it, so PostgREST rejects *every* blog save with `400 Could not find the 'related_slugs' column of 'blog_posts' in the schema cache`. This is what fails `test:cms`'s two blog assertions. |
   | `20260819000000_drop_tours_summary.sql` | drops `tours.summary` | Harmless but untidy — no code in `src/` references the column. |
   | `20260819010000_tours_overview_single_field.sql` | flattens `tours.overview` from `jsonb` to `text` | Silent data-shape drift. The code treats overview as text (`optionalText(8000)` at `admin-content.functions.ts:149`, `text(row.overview)` at `tour-dto.ts:51`) while the column is still `jsonb`, so values round-trip as JSON-quoted strings rather than plain text. No test catches it. |

   Apply these in the Supabase SQL editor (or via `supabase db push`) before treating the
   environment-backed run below as meaningful.
2. **`npm run dev`** (port 3000), then in a second shell:
   - `npm run test:users:seed`
   - **`npm run test:admin`** — the API-contract suite. Must stay green; it asserts 401/403 for
     non-admins on every mutation and the draft-tour visibility lifecycle.
   - **`npm run test:cms`** — the payload-shape suite. Two assertions **will** need updating and
     should be updated deliberately, not silently: it hardcodes `adminListSettings().length === 12`
     and the seed counts `tours 9 / posts 9 / testimonials 9 / faqs 6 / activities 5`.
   - `npm run test:users:teardown`
3. **Manual walkthrough at `/admin`**, one pass per phase:
   - every nav item resolves; the inquiry badge shows on a non-dashboard page; collapsed sidebar
     shows the badge as a corner dot; sub-nav expands under Site content
   - **Destinations**: create → appears in the tour editor's Primary destination dropdown → edit →
     the homepage gallery preview updates as you type → delete
   - **Unsaved-changes guard**: edit any field on each of Tours / Blogs / Reviews / FAQs /
     Activities / Destinations / Settings, then navigate away — the confirm must fire. This is the
     single clearest signal that Phase 2 landed.
   - **Delete-then-save**: open a row's editor, delete from inside it, confirm you land back on the
     list and the row does not reappear.
   - **Rich text**: open an existing `info_*` page and a blog body — legacy markdown must render
     styled, not as literal source. Save, reload the public page, confirm it renders identically.
     Check a short `FormatText` field (a heading, a list item) for the `forceInline` caveat above.
   - **SEO**: SERP + social previews update live; score badge matches the checks; save → reopen →
     values persisted.
4. **`npm run test:rls`** and **`npm run test:auth`** — unchanged by this work, but they are the
   guard that no server-function signature drifted.
