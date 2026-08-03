import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AdminButton,
  Card,
  ErrorBanner,
  PageHeader,
  SavedNote,
  useAction,
} from "@/components/admin/admin-ui";
import {
  GroupedListField,
  KeyValueField,
  NumberField,
  RepeaterField,
  SelectField,
  StringListField,
  TextArea,
  TextField,
  Toggle,
} from "@/components/admin/fields";
import { GalleryField, ImageField } from "@/components/admin/image-upload";
import {
  adminGetTour,
  adminListActivities,
  adminSetTourThemes,
  adminUpsertTour,
} from "@/lib/admin-content.functions";
import { listTourThemes } from "@/lib/site-content.functions";
import { TOUR_FACT_KEYS, TOUR_FACT_META, type TourCategory } from "@/lib/content-types";

export const Route = createFileRoute("/_authenticated/admin/tours/$id")({
  loader: async ({ params }) => {
    const isNew = params.id === "new";
    const [tour, activities, themes] = await Promise.all([
      isNew ? Promise.resolve(null) : adminGetTour({ data: { id: params.id } }),
      adminListActivities(),
      listTourThemes(),
    ]);
    return { tour, activities, themes, isNew };
  },
  component: TourEditor,
});

/** Mirrors the `TourInput` Zod schema in admin-content.functions.ts. */
function emptyTour() {
  return {
    slug: "",
    title: "",
    // Widened deliberately: `as const` would pin the field to "multi-day" and make the
    // category <select> unassignable.
    category: "multi-day" as TourCategory,
    summary: "",
    hero_image: "",
    images: [] as string[],
    duration_label: "",
    duration_days: 1,
    price_usd: null as number | null,
    discount_price_usd: null as number | null,
    price_note: "",
    rating: null as number | null,
    reviews_count: 0,
    destination_label: "",
    activity_label: "",
    primary_destination_slug: "",
    is_featured: false,
    activities_count: null as number | null,
    group_size_max: null as number | null,
    stops_count: null as number | null,
    facts: {} as Record<string, string>,
    overview: [] as string[],
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
    is_published: false,
    sort_order: 0,
  };
}

type TourForm = ReturnType<typeof emptyTour>;

function TourEditor() {
  const { tour, activities, themes, isNew } = Route.useLoaderData();
  const navigate = useNavigate();
  const { run, busy, error, saved } = useAction();

  const [form, setForm] = useState<TourForm>(() => ({
    ...emptyTour(),
    ...(tour ? hydrate(tour) : {}),
  }));
  const [themeIds, setThemeIds] = useState<string[]>(() => {
    if (!tour) return [];
    const slugs = themes[tour.slug] ?? [];
    return activities.filter((a) => slugs.includes(a.slug)).map((a) => a.id);
  });

  const set = <K extends keyof TourForm>(key: K, value: TourForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    const payload = { ...form, slug: form.slug.trim() || slugify(form.title) };
    const result = await run(() =>
      adminUpsertTour({ data: { ...(tour ? { id: tour.id } : {}), tour: payload as never } }),
    );
    if (!result) return;

    await run(() => adminSetTourThemes({ data: { tourId: result.id, activityIds: themeIds } }));

    // A new tour lives at a placeholder route until it has an id.
    if (isNew) await navigate({ to: "/admin/tours/$id", params: { id: result.id } });
  }

  return (
    <>
      <PageHeader
        title={isNew ? "New tour" : form.title || "Untitled tour"}
        subtitle={isNew ? "Fill in the basics — you can add detail after saving." : `/tours/${form.slug}`}
        actions={
          <>
            <Link
              to="/admin/tours"
              className="inline-flex items-center justify-center rounded-[30px] border-[1.5px] border-rule px-5 py-2.5 text-[0.84rem] font-semibold text-ink hover:border-green hover:text-green"
            >
              ← All tours
            </Link>
            {!isNew && form.is_published ? (
              <AdminButton
                variant="secondary"
                onClick={() => window.open(`/tours/${form.slug}`, "_blank")}
              >
                View live ↗
              </AdminButton>
            ) : null}
            <AdminButton onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save tour"}
            </AdminButton>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-4">
        <ErrorBanner error={error} />
        <SavedNote show={saved && !error} />
      </div>

      <div className="flex flex-col gap-6">
        <Card title="Basics">
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
              hint="URL key. Lowercase words separated by hyphens. Leave blank to derive from the title."
              value={form.slug}
              onChange={(v) => set("slug", v)}
              placeholder={slugify(form.title) || "sundarbans-wildlife-tour"}
              mono
            />
            <SelectField
              label="Category"
              hint="Duration type — not the theme filter."
              value={form.category}
              onChange={(v) => set("category", v)}
              options={[
                { value: "day-tour", label: "Day tour" },
                { value: "multi-day", label: "Multi-day" },
                { value: "holiday", label: "Holiday" },
              ]}
            />
            <TextField
              label="Destination label"
              hint="Shown as 📍 on cards."
              value={form.destination_label}
              onChange={(v) => set("destination_label", v)}
              placeholder="Khulna"
            />
          </div>

          <TextArea
            label="Summary"
            hint="The paragraph on tour cards."
            rows={3}
            value={form.summary}
            onChange={(v) => set("summary", v)}
          />

          <div className="grid gap-5 sm:grid-cols-3">
            <NumberField
              label="Duration (days)"
              min={1}
              max={365}
              value={form.duration_days}
              onChange={(v) => set("duration_days", v ?? 1)}
            />
            <TextField
              label="Duration label"
              value={form.duration_label}
              onChange={(v) => set("duration_label", v)}
              placeholder="4 Days / 3 Nights"
            />
            <TextField
              label="Activity label"
              value={form.activity_label}
              onChange={(v) => set("activity_label", v)}
              placeholder="Wildlife"
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
        </Card>

        <Card title="Themes" description="Drives the filter pills on the public /tours page.">
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
                  className={`rounded-[30px] border-[1.5px] px-4 py-2 text-[0.82rem] font-semibold transition-colors ${
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
        </Card>

        <Card title="Pricing">
          <div className="grid gap-5 sm:grid-cols-3">
            <NumberField
              label="Price (USD)"
              min={0}
              value={form.price_usd}
              onChange={(v) => set("price_usd", v)}
            />
            <NumberField
              label="Discounted price (USD)"
              hint="Shown instead of the price when set."
              min={0}
              value={form.discount_price_usd}
              onChange={(v) => set("discount_price_usd", v)}
            />
            <TextField
              label="Price note"
              value={form.price_note}
              onChange={(v) => set("price_note", v)}
              placeholder="per person for a group of 2"
            />
          </div>
        </Card>

        <Card title="Card statistics" description="The four figures on a tour card.">
          <div className="grid gap-5 sm:grid-cols-4">
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
        </Card>

        <Card title="Images">
          <ImageField
            label="Hero image"
            hint="Used on cards. Falls back to the first gallery image."
            value={form.hero_image}
            onChange={(v) => set("hero_image", v)}
          />
          <GalleryField
            label="Gallery"
            hint="The tour page shows the first four as a mosaic."
            values={form.images}
            onChange={(v) => set("images", v)}
          />
        </Card>

        <Card title="Trip facts" description="Any field left blank falls back to a derived default.">
          <KeyValueField
            label="Facts"
            keys={TOUR_FACT_KEYS}
            labels={TOUR_FACT_META}
            values={form.facts}
            onChange={(v) => set("facts", v)}
          />
        </Card>

        <Card title="Overview & highlights">
          <StringListField
            label="Overview paragraphs"
            multiline
            values={form.overview}
            onChange={(v) => set("overview", v)}
          />
          <TextArea
            label="Good-to-know tip"
            hint="Rendered as the 💡 callout."
            rows={2}
            value={form.overview_tip}
            onChange={(v) => set("overview_tip", v)}
          />
          <StringListField
            label="Highlights"
            values={form.highlights}
            onChange={(v) => set("highlights", v)}
          />
        </Card>

        <Card title="Itinerary">
          <RepeaterField
            label="Itinerary days"
            values={form.itinerary}
            onChange={(v) => set("itinerary", v)}
            blank={() => ({ day: form.itinerary.length + 1, title: "", detail: "" })}
            title={(row) => `Day ${row.day}`}
            columns={[
              { key: "day", label: "Day", type: "number", span: 2 },
              { key: "title", label: "Title", span: 10 },
              { key: "detail", label: "Detail", type: "textarea" },
            ]}
          />
          <RepeaterField
            label="Journey at a glance"
            values={form.glance}
            onChange={(v) => set("glance", v)}
            blank={() => ({ when: "", detail: "" })}
            columns={[
              { key: "when", label: "When", placeholder: "Day 1, Morning", span: 4 },
              { key: "detail", label: "What happens", span: 8 },
            ]}
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
        </Card>

        <Card title="What's included">
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
          <GroupedListField
            label="Offer cards"
            hint="The three cards under Tour Price & Offers."
            values={form.offers}
            onChange={(v) => set("offers", v)}
          />
        </Card>

        <Card title="Advice & responsibilities">
          <GroupedListField
            label="Advice blocks"
            values={form.advice}
            onChange={(v) => set("advice", v)}
          />
          <RepeaterField
            label="Accessibility notes"
            values={form.accessibility}
            onChange={(v) => set("accessibility", v)}
            blank={() => ({ label: "", detail: "" })}
            columns={[
              { key: "label", label: "Label", placeholder: "Step minimisation", span: 4 },
              { key: "detail", label: "Detail", span: 8 },
            ]}
          />
          <StringListField
            label="Responsible travel pledge"
            values={form.pledge}
            onChange={(v) => set("pledge", v)}
          />
          <StringListField
            label="Why choose us for this tour"
            values={form.why_items}
            onChange={(v) => set("why_items", v)}
          />
        </Card>

        <Card title="FAQs, map & video">
          <RepeaterField
            label="Tour FAQs"
            values={form.faqs}
            onChange={(v) => set("faqs", v)}
            blank={() => ({ question: "", answer: "" })}
            columns={[
              { key: "question", label: "Question" },
              { key: "answer", label: "Answer", type: "textarea" },
            ]}
          />
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
          <StringListField
            label="Related tour slugs"
            hint="Leave empty to pick automatically."
            values={form.related_slugs}
            onChange={(v) => set("related_slugs", v)}
            placeholder="barisal-backwater-tour"
          />
        </Card>

        <div className="flex items-center gap-4 pb-10">
          <AdminButton onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save tour"}
          </AdminButton>
          <SavedNote show={saved && !error} />
        </div>
      </div>
    </>
  );
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
    summary: text(row.summary),
    hero_image: text(row.hero_image),
    images: list(row.images) as string[],
    duration_label: text(row.duration_label),
    duration_days: Number(row.duration_days ?? 1),
    price_usd: numOrNull(row.price_usd),
    discount_price_usd: numOrNull(row.discount_price_usd),
    price_note: text(row.price_note),
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
    overview: list(row.overview) as string[],
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
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
