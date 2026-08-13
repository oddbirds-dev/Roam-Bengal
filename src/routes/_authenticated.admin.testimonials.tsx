import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminButton,
  Badge,
  Card,
  DeleteButton,
  ErrorBanner,
  PageHeader,
  SavedNote,
  Table,
  Td,
  useAction,
} from "@/components/admin/admin-ui";
import {
  NumberField,
  SelectField,
  TextArea,
  TextField,
  Toggle,
} from "@/components/admin/fields";
import { GalleryField, ImageField } from "@/components/admin/image-upload";
import { EmbeddedPreview } from "@/components/admin/preview-pane";
import {
  adminDeleteTestimonial,
  adminListTestimonials,
  adminUpsertTestimonial,
} from "@/lib/admin-content.functions";
import { testimonialPreviewChannel } from "@/lib/testimonial-preview";
import { toTestimonialDTO } from "@/lib/testimonial-dto";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  loader: () => adminListTestimonials(),
  component: TestimonialsScreen,
});

const PLATFORMS = [
  { value: "direct", label: "Direct" },
  { value: "tripadvisor", label: "Tripadvisor" },
  { value: "google", label: "Google" },
  { value: "trustpilot", label: "Trustpilot" },
  { value: "facebook", label: "Facebook" },
] as const;

function blank() {
  return {
    author: "",
    location: "",
    headline: "",
    quote: "",
    tour_label: "",
    platform: "direct" as (typeof PLATFORMS)[number]["value"],
    avatar_url: "",
    images: [] as string[],
    rating: 5 as number | null,
    is_featured: false,
    is_published: true,
    sort_order: 0,
  };
}

type Form = ReturnType<typeof blank>;

function TestimonialsScreen() {
  const rows = Route.useLoaderData();
  const { run, busy, error, saved } = useAction();
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);

  async function save() {
    if (!editing) return;
    const ok = await run(() =>
      adminUpsertTestimonial({
        data: { ...(editing.id ? { id: editing.id } : {}), testimonial: editing.form as never },
      }),
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="The curated testimonials shown on the site. Aggregate scores and platform badges live in Settings → reviews."
        actions={<AdminButton onClick={() => setEditing({ form: blank() })}>+ New review</AdminButton>}
      />

      <ErrorBanner error={error} />

      {editing ? (
        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <Card title={editing.id ? "Edit review" : "New review"}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Author"
                required
                value={editing.form.author}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, author: v } })}
              />
              <TextField
                label="Location"
                placeholder="UK"
                value={editing.form.location}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, location: v } })}
              />
              <TextField
                label="Tour label"
                placeholder="Sundarbans Wildlife Tour — 4 Days"
                value={editing.form.tour_label}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, tour_label: v } })
                }
              />
              <SelectField
                label="Platform"
                value={editing.form.platform}
                options={PLATFORMS}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, platform: v } })}
              />
              <NumberField
                label="Rating (1–5)"
                min={1}
                max={5}
                value={editing.form.rating}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, rating: v } })}
              />
              <NumberField
                label="Sort order"
                min={0}
                value={editing.form.sort_order}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, sort_order: v ?? 0 } })
                }
              />
            </div>

            <TextField
              label="Headline"
              hint="The short pull-quote. Shown on cards in place of the full review."
              value={editing.form.headline}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, headline: v } })}
            />

            <TextArea
              label="Review"
              rows={4}
              value={editing.form.quote}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, quote: v } })}
            />

            <ImageField
              label="Photo"
              value={editing.form.avatar_url}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, avatar_url: v } })}
            />

            <GalleryField
              label="Extra photos"
              values={editing.form.images}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, images: v } })}
            />

            <div className="flex flex-wrap gap-8">
              <Toggle
                label="Published"
                checked={editing.form.is_published}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, is_published: v } })
                }
              />
              <Toggle
                label="Featured"
                hint="Featured reviews are the three on the homepage."
                checked={editing.form.is_featured}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, is_featured: v } })
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <AdminButton onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save review"}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <SavedNote show={saved && !error} />
            </div>
          </Card>

          <EmbeddedPreview
            channel={testimonialPreviewChannel}
            draft={toTestimonialDTO({ ...editing.form, id: editing.id ?? "preview" })}
            path="/reviews"
            label="Preview · /reviews"
            height="700px"
          />
        </div>
      ) : null}

      <Table head={["Author", "Tour", "Rating", "Status", ""]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <Td>
              <button
                type="button"
                onClick={() => setEditing({ id: row.id, form: hydrate(row) })}
                className="text-left font-semibold text-green-dark hover:text-green hover:underline"
              >
                {row.author}
              </button>
              <span className="mt-0.5 block text-[0.74rem] text-muted">{row.location ?? "—"}</span>
            </Td>
            <Td className="text-muted">{row.tour_label ?? "—"}</Td>
            <Td className="text-gold">{"★".repeat(row.rating ?? 0)}</Td>
            <Td>
              <span className="flex flex-wrap gap-1.5">
                {row.is_published ? (
                  <Badge tone="green">Published</Badge>
                ) : (
                  <Badge tone="muted">Hidden</Badge>
                )}
                {row.is_featured ? <Badge tone="orange">Homepage</Badge> : null}
              </span>
            </Td>
            <Td className="text-right">
              <DeleteButton
                disabled={busy}
                onConfirm={() => run(() => adminDeleteTestimonial({ data: { id: row.id } }))}
              />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function hydrate(row: Record<string, unknown>): Form {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    author: text(row.author),
    location: text(row.location),
    headline: text(row.headline),
    quote: text(row.quote),
    tour_label: text(row.tour_label),
    platform: (text(row.platform) || "direct") as Form["platform"],
    avatar_url: text(row.avatar_url),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
  };
}
