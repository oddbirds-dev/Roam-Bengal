import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { marked } from "marked";
import { z } from "zod";
import {
  AdminButton,
  ErrorBanner,
  useAction,
} from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { TourFormShell } from "@/components/admin/tour-form";
import {
  AddButton,
  GroupedListField,
  inputBase,
  KeyValueField,
  Label,
  NumberField,
  RelatedContentField,
  reorder,
  RepeaterField,
  RowControls,
  SelectField,
  StringListField,
  TextArea,
  TextField,
  Toggle,
} from "@/components/admin/fields";
import { RichTextarea } from "@/components/admin/rich-textarea";
import { GalleryField, ImageField } from "@/components/admin/image-upload";
import { invalidateLinkTargets } from "@/components/admin/link-picker";
import {
  adminGetTour,
  adminListActivities,
  adminListDestinations,
  adminListFaqs,
  adminSetTourThemes,
  adminUpsertTour,
} from "@/lib/admin-content.functions";
import { adminSaveSeoMeta, getSeoMeta } from "@/lib/seo.functions";
import { listTourThemes } from "@/lib/site-content.functions";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  setSectionHidden,
  TOUR_SECTIONS,
  type TourSectionId,
} from "@/lib/tour-sections";
import {
  TOUR_FACT_DEFAULTS,
  TOUR_FACT_KEYS,
  TOUR_FACT_KEYS_EXTRA,
  TOUR_FACT_META,
  type TourCategory,
} from "@/lib/content-types";
import { toTourDTO } from "@/lib/tour-dto";
import { tourPreviewChannel } from "@/lib/tour-preview";
import { slugify } from "@/lib/slugify";

const GLANCE_SEPARATOR_PATTERN = /\s+(?:—|–|-|\|)\s+/;

export const Route = createFileRoute("/_authenticated/admin/tours/$id")({
  // Only consulted for a brand-new tour — picks which category the "+ New tour" link
  // pre-selects so single-day and multi-day both land on an already-correct form.
  validateSearch: z.object({ category: z.enum(["day-tour", "multi-day"]).optional() }),
  loader: async ({ params }) => {
    const isNew = params.id === "new";
    const [tour, activities, destinations, themes, siteFaqs] = await Promise.all([
      isNew ? Promise.resolve(null) : adminGetTour({ data: { id: params.id } }),
      adminListActivities(),
      adminListDestinations(),
      listTourThemes(),
      adminListFaqs(),
    ]);
    // A brand-new tour has no id yet, so there is nothing to look up an SEO row by.
    const seoMeta = tour
      ? await getSeoMeta({ data: { entity_type: "tour", entity_id: tour.id } })
      : null;
    return { tour, activities, destinations, themes, siteFaqs, isNew, seoMeta };
  },
  component: TourEditorRoute,
});

/** Keyed by `$id` so switching tours (via the list, or list → list) remounts the editor
 *  instead of reusing the instance — otherwise `useAction`'s error/busy state and the
 *  form's local state would leak from whichever tour was open before. */
function TourEditorRoute() {
  const { id } = Route.useParams();
  return <TourEditor key={id} />;
}

/** Mirrors the `TourInput` Zod schema in admin-content.functions.ts. */
function emptyTour() {
  return {
    slug: "",
    title: "",
    // Widened deliberately: `as const` would pin the field to "multi-day" and make the
    // category <select> unassignable.
    category: "multi-day" as TourCategory,
    hero_image: "",
    images: [] as string[],
    duration_label: "",
    duration_days: 1,
    price_usd: null as number | null,
    price_bdt: null as number | null,
    discount_price_usd: null as number | null,
    child_price_usd: null as number | null,
    discount_child_price_usd: null as number | null,
    price_note: "",
    price_tiers: [] as {
      label: string;
      persons: number | null;
      price: number | null;
      note: string;
      badge: string;
    }[],
    rating: null as number | null,
    reviews_count: 0,
    destination_label: "",
    activity_label: "",
    primary_destination_slug: "",
    is_featured: false,
    activities_count: null as number | null,
    group_size_max: null as number | null,
    stops_count: null as number | null,
    // A new tour starts on the house defaults so the fact grid is filled in from the
    // first save; every field stays editable, and clearing one leaves it out of the grid.
    facts: { ...TOUR_FACT_DEFAULTS } as Record<string, string>,
    overview: "",
    overview_tip: "",
    highlights: [] as string[],
    glance: [] as { when: string; detail: string }[],
    addons: [] as { icon: string; title: string; detail: string }[],
    itinerary: [] as { day: number; title: string; detail: string }[],
    offers: [] as { title: string; items: string[] }[],
    inclusions: [] as string[],
    exclusions: [] as string[],
    accessibility: [] as { label: string; detail: string }[],
    advice: [] as { title: string; items: string[] }[],
    pledge: [] as string[],
    why_items: [] as string[],
    faqs: [] as { question: string; answer: string }[],
    map_embed: "",
    video_url: "",
    related_slugs: [] as string[],
    related_post_slugs: [] as string[],
    // Editor-only: mirrors the tour's `seo_meta` row (a separate table, keyed by
    // entity_type/entity_id), not a `tours` column. See save() and the loader's seoMeta.
    meta_title: "",
    meta_description: "",
    is_published: false,
    sort_order: 0,
    // Which sections of this form the tour hides. Editor-only — see lib/tour-sections.ts.
    hidden_sections: [] as string[],
  };
}

type TourForm = ReturnType<typeof emptyTour>;

/** Everything the Discard button has to put back, and the basis for the dirty check. */
interface EditorState {
  form: TourForm;
  themeIds: string[];
}

function TourEditor() {
  const { tour, activities, destinations, themes, siteFaqs, isNew, seoMeta } =
    Route.useLoaderData();
  const { category: newCategory } = Route.useSearch();
  const navigate = useNavigate();
  const { run, busy, error } = useAction();
  // Fixed positioning takes this pane out of the shell's padded main column, so the
  // sidebar's collapsed state — set from within the shell — has to be read independently
  // to keep the left offset from leaving a gap (or clipping) against the actual rail width.

  // A brand-new tour starts from the template set in Site content → Tour editor template.
  // An existing tour uses whatever it was saved with, so changing the template later never
  // reshapes tours that are already written.
  const { tour_editor } = useSiteSettings();

  const [form, setForm] = useState<TourForm>(() => ({
    ...emptyTour(),
    ...(newCategory ? { category: newCategory } : {}),
    ...(tour ? hydrate(tour) : { hidden_sections: [...tour_editor.hidden_sections] }),
    ...(seoMeta
      ? { meta_title: seoMeta.meta_title ?? "", meta_description: seoMeta.meta_description ?? "" }
      : {}),
  }));
  const [themeIds, setThemeIds] = useState<string[]>(() => {
    if (!tour) return [];
    const slugs = themes[tour.slug] ?? [];
    return activities.filter((a) => slugs.includes(a.slug)).map((a) => a.id);
  });
  const [highlightsDocument, setHighlightsDocument] = useState(() =>
    serializeInlineLines(form.highlights),
  );
  const [glanceDocument, setGlanceDocument] = useState(() => serializeGlance(form.glance));
  const [adviceDocument, setAdviceDocument] = useState(() => serializeAdvice(form.advice));
  const [whyDocument, setWhyDocument] = useState(() => serializeInlineLines(form.why_items));

  const set = <K extends keyof TourForm>(key: K, value: TourForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isDayTour = form.category === "day-tour";

  /** Editor-only visibility. The public page renders from content, so a hidden section
   *  that still holds something keeps showing on the site — which is what the warning
   *  beside its toggle says. */
  const shows = (id: TourSectionId) => !form.hidden_sections.includes(id);

  // Which titled sections are expanded. A new tour opens everything, since there is
  // nothing yet to collapse and every field needs to be reachable while first filling
  // it in; an existing tour opens only sections that already have content, so a mature
  // tour is not one long scroll of empty accordions.
  const [openSections, setOpenSections] = useState<Record<TourSectionId, boolean>>(() =>
    Object.fromEntries(
      TOUR_SECTIONS.map((s) => [s.id, isNew || s.hasContent(form, themeIds.length)]),
    ) as Record<TourSectionId, boolean>,
  );
  const toggleSection = (id: TourSectionId) =>
    setOpenSections((o) => ({ ...o, [id]: !o[id] }));

  // Accommodation/arrival/departure are rarely needed for a single-day tour, so they
  // start collapsed — unless the tour already has one set, in which case hiding it would
  // bury existing content behind an extra click.
  const [showExtraFacts, setShowExtraFacts] = useState(() =>
    TOUR_FACT_KEYS_EXTRA.some((key) => Boolean(form.facts[key])),
  );

  // Dirty tracking compares against the last committed state rather than a boolean flag,
  // so undoing an edit by hand correctly reports "Everything is saved" again.
  const [baseline, setBaseline] = useState(() => serialize({ form, themeIds }));
  const current = useMemo(() => serialize({ form, themeIds }), [form, themeIds]);
  const dirty = current !== baseline;

  // The preview renders the *unsaved* form, mapped through the same row → DTO function
  // the public loader uses, so what the pane shows is what saving would produce.
  const draftTour = useMemo(
    () => toTourDTO({ ...form, id: tour?.id ?? "preview" }),
    [form, tour?.id],
  );
  function discard() {
    const previous = JSON.parse(baseline) as EditorState;
    setForm(previous.form);
    setThemeIds(previous.themeIds);
    setHighlightsDocument(serializeInlineLines(previous.form.highlights));
    setGlanceDocument(serializeGlance(previous.form.glance));
    setAdviceDocument(serializeAdvice(previous.form.advice));
    setWhyDocument(serializeInlineLines(previous.form.why_items));
  }

  // Only the SEO title/description are edited here; every other seo_meta column (focus
  // keyphrase, OG/Twitter, robots, cornerstone, schema type — all set at /admin/seo) is
  // carried over unchanged so this compact editor can never clobber them.
  async function saveSeoMeta(tourId: string) {
    const wantsSeo = form.meta_title.trim() !== "" || form.meta_description.trim() !== "";
    if (!seoMeta && !wantsSeo) return true;
    const saved = await run(() =>
      adminSaveSeoMeta({
        data: {
          entity_type: "tour",
          entity_id: tourId,
          focus_keyphrase: seoMeta?.focus_keyphrase ?? null,
          extra_keyphrases: seoMeta?.extra_keyphrases ?? [],
          synonyms: seoMeta?.synonyms ?? [],
          meta_title: form.meta_title.trim() || null,
          meta_description: form.meta_description.trim() || null,
          canonical_url: seoMeta?.canonical_url ?? null,
          og_title: seoMeta?.og_title ?? null,
          og_description: seoMeta?.og_description ?? null,
          og_image: seoMeta?.og_image ?? null,
          twitter_title: seoMeta?.twitter_title ?? null,
          twitter_description: seoMeta?.twitter_description ?? null,
          twitter_image: seoMeta?.twitter_image ?? null,
          robots_noindex: seoMeta?.robots_noindex ?? false,
          cornerstone: seoMeta?.cornerstone ?? false,
          schema_type: seoMeta?.schema_type ?? null,
        },
      }),
    );
    return Boolean(saved);
  }

  async function save() {
    const payload = { ...form, slug: form.slug.trim() || slugify(form.title) };
    const result = await run(() =>
      adminUpsertTour({ data: { ...(tour ? { id: tour.id } : {}), tour: payload as never } }),
    );
    if (!result) return;

    const linked = await run(() =>
      adminSetTourThemes({ data: { tourId: result.id, activityIds: themeIds } }),
    );
    if (!linked) return;

    if (!(await saveSeoMeta(result.id))) return;

    setForm((f) => ({ ...f, slug: payload.slug }));
    setBaseline(serialize({ form: payload, themeIds }));
    // The link picker caches its list per session; `router.invalidate()` doesn't reach it.
    invalidateLinkTargets();
    // A new tour lives at a placeholder route until it has an id.
    if (isNew) await navigate({ to: "/admin/tours/$id", params: { id: result.id } });
  }

  return (
    <TourFormShell
      title={isNew ? "New tour" : "Edit tour"}
      blurb={isNew ? "Fill in the basics; you can add detail after saving." : form.title || "Untitled tour"}
      previewPath={`/tours/${previewSlug(form)}`}
      previewChannel={tourPreviewChannel}
      previewDraft={draftTour}
      dirty={dirty || isNew}
      saving={busy}
      onSave={() => void save()}
      onDiscard={discard}
      backTo="/admin/tours"
      backLabel="Tours"
    >
      <div>
        {error ? <ErrorBanner error={error} /> : null}
        <div className="mt-8 flex flex-col gap-8 pb-10">
              <FormSection>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Title"
                    required
                    value={form.title}
                    onChange={(v) => set("title", v)}
                    placeholder="Sundarbans Wildlife Tour"
                  />
                  <TextField
                    label="Slug"
                    required
                    hint="URL key. Leave blank to derive it from the title."
                    value={form.slug}
                    onChange={(v) => set("slug", v)}
                    placeholder={slugify(form.title) || "sundarbans-wildlife-tour"}
                    mono
                  />
                  <SelectField
                    label="Category"
                    value={form.category}
                    onChange={(v) => set("category", v)}
                    options={[
                      { value: "day-tour", label: "Day tour" },
                      { value: "multi-day", label: "Multi-day" },
                      { value: "holiday", label: "Holiday" },
                    ]}
                  />
                  <SelectField
                    label="Primary destination"
                    value={form.primary_destination_slug}
                    onChange={(v) => set("primary_destination_slug", v)}
                    options={[
                      { value: "", label: "— None —" },
                      ...destinations.map((d) => ({ value: d.slug, label: d.name })),
                    ]}
                  />
                  <TextField
                    label="Destination label (display)"
                    hint="Shown as 📍 on cards."
                    value={form.destination_label}
                    onChange={(v) => set("destination_label", v)}
                    placeholder="Khulna"
                  />
                  <TextField
                    label="Activity label"
                    value={form.activity_label}
                    onChange={(v) => set("activity_label", v)}
                    placeholder="Wildlife"
                  />
                  <TextField
                    label="Duration label"
                    value={form.duration_label}
                    onChange={(v) => set("duration_label", v)}
                    placeholder="4 Days / 3 Nights"
                  />
                  <NumberField
                    label="Duration (days)"
                    min={1}
                    max={365}
                    value={form.duration_days}
                    onChange={(v) => set("duration_days", v ?? 1)}
                  />
                </div>

                <div className="flex flex-wrap gap-8">
                  <Toggle
                    label="Published"
                    hint="Off keeps it invisible to the public."
                    checked={form.is_published}
                    onChange={(v) => set("is_published", v)}
                  />
                  <Toggle
                    label="Featured"
                    hint="Adds the 👑 ribbon and sorts it first."
                    checked={form.is_featured}
                    onChange={(v) => set("is_featured", v)}
                  />
                </div>
              </FormSection>

              <SectionPicker
                form={form}
                themeCount={themeIds.length}
                onChange={(v) => set("hidden_sections", v)}
              />

              <div className="-mb-3 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections(
                      Object.fromEntries(TOUR_SECTIONS.map((s) => [s.id, true])) as Record<
                        TourSectionId,
                        boolean
                      >,
                    )
                  }
                  className="text-[0.78rem] font-semibold text-green-dark hover:underline"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections(
                      Object.fromEntries(TOUR_SECTIONS.map((s) => [s.id, false])) as Record<
                        TourSectionId,
                        boolean
                      >,
                    )
                  }
                  className="text-[0.78rem] font-semibold text-muted hover:underline"
                >
                  Collapse all
                </button>
              </div>

              {shows("pricing") ? (
                <FormSection
                  title="Pricing"
                  open={openSections.pricing}
                  onToggle={() => toggleSection("pricing")}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <NumberField
                      label="Price USD"
                      min={0}
                      value={form.price_usd}
                      onChange={(v) => set("price_usd", v)}
                    />
                    <NumberField
                      label="Price BDT"
                      hint="Shown as the local rate. Blank hides it."
                      min={0}
                      value={form.price_bdt}
                      onChange={(v) => set("price_bdt", v)}
                    />
                    <NumberField
                      label="Discount USD"
                      hint="Shown instead of the price when set."
                      min={0}
                      value={form.discount_price_usd}
                      onChange={(v) => set("discount_price_usd", v)}
                    />
                    <NumberField
                      label="Child price USD (blank hides the child row)"
                      min={0}
                      value={form.child_price_usd}
                      onChange={(v) => set("child_price_usd", v)}
                    />
                    <NumberField
                      label="Child discount USD"
                      min={0}
                      value={form.discount_child_price_usd}
                      onChange={(v) => set("discount_child_price_usd", v)}
                    />
                    <TextField
                      label="Price note"
                      value={form.price_note}
                      onChange={(v) => set("price_note", v)}
                      placeholder="per person for a group of 2"
                    />
                  </div>
                  <RepeaterField
                    label="Group price tiers"
                    hint="The cards under “Choose Your Perfect Experience”. Order them as you want them read — cheapest first works best. Leave empty to hide the block."
                    values={form.price_tiers}
                    onChange={(v) => set("price_tiers", v)}
                    blank={() => ({ label: "", persons: null, price: null, note: "", badge: "" })}
                    title={(row) => (row.label as string) || "New tier"}
                    columns={[
                      { key: "label", label: "Title", placeholder: "Four Pax Group", span: 5 },
                      { key: "persons", label: "People", type: "number", span: 2 },
                      { key: "price", label: "USD each", type: "number", span: 2 },
                      {
                        key: "badge",
                        label: "Corner ribbon",
                        placeholder: "Best value",
                        span: 3,
                      },
                      {
                        key: "note",
                        label: "Small print under the price",
                        placeholder: "Per person — best value",
                      },
                    ]}
                  />
                  <GroupedListField
                    label="Offer cards"
                    hint="The three cards under Tour Price & Offers."
                    values={form.offers}
                    onChange={(v) => set("offers", v)}
                  />
                </FormSection>
              ) : null}

              {shows("rating") ? (
                <FormSection
                  title="Rating & ordering"
                  description="Social proof and the four figures on a tour card."
                  open={openSections.rating}
                  onToggle={() => toggleSection("rating")}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <NumberField
                      label="Rating"
                      hint="0–5. Blank hides the stars."
                      min={0}
                      max={5}
                      step={0.1}
                      value={form.rating}
                      onChange={(v) => set("rating", v)}
                    />
                    <NumberField
                      label="Reviews count"
                      min={0}
                      value={form.reviews_count}
                      onChange={(v) => set("reviews_count", v ?? 0)}
                    />
                    <NumberField
                      label="Activities"
                      min={0}
                      value={form.activities_count}
                      onChange={(v) => set("activities_count", v)}
                    />
                    <NumberField
                      label="Max group size"
                      min={1}
                      value={form.group_size_max}
                      onChange={(v) => set("group_size_max", v)}
                    />
                    <NumberField
                      label="Stops"
                      min={0}
                      value={form.stops_count}
                      onChange={(v) => set("stops_count", v)}
                    />
                    <NumberField
                      label="Sort order"
                      min={0}
                      value={form.sort_order}
                      onChange={(v) => set("sort_order", v ?? 0)}
                    />
                  </div>
                </FormSection>
              ) : null}

              {shows("images") ? (
                <FormSection
                  title="Images"
                  open={openSections.images}
                  onToggle={() => toggleSection("images")}
                >
                  <ImageField
                    label="Hero image"
                    hint="Leads the tour page gallery and every card. Falls back to the first gallery image."
                    value={form.hero_image}
                    onChange={(v) => set("hero_image", v)}
                  />
                  <GalleryField
                    label="Gallery"
                    hint="The tour page shows the first four as a mosaic."
                    values={form.images}
                    onChange={(v) => set("images", v)}
                  />
                </FormSection>
              ) : null}

              {shows("themes") ? (
                <FormSection
                  title="Themes"
                  description="Drives the filter pills on the public /tours page."
                  open={openSections.themes}
                  onToggle={() => toggleSection("themes")}
                >
                  <div className="flex flex-wrap gap-2">
                    {activities.map((activity) => {
                      const on = themeIds.includes(activity.id);
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setThemeIds((ids) =>
                              on ? ids.filter((i) => i !== activity.id) : [...ids, activity.id],
                            )
                          }
                          className={`rounded-[30px] border px-4 py-2 text-[0.82rem] font-semibold transition-colors ${
                            on
                              ? "border-green-dark bg-green-dark text-white"
                              : "border-rule bg-paper text-ink hover:border-green"
                          }`}
                        >
                          {activity.name}
                        </button>
                      );
                    })}
                  </div>
                </FormSection>
              ) : null}

              {shows("facts") ? (
                <FormSection
                  title="Trip facts"
                  description="Any field left blank falls back to a derived default."
                  open={openSections.facts}
                  onToggle={() => toggleSection("facts")}
                >
                  <KeyValueField
                    label="Facts"
                    keys={TOUR_FACT_KEYS.filter((k) => !TOUR_FACT_KEYS_EXTRA.includes(k))}
                    labels={TOUR_FACT_META}
                    values={form.facts}
                    onChange={(v) => set("facts", v)}
                  />
                  <Toggle
                    label="Show accommodation, arrival & departure"
                    hint="Rarely needed for single-day tours."
                    checked={showExtraFacts}
                    onChange={setShowExtraFacts}
                  />
                  {showExtraFacts ? (
                    <KeyValueField
                      label="More facts"
                      keys={TOUR_FACT_KEYS_EXTRA}
                      labels={TOUR_FACT_META}
                      values={form.facts}
                      onChange={(v) => set("facts", v)}
                    />
                  ) : null}
                </FormSection>
              ) : null}

              {shows("overview") ? (
                <FormSection
                  title="Tour Introduction / Overview"
                  open={openSections.overview}
                  onToggle={() => toggleSection("overview")}
                >
                  <TextArea
                    label="Overview"
                    hint="Leave a blank line between paragraphs."
                    rows={7}
                    value={form.overview}
                    onChange={(v) => set("overview", v)}
                  />
                  <TextArea
                    label="Good-to-know tip"
                    hint="Rendered as the 💡 callout."
                    rows={2}
                    value={form.overview_tip}
                    onChange={(v) => set("overview_tip", v)}
                  />
                </FormSection>
              ) : null}

              {shows("highlights") ? (
                <FormSection
                  title="Tour Highlights"
                  open={openSections.highlights}
                  onToggle={() => toggleSection("highlights")}
                >
                  <InlineLinesField
                    label="Highlights"
                    hint="One per line. Select text to format it."
                    rows={8}
                    value={highlightsDocument}
                    onChange={(value) => {
                      setHighlightsDocument(value);
                      set("highlights", parseInlineLines(value, false));
                    }}
                  />
                </FormSection>
              ) : null}

              {shows("glance") ? (
                <FormSection
                  title="Itinerary at a Glance"
                  open={openSections.glance}
                  onToggle={() => toggleSection("glance")}
                >
                  <InlineLinesField
                    label="Journey at a glance"
                    hint="One stop per line: time — what happens. You can also use –, - or |."
                    rows={10}
                    boldLinePrefixPattern={GLANCE_SEPARATOR_PATTERN}
                    value={glanceDocument}
                    onChange={(value) => {
                      setGlanceDocument(value);
                      set("glance", parseGlance(value));
                    }}
                  />
                  <RepeaterField
                    label="Optional add-ons"
                    values={form.addons}
                    onChange={(v) => set("addons", v)}
                    blank={() => ({ icon: "", title: "", detail: "" })}
                    columns={[
                      { key: "icon", label: "Icon", placeholder: "🎣", span: 2 },
                      { key: "title", label: "Title", span: 10 },
                      { key: "detail", label: "Detail", type: "textarea" },
                    ]}
                  />
                </FormSection>
              ) : null}

              {shows("itinerary") ? (
                <FormSection
                  title="Full-Day Itinerary (Step by Step)"
                  open={openSections.itinerary}
                  onToggle={() => toggleSection("itinerary")}
                >
                  <RepeaterField
                    label={isDayTour ? "Full-day itinerary (step by step)" : "Itinerary days"}
                    values={form.itinerary}
                    onChange={(v) => set("itinerary", v)}
                    blank={() => ({
                      day: nextItineraryNumber(form.itinerary),
                      title: "",
                      detail: "",
                    })}
                    title={(row) => (isDayTour ? `Step ${row.day}` : `Day ${row.day}`)}
                    columns={[
                      { key: "day", label: isDayTour ? "Step" : "Day", type: "number", span: 2 },
                      { key: "title", label: "Title", span: 10, className: "font-body text-base" },
                      { key: "detail", label: "Detail", type: "rich-text" },
                    ]}
                  />
                </FormSection>
              ) : null}

              {shows("included") ? (
                <FormSection
                  title="Inclusions & Exclusions"
                  open={openSections.included}
                  onToggle={() => toggleSection("included")}
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <StringListField
                      label="Inclusions"
                      values={form.inclusions}
                      onChange={(v) => set("inclusions", v)}
                    />
                    <StringListField
                      label="Exclusions"
                      values={form.exclusions}
                      onChange={(v) => set("exclusions", v)}
                    />
                  </div>
                </FormSection>
              ) : null}

              {shows("key_notes") ? (
                <FormSection
                  title="Key Notes"
                  open={openSections.key_notes}
                  onToggle={() => toggleSection("key_notes")}
                >
                  <InlineLinesField
                    label="Advice blocks"
                    hint="One block per paragraph, separated by a blank line. First line of each is the heading, the rest are items."
                    rows={8}
                    value={adviceDocument}
                    onChange={(value) => {
                      setAdviceDocument(value);
                      set("advice", parseAdvice(value));
                    }}
                  />
                  <RepeaterField
                    label="Accessibility notes"
                    values={form.accessibility}
                    onChange={(v) => set("accessibility", v)}
                    blank={() => ({ label: "", detail: "" })}
                    columns={[
                      {
                        key: "label",
                        label: "Label",
                        placeholder: "Step minimisation",
                        span: 4,
                      },
                      { key: "detail", label: "Detail", span: 8 },
                    ]}
                  />
                  <StringListField
                    label="Responsible travel pledge"
                    values={form.pledge}
                    onChange={(v) => set("pledge", v)}
                  />
                </FormSection>
              ) : null}

              {shows("why_us") ? (
                <FormSection
                  title="Why Choose Roam Bengal for This Tour?"
                  open={openSections.why_us}
                  onToggle={() => toggleSection("why_us")}
                >
                  <InlineLinesField
                    label="Why choose us for this tour"
                    hint="One per line. Select text to format it."
                    rows={8}
                    value={whyDocument}
                    onChange={(value) => {
                      setWhyDocument(value);
                      set("why_items", parseInlineLines(value, false));
                    }}
                  />
                </FormSection>
              ) : null}

              {shows("faq") ? (
                <FormSection
                  title="Package-Specific FAQ"
                  open={openSections.faq}
                  onToggle={() => toggleSection("faq")}
                >
                  <TourFaqsField
                    values={form.faqs}
                    onChange={(v) => set("faqs", v)}
                    faqOptions={siteFaqs}
                  />
                </FormSection>
              ) : null}

              {shows("extras") ? (
                <FormSection
                  title="Map, video & related tours"
                  open={openSections.extras}
                  onToggle={() => toggleSection("extras")}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      label="Map embed URL"
                      hint="An embeddable map URL, not a share link."
                      value={form.map_embed}
                      onChange={(v) => set("map_embed", v)}
                    />
                    <TextField
                      label="Video embed URL"
                      hint="YouTube/Vimeo embed URL."
                      value={form.video_url}
                      onChange={(v) => set("video_url", v)}
                    />
                  </div>
                  <RelatedContentField
                    label="Related tours"
                    hint="Shown as “You Might Also Like”. Leave empty to pick automatically."
                    kind="tour"
                    values={form.related_slugs}
                    onChange={(v) => set("related_slugs", v)}
                  />
                </FormSection>
              ) : null}

              {shows("blog_suggestions") ? (
                <FormSection
                  title="Blog Suggestions (for SEO & Internal Linking)"
                  open={openSections.blog_suggestions}
                  onToggle={() => toggleSection("blog_suggestions")}
                >
                  <RelatedContentField
                    label="Suggested blog posts"
                    hint="Shown as “From the Blog” on the tour page. Leave empty to pick automatically."
                    kind="post"
                    values={form.related_post_slugs}
                    onChange={(v) => set("related_post_slugs", v)}
                  />
                </FormSection>
              ) : null}

              {shows("seo") ? (
                <FormSection
                  title="Meta SEO"
                  description="The search-result title and description for this tour's page."
                  open={openSections.seo}
                  onToggle={() => toggleSection("seo")}
                >
                  <TextField
                    label="SEO title"
                    hint="Falls back to the tour title when blank."
                    value={form.meta_title}
                    onChange={(v) => set("meta_title", v)}
                  />
                  <TextArea
                    label="Meta description"
                    hint="Shown under the title in search results. For the focus keyphrase, Open Graph, Twitter card, and other advanced SEO controls, see Admin → SEO."
                    rows={3}
                    plain
                    value={form.meta_description}
                    onChange={(v) => set("meta_description", v)}
                  />
                </FormSection>
              ) : null}
        </div>
      </div>

    </TourFormShell>
  );
}

/**
 * Tour FAQs: each row can be filled by picking an existing FAQ from the site-wide
 * database (copies its question/answer text in as a starting point) or written from
 * scratch. The picker is a one-shot copy, not a live link — nothing here tracks which
 * FAQ a row came from, so editing the copied text afterwards is expected.
 */
function TourFaqsField({
  values,
  onChange,
  faqOptions,
}: {
  values: { question: string; answer: string }[];
  onChange: (v: { question: string; answer: string }[]) => void;
  faqOptions: { id: string; question: string; answer: string }[];
}) {
  const setField = (i: number, key: "question" | "answer", v: string) =>
    onChange(values.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => onChange(reorder(values, i, dir));

  function pickFromDatabase(i: number, faqId: string) {
    const picked = faqOptions.find((f) => f.id === faqId);
    if (!picked) return;
    onChange(
      values.map((row, idx) =>
        idx === i ? { question: picked.question, answer: picked.answer } : row,
      ),
    );
  }

  return (
    <div>
      <Label hint="Pick an existing FAQ to copy its text in, or write a custom one below.">
        Tour FAQs
      </Label>
      <div className="flex flex-col gap-3">
        {values.map((row, i) => (
          <div key={i} className="rounded-xl border border-rule bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.78rem] font-semibold text-muted">Tour FAQ {i + 1}</span>
              <RowControls
                onUp={i > 0 ? () => move(i, -1) : undefined}
                onDown={i < values.length - 1 ? () => move(i, 1) : undefined}
                onRemove={() => remove(i)}
              />
            </div>

            {faqOptions.length ? (
              <div className="mb-3">
                <span className="mb-1 block text-[0.72rem] font-medium text-muted">
                  Pick from FAQ database
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) pickFromDatabase(i, e.target.value);
                  }}
                  className={inputBase}
                >
                  <option value="">— Write custom below —</option>
                  {faqOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.question}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              <div>
                <span className="mb-1 block text-[0.72rem] font-medium text-muted">Question</span>
                <input
                  type="text"
                  value={row.question}
                  onChange={(e) => setField(i, "question", e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <span className="mb-1 block text-[0.72rem] font-medium text-muted">Answer</span>
                <RichTextarea
                  rows={3}
                  value={row.answer}
                  onChange={(v) => setField(i, "answer", v)}
                />
              </div>
            </div>
          </div>
        ))}
        <AddButton
          onClick={() => onChange([...values, { question: "", answer: "" }])}
          label="Tour FAQ"
        />
      </div>
    </div>
  );
}

/** A titled block of fields. Flat by design — cards buried the form in chrome. */
/**
 * Which parts of this form the tour shows.
 *
 * Collapsed by default: it is a setup decision, not something you revisit while writing.
 * Switching a section off is safe — the public tour page renders from content, so nothing
 * disappears from the site — but a section that still holds something says so rather than
 * letting an author think they removed it.
 */
function SectionPicker({
  form,
  themeCount,
  onChange,
}: {
  form: TourForm;
  themeCount: number;
  onChange: (hidden: string[]) => void;
}) {
  const hidden = form.hidden_sections;
  const [open, setOpen] = useState(false);
  const offCount = TOUR_SECTIONS.filter((s) => hidden.includes(s.id)).length;

  return (
    <section className="border-t border-rule pt-7">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block font-display text-[1.05rem] font-bold text-green-dark">
            Sections
          </span>
          <span className="mt-1 block text-[0.8rem] text-muted">
            {offCount === 0
              ? "Every section is shown. Turn off the ones this tour does not need."
              : `${offCount} section${offCount === 1 ? "" : "s"} hidden on this tour.`}
          </span>
        </span>
        <AdminIcon
          name="chevron"
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open ? (
        <div className="mt-5 flex flex-col gap-3 rounded-[10px] border border-rule bg-paper px-4 py-3.5">
          <p className="text-[0.78rem] text-muted">
            This only tidies the form you are looking at. The tour page on the website shows
            a section whenever it has content, whatever you set here.
          </p>
          {TOUR_SECTIONS.map((section) => {
            const isHidden = hidden.includes(section.id);
            const filled = section.hasContent(form, themeCount);
            return (
              <Toggle
                key={section.id}
                label={section.label}
                checked={!isHidden}
                hint={
                  isHidden && filled
                    ? "Hidden here, but it still has content — that content keeps showing on the website."
                    : section.hint
                }
                onChange={(on) => onChange(setSectionHidden(hidden, section.id, !on))}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function FormSection({
  title,
  description,
  open = true,
  onToggle,
  children,
}: {
  title?: string;
  description?: string;
  /** Ignored unless `onToggle` is also given — see `collapsible` below. */
  open?: boolean;
  /** Presence (not just truthiness) makes the section a collapsible accordion, so a
   *  caller can add a title without opting into collapse behavior. */
  onToggle?: () => void;
  children: ReactNode;
}) {
  const collapsible = Boolean(title && onToggle);
  return (
    <section className={title ? "border-t border-rule pt-7" : ""}>
      {title ? (
        collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block font-display text-[1.05rem] font-bold text-green-dark">
                {title}
              </span>
              {description ? (
                <span className="mt-1 block text-[0.8rem] text-muted">{description}</span>
              ) : null}
            </span>
            <AdminIcon
              name="chevron"
              className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <header className="mb-5">
            <h2 className="font-display text-[1.05rem] font-bold text-green-dark">{title}</h2>
            {description ? <p className="mt-1 text-[0.8rem] text-muted">{description}</p> : null}
          </header>
        )
      ) : null}
      {open ? (
        <div className={`flex flex-col gap-5 ${collapsible ? "mt-5" : ""}`}>{children}</div>
      ) : null}
    </section>
  );
}

function InlineLinesField({
  label,
  hint,
  rows,
  value,
  onChange,
  boldLinePrefixPattern,
}: {
  label: string;
  hint?: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
  boldLinePrefixPattern?: RegExp;
}) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <RichTextarea
        mode="inline-lines"
        rows={rows}
        value={value}
        onChange={onChange}
        ariaLabel={label}
        boldLinePrefixPattern={boldLinePrefixPattern}
      />
    </div>
  );
}

/** The preview iframe's URL. Frozen between reloads so typing cannot reload the frame. */
function previewSlug(form: TourForm): string {
  return form.slug.trim() || slugify(form.title) || "new";
}

/** Key order is stable because both sides come from the same object shape. */
function serialize(state: EditorState): string {
  return JSON.stringify({ form: state.form, themeIds: [...state.themeIds].sort() });
}

/** DB row → form state, replacing nulls with the empty values the inputs expect. */
function hydrate(row: Record<string, unknown>): Partial<TourForm> {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

  return {
    slug: text(row.slug),
    title: text(row.title),
    category: (row.category as TourForm["category"]) ?? "multi-day",
    hero_image: text(row.hero_image),
    images: list(row.images) as string[],
    duration_label: text(row.duration_label),
    duration_days: Number(row.duration_days ?? 1),
    price_usd: numOrNull(row.price_usd),
    price_bdt: numOrNull(row.price_bdt),
    discount_price_usd: numOrNull(row.discount_price_usd),
    child_price_usd: numOrNull(row.child_price_usd),
    discount_child_price_usd: numOrNull(row.discount_child_price_usd),
    price_note: text(row.price_note),
    price_tiers: list(row.price_tiers) as TourForm["price_tiers"],
    rating: numOrNull(row.rating),
    reviews_count: Number(row.reviews_count ?? 0),
    destination_label: text(row.destination_label),
    activity_label: text(row.activity_label),
    primary_destination_slug: text(row.primary_destination_slug),
    is_featured: Boolean(row.is_featured),
    activities_count: numOrNull(row.activities_count),
    group_size_max: numOrNull(row.group_size_max),
    stops_count: numOrNull(row.stops_count),
    facts: (row.facts && typeof row.facts === "object" ? row.facts : {}) as Record<string, string>,
    overview: text(row.overview),
    overview_tip: text(row.overview_tip),
    highlights: list(row.highlights) as string[],
    glance: list(row.glance) as TourForm["glance"],
    addons: list(row.addons) as TourForm["addons"],
    itinerary: list(row.itinerary) as TourForm["itinerary"],
    offers: list(row.offers) as TourForm["offers"],
    inclusions: list(row.inclusions) as string[],
    exclusions: list(row.exclusions) as string[],
    accessibility: list(row.accessibility) as TourForm["accessibility"],
    advice: list(row.advice) as TourForm["advice"],
    pledge: list(row.pledge) as string[],
    why_items: list(row.why_items) as string[],
    faqs: list(row.faqs) as TourForm["faqs"],
    map_embed: text(row.map_embed),
    video_url: text(row.video_url),
    related_slugs: list(row.related_slugs) as string[],
    related_post_slugs: list(row.related_post_slugs) as string[],
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
    hidden_sections: list(row.hidden_sections) as string[],
  };
}

/** Advice blocks stay in one rich textbox. Empty paragraphs separate blocks; the first
 * populated paragraph in each block is its formatted heading. */
function normalizeInline(value: string): string {
  return marked.parseInline(value || "") as string;
}

function serializeInlineLines(lines: string[]): string {
  return lines
    .map((line) => `<p>${line ? normalizeInline(line) : "<br>"}</p>`)
    .join("");
}

function inlineParagraphs(documentHtml: string): { html: string; text: string }[] {
  if (!documentHtml) return [];
  const root = document.createElement("div");
  root.innerHTML = documentHtml;
  return Array.from(root.children).map((paragraph) => ({
    html: paragraph.textContent?.trim() ? paragraph.innerHTML : "",
    text: paragraph.textContent ?? "",
  }));
}

function parseInlineLines(documentHtml: string, keepEmpty = true): string[] {
  return inlineParagraphs(documentHtml)
    .filter((line) => keepEmpty || line.text.trim() !== "")
    .map((line) => line.html);
}

function serializeAdvice(advice: { title: string; items: string[] }[]): string {
  return serializeInlineLines(
    advice.flatMap((block, index) => [
      ...(index ? [""] : []),
      block.title,
      ...block.items,
    ]),
  );
}

function parseAdvice(documentHtml: string): { title: string; items: string[] }[] {
  const blocks: { title: string; items: string[] }[] = [];
  let current: string[] = [];
  const flush = () => {
    if (!current.length) return;
    const [title = "", ...items] = current;
    blocks.push({ title, items });
    current = [];
  };
  for (const line of inlineParagraphs(documentHtml)) {
    if (!line.text.trim()) flush();
    else current.push(line.html);
  }
  flush();
  return blocks;
}

/** Journey-at-a-glance rows as one compact text box. The first spaced dash or pipe
 *  separates the time from the description; a line without one remains valid as
 *  description-only content, so partially typed lines do not disappear from the preview. */
function serializeGlance(glance: { when: string; detail: string }[]): string {
  return glance
    .map(({ when, detail }) => {
      const formattedWhen = when ? `<strong>${normalizeInline(when)}</strong>` : "";
      const formattedDetail = detail ? normalizeInline(detail) : "";
      const line =
        formattedWhen && formattedDetail
          ? `${formattedWhen} — ${formattedDetail}`
          : formattedWhen || formattedDetail;
      return `<p>${line || "<br>"}</p>`;
    })
    .join("");
}

function parseGlance(documentHtml: string): { when: string; detail: string }[] {
  const root = document.createElement("div");
  root.innerHTML = documentHtml;
  return Array.from(root.children)
    .filter((paragraph) => Boolean(paragraph.textContent?.trim()))
    .map((paragraph) => {
      const text = paragraph.textContent ?? "";
      GLANCE_SEPARATOR_PATTERN.lastIndex = 0;
      const separator = GLANCE_SEPARATOR_PATTERN.exec(text);
      if (!separator || separator.index === undefined) {
        return { when: "", detail: sliceInlineHtml(paragraph, 0, text.length) };
      }
      return {
        when: sliceInlineHtml(paragraph, 0, separator.index),
        detail: sliceInlineHtml(
          paragraph,
          separator.index + separator[0].length,
          text.length,
        ),
      };
    });
}

/** Clone a text range while retaining every inline mark which crosses the boundary. */
function sliceInlineHtml(element: Element, rawStart: number, rawEnd: number): string {
  const text = element.textContent ?? "";
  const selected = text.slice(rawStart, rawEnd);
  if (!selected.trim()) return "";

  const range = document.createRange();
  const startBoundary = textBoundary(element, rawStart);
  const endBoundary = textBoundary(element, rawEnd);
  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);
  const wrapper = document.createElement("div");
  wrapper.append(range.cloneContents());
  return wrapper.innerHTML;
}

function textBoundary(element: Element, offset: number): { node: Node; offset: number } {
  const walker = document.createTreeWalker(element, 4);
  let traversed = 0;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (offset <= traversed + length) return { node, offset: offset - traversed };
    traversed += length;
    node = walker.nextNode();
  }
  return { node: element, offset: element.childNodes.length };
}

/** Continue from the largest saved step/day rather than the row count. This avoids a
 * duplicate after rows are deleted, reordered, or manually renumbered. */
function nextItineraryNumber(itinerary: { day: number }[]): number {
  const highest = itinerary.reduce(
    (max, row) => (Number.isFinite(row.day) ? Math.max(max, row.day) : max),
    0,
  );
  return highest + 1;
}
