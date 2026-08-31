import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AdminButton, AdminPage, ConfirmButton, EmptyState, ErrorBanner, ListTable, Td, ViewPublicLink, toast, useAction } from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import { NumberField, TextArea, TextField } from "@/components/admin/fields";
import { AdminIcon } from "@/components/admin/icons";
import { adminDeleteActivity, adminListActivities, adminUpsertActivity } from "@/lib/admin-content.functions";
import { activityPreviewChannel } from "@/lib/activity-preview";
import type { ActivityDTO } from "@/lib/content-types";
import { getErrorMessage } from "@/lib/utils";
import { slugify } from "@/lib/slugify";

export const Route = createFileRoute("/_authenticated/admin/activities")({ loader: () => adminListActivities(), component: ActivitiesScreen });
type Row = Awaited<ReturnType<typeof adminListActivities>>[number];

function ActivitiesScreen() {
  const rows = Route.useLoaderData();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  async function remove(row: Row) {
    try { await adminDeleteActivity({ data: { id: row.id } }); await router.invalidate(); toast.success(`${row.name} deleted`); }
    catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); }
  }
  if (editingId !== null) return <RowForm row={rows.find((r) => r.id === editingId)} onBack={() => setEditingId(null)} />;
  return (
    <AdminPage title="Activities" subtitle="These double as the filter pills on the tours page. Assign them to a tour from the tour editor." action={<AdminButton onClick={() => setEditingId("new")}><AdminIcon name="plus" className="mr-1.5 h-[15px] w-[15px]" />New activity</AdminButton>}>
      {rows.length === 0 ? <EmptyState>No activities yet. Press &ldquo;New activity&rdquo; to add your first one.</EmptyState> : (
        <ListTable head={["Name", "Description", "Order"]} footNote="Deleting an activity also removes it from every tour that used it.">
          {rows.map((row) => <tr key={row.id} className="hover:bg-cream/50">
            <Td><button type="button" onClick={() => setEditingId(row.id)} className="text-left font-semibold text-green-dark hover:text-green hover:underline">{row.name}</button><div className="mt-0.5 font-mono text-[0.72rem] text-muted">/{row.slug}</div></Td>
            <Td className="max-w-sm truncate text-muted">{row.description ?? "—"}</Td><Td className="text-muted">{row.sort_order}</Td>
            <Td className="text-right"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setEditingId(row.id)} className="inline-flex items-center gap-1.5 rounded-[30px] border-[1.5px] border-rule px-4 py-1.5 text-[0.78rem] font-semibold transition-colors hover:border-green hover:text-green"><AdminIcon name="pencil" className="h-[13px] w-[13px]" />Edit</button><ConfirmButton title={`Delete ${row.name}?`} description="Tours tagged with this activity will lose the tag. This cannot be undone." onConfirm={() => remove(row)} /></div></Td>
          </tr>)}
        </ListTable>
      )}
      <div className="mt-6"><ViewPublicLink href="/tours">View activities on the tours page</ViewPublicLink></div>
    </AdminPage>
  );
}

function blank(row?: Row) { return { slug: row?.slug ?? "", name: row?.name ?? "", description: row?.description ?? "", sort_order: row?.sort_order ?? 0 }; }
type Form = ReturnType<typeof blank>;

function RowForm({ row, onBack }: { row?: Row; onBack: () => void }) {
  const router = useRouter();
  const { run, busy, error } = useAction();
  const [v, setV] = useState<Form>(() => blank(row));
  const [slugTouched, setSlugTouched] = useState(Boolean(row?.slug));
  const saved = useMemo(() => blank(row), [row]);
  const dirty = useMemo(() => !row || (Object.keys(saved) as (keyof Form)[]).some((k) => v[k] !== saved[k]), [v, saved, row]);
  const draft: ActivityDTO = { id: row?.id ?? "preview-activity", slug: v.slug, name: v.name, description: v.description || null };
  async function save() {
    const ok = await run(() => adminUpsertActivity({ data: { ...(row ? { id: row.id } : {}), activity: { ...v, slug: v.slug.trim() || slugify(v.name), description: v.description || null } as never } }));
    if (!ok) return; toast.success(row ? "Activity saved" : "Activity added"); onBack();
  }
  async function remove() {
    if (!row) return;
    try { await adminDeleteActivity({ data: { id: row.id } }); await router.invalidate(); toast.success("Activity deleted"); onBack(); }
    catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); }
  }
  return <EditorShell title={row ? "Edit activity" : "New activity"} blurb={v.name || "Fill out the details below."} previewPath="/tours" previewChannel={activityPreviewChannel} previewDraft={draft} dirty={dirty} saving={busy} onSave={save} onDiscard={() => { setV(blank(row)); setSlugTouched(Boolean(row?.slug)); }} onBack={onBack} backLabel="Activities" footer={row ? <ConfirmButton title={`Delete ${row.name}?`} description="Tours tagged with this activity will lose the tag. This cannot be undone." onConfirm={remove}>Delete activity</ConfirmButton> : null}>
    <ErrorBanner error={error} />
    <div className="mt-4 grid gap-5 sm:grid-cols-2">
      <TextField label="Name" required value={v.name} onChange={(name) => setV((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }))} />
      <TextField label="Web address" mono hint="Used by the tours filter." value={v.slug} onChange={(slug) => { setSlugTouched(true); setV((p) => ({ ...p, slug: slugify(slug) })); }} />
      <NumberField label="Order" hint="Lower numbers appear first." min={0} value={v.sort_order} onChange={(sort_order) => setV((p) => ({ ...p, sort_order: sort_order ?? 0 }))} />
      <div className="sm:col-span-2"><TextArea label="Description" rows={3} value={v.description} onChange={(description) => setV((p) => ({ ...p, description }))} /></div>
    </div>
  </EditorShell>;
}
