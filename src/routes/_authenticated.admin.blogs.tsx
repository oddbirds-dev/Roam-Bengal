import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AdminButton, AdminPage, ConfirmButton, EmptyState, ErrorBanner, ListTable, StatusBadge, Td, ViewPublicLink, toast, useAction } from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import { NumberField, RelatedContentField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { AdminIcon } from "@/components/admin/icons";
import { ImageField } from "@/components/admin/image-upload";
import { invalidateLinkTargets } from "@/components/admin/link-picker";
import { adminDeletePost, adminListPosts, adminUpsertPost } from "@/lib/admin-content.functions";
import { postPreviewChannel } from "@/lib/post-preview";
import { toPostDTO } from "@/lib/post-dto";
import { slugify } from "@/lib/slugify";
import { getErrorMessage } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/blogs")({ loader: () => adminListPosts(), component: BlogsScreen });
type Row = Awaited<ReturnType<typeof adminListPosts>>[number];

function BlogsScreen() {
  const rows = Route.useLoaderData(); const router = useRouter(); const [editingId, setEditingId] = useState<string | null>(null);
  async function remove(row: Row) { try { await adminDeletePost({ data: { id: row.id } }); invalidateLinkTargets(); await router.invalidate(); toast.success(`${row.title} deleted`); } catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); } }
  if (editingId !== null) return <RowForm row={rows.find((r) => r.id === editingId)} onBack={() => setEditingId(null)} />;
  return <AdminPage title="Blogs" subtitle={`${rows.length} post${rows.length === 1 ? "" : "s"}, drafts included`} action={<AdminButton onClick={() => setEditingId("new")}><AdminIcon name="plus" className="mr-1.5 h-[15px] w-[15px]" />New post</AdminButton>}>
    {rows.length === 0 ? <EmptyState>No posts yet. Press &ldquo;New post&rdquo; to write your first one.</EmptyState> : <ListTable head={["Title", "Category", "Author", "Status"]}>{rows.map((row) => <tr key={row.id} className="hover:bg-cream/50">
      <Td><button type="button" onClick={() => setEditingId(row.id)} className="text-left font-semibold text-green-dark hover:text-green hover:underline">{row.title || "Untitled"}</button><div className="mt-0.5 font-mono text-[0.72rem] text-muted">/{row.slug}</div></Td>
      <Td className="text-muted">{row.category ?? "—"}</Td><Td className="text-muted">{row.author_name ?? "—"}</Td>
      <Td><span className="flex flex-wrap gap-1.5"><StatusBadge tone={row.is_published ? "published" : "draft"}>{row.is_published ? "Published" : "Draft"}</StatusBadge>{row.is_featured ? <StatusBadge tone="accent">Featured</StatusBadge> : null}</span></Td>
      <Td className="text-right"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setEditingId(row.id)} className="inline-flex items-center gap-1.5 rounded-[30px] border-[1.5px] border-rule px-4 py-1.5 text-[0.78rem] font-semibold hover:border-green hover:text-green"><AdminIcon name="pencil" className="h-[13px] w-[13px]" />Edit</button><ConfirmButton title={`Delete ${row.title}?`} description="The article will be removed from your website for good." onConfirm={() => remove(row)} /></div></Td>
    </tr>)}</ListTable>}
    <div className="mt-6"><ViewPublicLink href="/blog">View public blog page</ViewPublicLink></div>
  </AdminPage>;
}

function blank(row?: Row) { return { slug: row?.slug ?? "", title: row?.title ?? "", excerpt: row?.excerpt ?? "", body: Array.isArray(row?.body) ? (row.body as string[]).join("\n\n") : "", category: row?.category ?? "", date_label: row?.date_label ?? "", read_time: row?.read_time ?? "", cover_image: row?.cover_image ?? "", cover_image_alt: row?.cover_image_alt ?? "", cover_image_title: row?.cover_image_title ?? "", cover_image_description: row?.cover_image_description ?? "", author_name: row?.author_name ?? "", author_role: row?.author_role ?? "", author_avatar: row?.author_avatar ?? "", author_avatar_alt: row?.author_avatar_alt ?? "", author_avatar_title: row?.author_avatar_title ?? "", author_avatar_description: row?.author_avatar_description ?? "", related_slugs: row?.related_slugs ?? [], is_featured: row?.is_featured ?? false, is_published: row?.is_published ?? true, sort_order: row?.sort_order ?? 0 }; }
type Form = ReturnType<typeof blank>;

function RowForm({ row, onBack }: { row?: Row; onBack: () => void }) {
  const router = useRouter(); const { run, busy, error } = useAction(); const [v, setV] = useState<Form>(() => blank(row)); const [slugTouched, setSlugTouched] = useState(Boolean(row?.slug));
  const saved = useMemo(() => blank(row), [row]);
  const dirty = useMemo(() => !row || (Object.keys(saved) as (keyof Form)[]).some((k) => k === "related_slugs" ? JSON.stringify(v[k]) !== JSON.stringify(saved[k]) : v[k] !== saved[k]), [v, saved, row]);
  const payload = { ...v, body: v.body.trim() ? [v.body] : [] };
  async function save() { const ok = await run(() => adminUpsertPost({ data: { ...(row ? { id: row.id } : {}), post: { ...payload, slug: v.slug.trim() || slugify(v.title), excerpt: v.excerpt || null, category: v.category || null, date_label: v.date_label || null, read_time: v.read_time || null, cover_image: v.cover_image || null, cover_image_alt: v.cover_image_alt || null, cover_image_title: v.cover_image_title || null, cover_image_description: v.cover_image_description || null, author_name: v.author_name || null, author_role: v.author_role || null, author_avatar: v.author_avatar || null, author_avatar_alt: v.author_avatar_alt || null, author_avatar_title: v.author_avatar_title || null, author_avatar_description: v.author_avatar_description || null } as never } })); if (!ok) return; invalidateLinkTargets(); await router.invalidate(); toast.success(row ? "Post saved" : "Post added"); onBack(); }
  async function remove() { if (!row) return; try { await adminDeletePost({ data: { id: row.id } }); invalidateLinkTargets(); await router.invalidate(); toast.success("Post deleted"); onBack(); } catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); } }
  const set = <K extends keyof Form>(k: K, x: Form[K]) => setV((p) => ({ ...p, [k]: x }));
  return <EditorShell title={row ? "Edit post" : "New post"} blurb={v.title || "Write a post"} previewPath={`/blog/${v.slug || "new"}`} previewChannel={postPreviewChannel} previewDraft={toPostDTO({ ...payload, id: row?.id ?? "preview" })} dirty={dirty} saving={busy} onSave={save} onDiscard={() => { setV(blank(row)); setSlugTouched(Boolean(row?.slug)); }} onBack={onBack} backLabel="Blogs" footer={row ? <ConfirmButton title={`Delete ${row.title}?`} description="The article will be removed from your website for good." onConfirm={remove}>Delete post</ConfirmButton> : null}>
    <ErrorBanner error={error} /><div className="mt-4 flex flex-col gap-5"><div className="grid gap-5 sm:grid-cols-2">
      <TextField label="Title" required value={v.title} onChange={(title) => setV((p) => ({ ...p, title, slug: slugTouched ? p.slug : slugify(title) }))} /><TextField label="Web address" mono value={v.slug} onChange={(slug) => { setSlugTouched(true); set("slug", slugify(slug)); }} />
      <TextField label="Category" value={v.category} onChange={(x) => set("category", x)} /><TextField label="Read time" value={v.read_time} onChange={(x) => set("read_time", x)} /><TextField label="Author" value={v.author_name} onChange={(x) => set("author_name", x)} /><TextField label="Author role" value={v.author_role} onChange={(x) => set("author_role", x)} /><TextField label="Date label" value={v.date_label} onChange={(x) => set("date_label", x)} /><NumberField label="Order" min={0} value={v.sort_order} onChange={(x) => set("sort_order", x ?? 0)} />
    </div><TextArea label="Excerpt" rows={3} plain value={v.excerpt} onChange={(x) => set("excerpt", x)} /><ImageField label="Cover image" value={v.cover_image} onChange={(x) => set("cover_image", x)} alt={v.cover_image_alt} onAltChange={(x) => set("cover_image_alt", x)} title={v.cover_image_title} onTitleChange={(x) => set("cover_image_title", x)} description={v.cover_image_description} onDescriptionChange={(x) => set("cover_image_description", x)} /><ImageField label="Author photo" value={v.author_avatar} onChange={(x) => set("author_avatar", x)} alt={v.author_avatar_alt} onAltChange={(x) => set("author_avatar_alt", x)} title={v.author_avatar_title} onTitleChange={(x) => set("author_avatar_title", x)} description={v.author_avatar_description} onDescriptionChange={(x) => set("author_avatar_description", x)} /><TextArea label="Article" rows={12} value={v.body} onChange={(x) => set("body", x)} /><RelatedContentField label="Related posts" kind="post" values={v.related_slugs} onChange={(x) => set("related_slugs", x)} /><div className="flex flex-wrap gap-8"><Toggle label="Published" checked={v.is_published} onChange={(x) => set("is_published", x)} /><Toggle label="Featured" hint="The large card at the top of /blog." checked={v.is_featured} onChange={(x) => set("is_featured", x)} /></div></div>
  </EditorShell>;
}
