import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AdminButton, AdminPage, ConfirmButton, EmptyState, ErrorBanner, ListTable, StatusBadge, Td, ViewPublicLink, toast, useAction } from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import { NumberField, SelectField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { AdminIcon } from "@/components/admin/icons";
import { GalleryField, ImageField } from "@/components/admin/image-upload";
import { adminDeleteTestimonial, adminListTestimonials, adminUpsertTestimonial } from "@/lib/admin-content.functions";
import { testimonialPreviewChannel } from "@/lib/testimonial-preview";
import { toTestimonialDTO } from "@/lib/testimonial-dto";
import { getErrorMessage } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ loader: () => adminListTestimonials(), component: ReviewsScreen });
type Row = Awaited<ReturnType<typeof adminListTestimonials>>[number];
const PLATFORMS = [{ value: "direct", label: "Direct" }, { value: "tripadvisor", label: "Tripadvisor" }, { value: "google", label: "Google" }, { value: "trustpilot", label: "Trustpilot" }, { value: "facebook", label: "Facebook" }] as const;

function ReviewsScreen() {
  const rows = Route.useLoaderData(); const router = useRouter(); const [editingId, setEditingId] = useState<string | null>(null);
  async function remove(row: Row) { try { await adminDeleteTestimonial({ data: { id: row.id } }); await router.invalidate(); toast.success(`Review from ${row.author} deleted`); } catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); } }
  if (editingId !== null) return <RowForm row={rows.find((r) => r.id === editingId)} onBack={() => setEditingId(null)} />;
  return <AdminPage title="Reviews" subtitle="The curated guest reviews shown on the homepage and Reviews page." action={<AdminButton onClick={() => setEditingId("new")}><AdminIcon name="plus" className="mr-1.5 h-[15px] w-[15px]" />Add review</AdminButton>}>
    {rows.length === 0 ? <EmptyState>No reviews yet. Press &ldquo;Add review&rdquo; to add one.</EmptyState> : <ListTable head={["Guest", "Rating", "Platform", "Status"]}>{rows.map((row) => <tr key={row.id} className="hover:bg-cream/50">
      <Td><button type="button" onClick={() => setEditingId(row.id)} className="text-left font-semibold text-green-dark hover:text-green hover:underline">{row.author || "Unnamed guest"}</button><div className="mt-0.5 text-[0.72rem] text-muted">{row.location || "No location"}</div></Td>
      <Td className="whitespace-nowrap text-muted"><span className="mr-1 text-gold">★</span>{row.rating ?? "—"}</Td><Td className="capitalize text-muted">{row.platform ?? "direct"}</Td>
      <Td><span className="flex flex-wrap gap-1.5"><StatusBadge tone={row.is_published ? "published" : "draft"}>{row.is_published ? "Published" : "Hidden"}</StatusBadge>{row.is_featured ? <StatusBadge tone="accent">Homepage</StatusBadge> : null}</span></Td>
      <Td className="text-right"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setEditingId(row.id)} className="inline-flex items-center gap-1.5 rounded-[30px] border-[1.5px] border-rule px-4 py-1.5 text-[0.78rem] font-semibold hover:border-green hover:text-green"><AdminIcon name="pencil" className="h-[13px] w-[13px]" />Edit</button><ConfirmButton title={`Delete review from ${row.author}?`} description="It will be removed from your website for good." onConfirm={() => remove(row)} /></div></Td>
    </tr>)}</ListTable>}
    <div className="mt-6"><ViewPublicLink href="/reviews">View public reviews page</ViewPublicLink></div>
  </AdminPage>;
}

function blank(row?: Row) { return { author: row?.author ?? "", location: row?.location ?? "", headline: row?.headline ?? "", quote: row?.quote ?? "", tour_label: row?.tour_label ?? "", platform: (row?.platform ?? "direct") as (typeof PLATFORMS)[number]["value"], avatar_url: row?.avatar_url ?? "", images: row?.images ?? [], rating: row?.rating ?? 5 as number | null, is_featured: row?.is_featured ?? false, is_published: row?.is_published ?? true, sort_order: row?.sort_order ?? 0 }; }
type Form = ReturnType<typeof blank>;

function RowForm({ row, onBack }: { row?: Row; onBack: () => void }) {
  const router = useRouter(); const { run, busy, error } = useAction(); const [v, setV] = useState<Form>(() => blank(row)); const saved = useMemo(() => blank(row), [row]);
  const dirty = useMemo(() => !row || (Object.keys(saved) as (keyof Form)[]).some((k) => k === "images" ? JSON.stringify(v[k]) !== JSON.stringify(saved[k]) : v[k] !== saved[k]), [v, saved, row]);
  const set = <K extends keyof Form>(k: K, x: Form[K]) => setV((p) => ({ ...p, [k]: x }));
  async function save() { const ok = await run(() => adminUpsertTestimonial({ data: { ...(row ? { id: row.id } : {}), testimonial: { ...v, location: v.location || null, headline: v.headline || null, tour_label: v.tour_label || null, avatar_url: v.avatar_url || null } as never } })); if (!ok) return; await router.invalidate(); toast.success(row ? "Review saved" : "Review added"); onBack(); }
  async function remove() { if (!row) return; try { await adminDeleteTestimonial({ data: { id: row.id } }); await router.invalidate(); toast.success("Review deleted"); onBack(); } catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); } }
  return <EditorShell title={row ? "Edit review" : "Add a review"} blurb={v.author || "Manage the details of this review."} previewPath="/reviews" previewChannel={testimonialPreviewChannel} previewDraft={toTestimonialDTO({ ...v, id: row?.id ?? "preview" })} dirty={dirty} saving={busy} onSave={save} onDiscard={() => setV(blank(row))} onBack={onBack} backLabel="Reviews" footer={row ? <ConfirmButton title={`Delete review from ${row.author}?`} description="It will be removed from your website for good." onConfirm={remove}>Delete review</ConfirmButton> : null}>
    <ErrorBanner error={error} /><div className="mt-4 flex flex-col gap-5"><div className="grid gap-5 sm:grid-cols-2">
      <TextField label="Guest name" required value={v.author} onChange={(x) => set("author", x)} /><TextField label="Where they're from" value={v.location} onChange={(x) => set("location", x)} /><TextField label="Tour label" value={v.tour_label} onChange={(x) => set("tour_label", x)} /><SelectField label="Platform" value={v.platform} options={PLATFORMS} onChange={(x) => set("platform", x)} /><NumberField label="Rating (1–5)" min={1} max={5} value={v.rating} onChange={(x) => set("rating", x)} /><NumberField label="Order" min={0} value={v.sort_order} onChange={(x) => set("sort_order", x ?? 0)} />
    </div><TextField label="Headline" value={v.headline} onChange={(x) => set("headline", x)} /><TextArea label="Review" rows={4} plain value={v.quote} onChange={(x) => set("quote", x)} /><ImageField label="Guest photo" value={v.avatar_url} onChange={(x) => set("avatar_url", x)} /><GalleryField label="Extra photos" values={v.images} onChange={(x) => set("images", x)} /><div className="flex flex-wrap gap-8"><Toggle label="Show on the website" checked={v.is_published} onChange={(x) => set("is_published", x)} /><Toggle label="Featured on homepage" checked={v.is_featured} onChange={(x) => set("is_featured", x)} /></div></div>
  </EditorShell>;
}
