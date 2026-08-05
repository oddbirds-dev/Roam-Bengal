import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminButton, ErrorBanner, useAction } from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
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
  adminListDestinations,
  adminSetTourThemes,
  adminUpsertTour,
} from "@/lib/admin-content.functions";
import { listTourThemes } from "@/lib/site-content.functions";
import { TOUR_FACT_KEYS, TOUR_FACT_META, type TourCategory } from "@/lib/content-types";
import { toTourDTO } from "@/lib/tour-dto";
import { PREVIEW_READY_MESSAGE, sendTourDraft } from "@/lib/tour-preview";

export const Route = createFileRoute("/_authenticated/admin/tours/$id")({
  loader: async ({ params }) => {
    const isNew = params.id === "new";
    const [tour, activities, destinations, themes] = await Promise.all([
      isNew ? Promise.resolve(null) : adminGetTour({ data: { id: params.id } }),
      adminListActivities(),
      adminListDestinations(),
      listTourThemes(),
    ]);
    return { tour, activities, destinations, themes, isNew };
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
    price_bdt: null as number | null,
    discount_price_usd: null as number | null,
    child_price_usd: null as number | null,
    discount_child_price_usd: null as number | null,
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

/** Everything the Discard button has to put back, and the basis for the dirty check. */
interface EditorState {
  form: TourForm;
  themeIds: string[];
}

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: "desktop", width: "100%" },
  { id: "tablet", label: "Tablet", icon: "tablet", width: "834px" },
  { id: "mobile", label: "Mobile", icon: "mobile", width: "390px" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

function TourEditor() {
  const { tour, activities, destinations, themes, isNew } = Route.useLoaderData();
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

  // Dirty tracking compares against the last committed state rather than a boolean flag,
  // so undoing an edit by hand correctly reports "Everything is saved" again.
  const [baseline, setBaseline] = useState(() => serialize({ form, themeIds }));
  const current = useMemo(() => serialize({ form, themeIds }), [form, themeIds]);
  const dirty = current !== baseline;

  const [previewOpen, setPreviewOpen] = useState(true);
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const [frameSlug, setFrameSlug] = useState(() => previewSlug(form));
  const frameRef = useRef<HTMLIFrameElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  // The preview renders the *unsaved* form, mapped through the same row → DTO function
  // the public loader uses, so what the pane shows is what saving would produce.
  const draftTour = useMemo(
    () => toTourDTO({ ...form, id: tour?.id ?? "preview" }),
    [form, tour?.id],
  );
  const draftRef = useRef(draftTour);
  draftRef.current = draftTour;

  // Debounced: typing a title should not post thirty messages a second.
  useEffect(() => {
    if (!previewOpen) return;
    const id = window.setTimeout(() => sendTourDraft(frameRef.current, draftTour), 180);
    return () => window.clearTimeout(id);
  }, [draftTour, previewOpen]);

  // The iframe finishes loading long after this component mounted, so it announces
  // itself and gets whatever the form holds at that moment.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type !== PREVIEW_READY_MESSAGE) return;
      sendTourDraft(frameRef.current, draftRef.current);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function reloadPreview() {
    setFrameSlug(previewSlug(form));
    setFrameKey((k) => k + 1);
  }

  /** Drag the divider. The iframe stops swallowing the pointer while this runs. */
  function startResize(event: React.PointerEvent) {
    const bounds = splitRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    setDragging(true);

    const onMove = (e: PointerEvent) => {
      const pct = ((e.clientX - bounds.left) / bounds.width) * 100;
      setSplit(Math.min(72, Math.max(28, pct)));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function discard() {
    const previous = JSON.parse(baseline) as EditorState;
    setForm(previous.form);
    setThemeIds(previous.themeIds);
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

    setForm((f) => ({ ...f, slug: payload.slug }));
    setBaseline(serialize({ form: payload, themeIds }));
    reloadPreview();

    // A new tour lives at a placeholder route until it has an id.
    if (isNew) await navigate({ to: "/admin/tours/$id", params: { id: result.id } });
  }

  return (
    <div className="fixed inset-0 top-[68px] z-10 flex flex-col bg-[#F6F8F6] lg:left-[260px]">
      <div
        ref={splitRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
        style={{ ["--form-split" as string]: previewOpen ? `${split}%` : "100%" }}
      >
        {/* Form pane */}
        <div className="min-h-0 w-full flex-1 overflow-y-auto lg:w-[var(--form-split)] lg:flex-none">
          <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
            <Link
              to="/admin/tours"
              className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-muted transition-colors hover:text-green"
            >
              ← Tours
            </Link>
            <h1 className="mt-4 font-display text-[2rem] font-bold text-green-dark italic">
              {isNew ? "New tour" : "Edit tour"}
            </h1>
            <p className="mt-1 text-[0.86rem] text-muted">
              {isNew
                ? "Fill in the basics — you can add detail after saving."
                : form.title || "Untitled tour"}
            </p>

            {error ? (
              <div className="mt-5">
                <ErrorBanner error={error} />
              </div>
            ) : null}

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

                <TextArea
                  label="Summary"
                  hint="The paragraph on tour cards."
                  rows={3}
                  value={form.summary}
                  onChange={(v) => set("summary", v)}
                />

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

              <FormSection title="Pricing">
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
              </FormSection>

              <FormSection
                title="Rating & ordering"
                description="Social proof and the four figures on a tour card."
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

              <FormSection title="Images">
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
              </FormSection>

              <FormSection
                title="Themes"
                description="Drives the filter pills on the public /tours page."
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

              <FormSection
                title="Trip facts"
                description="Any field left blank falls back to a derived default."
              >
                <KeyValueField
                  label="Facts"
                  keys={TOUR_FACT_KEYS}
                  labels={TOUR_FACT_META}
                  values={form.facts}
                  onChange={(v) => set("facts", v)}
                />
              </FormSection>

              <FormSection title="Overview & highlights">
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
              </FormSection>

              <FormSection title="Itinerary">
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
              </FormSection>

              <FormSection title="What's included">
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
              </FormSection>

              <FormSection title="Advice & responsibilities">
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
                <StringListField
                  label="Why choose us for this tour"
                  values={form.why_items}
                  onChange={(v) => set("why_items", v)}
                />
              </FormSection>

              <FormSection title="FAQs, map & video">
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
              </FormSection>
            </div>
          </div>
        </div>

        {/* Divider */}
        {previewOpen ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview"
            onPointerDown={startResize}
            className="group hidden w-3 shrink-0 cursor-col-resize items-center justify-center border-x border-rule bg-paper transition-colors hover:bg-mint lg:flex"
          >
            <span className="flex flex-col gap-[3px]" aria-hidden="true">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-[3px] w-[3px] rounded-full bg-muted/50 group-hover:bg-green"
                />
              ))}
            </span>
          </div>
        ) : null}

        {/* Preview pane */}
        {previewOpen ? (
          <div className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-rule bg-paper px-4">
              <span className="truncate text-[0.65rem] font-bold tracking-widest text-muted uppercase">
                Preview · /tours/{form.slug || slugify(form.title) || "new"}
              </span>
              <div className="flex items-center gap-1 text-muted">
                {DEVICES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-label={d.label}
                    aria-pressed={device === d.id}
                    title={d.label}
                    onClick={() => setDevice(d.id)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      device === d.id ? "bg-mint text-green" : "hover:text-ink"
                    }`}
                  >
                    <AdminIcon name={d.icon} className="h-[17px] w-[17px]" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={reloadPreview}
                  aria-label="Reload preview"
                  title="Reload preview"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-ink"
                >
                  <AdminIcon name="refresh" className="h-[17px] w-[17px]" />
                </button>
                <a
                  href={`/tours/${form.slug || slugify(form.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the live page"
                  title="Open the live page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-ink"
                >
                  <AdminIcon name="external" className="h-[17px] w-[17px]" />
                </a>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 justify-center overflow-hidden p-4">
              <div
                className="h-full w-full overflow-hidden rounded-xl border border-rule bg-white shadow-sm"
                style={{ maxWidth: DEVICES.find((d) => d.id === device)?.width }}
              >
                <iframe
                  key={frameKey}
                  ref={frameRef}
                  src={`/tours/${frameSlug}?preview=1`}
                  title="Tour preview"
                  // A dragged pointer must not disappear into the iframe's document.
                  className={`h-full w-full border-none ${dragging ? "pointer-events-none" : ""}`}
                />
              </div>
            </div>

            <p className="shrink-0 border-t border-rule bg-paper px-4 py-2.5 text-[0.76rem] text-muted">
              This is a preview of your unsaved changes. Nothing is live until you press Save.
            </p>
          </div>
        ) : null}
      </div>

      {/* Action bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-t border-rule bg-white px-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:px-6">
        <div className="flex items-center gap-5 text-[0.85rem] text-muted">
          <span className={dirty ? "font-semibold text-ink" : ""}>
            {busy ? "Saving…" : dirty ? "Unsaved changes" : "Everything is saved"}
          </span>
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            className="hidden items-center gap-1.5 transition-colors hover:text-ink lg:flex"
          >
            <AdminIcon name={previewOpen ? "eyeOff" : "eye"} className="h-4 w-4" />
            {previewOpen ? "Hide preview" : "Show preview"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="secondary" onClick={discard} disabled={!dirty || busy}>
            Discard
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || (!dirty && !isNew)}>
            {busy ? "Saving…" : saved && !dirty ? "Saved" : "Save changes"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

/** A titled block of fields. Flat by design — cards buried the form in chrome. */
function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={title ? "border-t border-rule pt-7" : ""}>
      {title ? (
        <header className="mb-5">
          <h2 className="font-display text-[1.05rem] font-bold text-green-dark">{title}</h2>
          {description ? <p className="mt-1 text-[0.8rem] text-muted">{description}</p> : null}
        </header>
      ) : null}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
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
    summary: text(row.summary),
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
