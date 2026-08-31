import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AdminPage, ConfirmButton, EmptyState, ListTable, StatusBadge, Td, ViewPublicLink, toast } from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { invalidateLinkTargets } from "@/components/admin/link-picker";
import { adminDeleteTour, adminListTours } from "@/lib/admin-content.functions";
import { getErrorMessage } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/tours/")({ loader: () => adminListTours(), component: ToursList });

function ToursList() {
  const rows = Route.useLoaderData(); const router = useRouter();
  async function remove(id: string, title: string) { try { await adminDeleteTour({ data: { id } }); invalidateLinkTargets(); await router.invalidate(); toast.success(`${title} deleted`); } catch (e) { toast.error(getErrorMessage(e, "Could not delete. Please try again.")); } }
  return <AdminPage title="Tours" subtitle={`${rows.length} tour${rows.length === 1 ? "" : "s"}, drafts included`} action={<div className="flex flex-wrap gap-2"><Link to="/admin/tours/$id" params={{ id: "new" }} search={{ category: "day-tour" }} className="inline-flex items-center rounded-[30px] border-[1.5px] border-rule bg-paper px-5 py-2.5 text-[0.84rem] font-semibold hover:border-green hover:text-green">+ Single day</Link><Link to="/admin/tours/$id" params={{ id: "new" }} search={{ category: "multi-day" }} className="inline-flex items-center rounded-[30px] bg-green-dark px-5 py-2.5 text-[0.84rem] font-semibold text-white hover:bg-green">+ Multi-day</Link></div>}>
    {rows.length === 0 ? <EmptyState>No tours yet. Choose a tour type above to create your first one.</EmptyState> : <ListTable head={["Title", "Destination", "Days", "From", "Status"]} footNote={<>Deleting a tour is permanent and also removes its theme links. To take one off the website without losing it, open it and switch off <strong>Published</strong>.</>}>
      {rows.map((row) => <tr key={row.id} className="hover:bg-cream/50"><Td><Link to="/admin/tours/$id" params={{ id: row.id }} className="font-semibold text-green-dark hover:text-green hover:underline">{row.title}</Link><div className="mt-0.5 font-mono text-[0.72rem] text-muted">/{row.slug}</div></Td><Td className="text-muted">{row.destination_label ?? "—"}</Td><Td>{row.duration_days}</Td><Td>{row.price_usd === null ? "—" : `$${Number(row.price_usd)}`}</Td><Td><span className="flex flex-wrap gap-1.5"><StatusBadge tone={row.is_published ? "published" : "draft"}>{row.is_published ? "Published" : "Draft"}</StatusBadge>{row.is_featured ? <StatusBadge tone="accent">Featured</StatusBadge> : null}</span></Td><Td className="text-right"><div className="flex items-center justify-end gap-2"><Link to="/admin/tours/$id" params={{ id: row.id }} className="inline-flex items-center gap-1.5 rounded-[30px] border-[1.5px] border-rule px-4 py-1.5 text-[0.78rem] font-semibold hover:border-green hover:text-green"><AdminIcon name="pencil" className="h-[13px] w-[13px]" />Edit</Link><ConfirmButton title={`Delete ${row.title}?`} description="This removes the tour and its theme links for good." onConfirm={() => remove(row.id, row.title)} /></div></Td></tr>)}
    </ListTable>}
    <div className="mt-6"><ViewPublicLink href="/tours">View public tours page</ViewPublicLink></div>
  </AdminPage>;
}
