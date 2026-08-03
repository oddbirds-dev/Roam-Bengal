import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AdminButton,
  Badge,
  DeleteButton,
  ErrorBanner,
  PageHeader,
  Table,
  Td,
  useAction,
} from "@/components/admin/admin-ui";
import { adminDeleteTour, adminListTours } from "@/lib/admin-content.functions";

export const Route = createFileRoute("/_authenticated/admin/tours/")({
  loader: () => adminListTours(),
  component: ToursList,
});

function ToursList() {
  const tours = Route.useLoaderData();
  const { run, busy, error } = useAction();

  return (
    <>
      <PageHeader
        title="Tours"
        subtitle={`${tours.length} tour${tours.length === 1 ? "" : "s"}, drafts included`}
        actions={
          <Link
            to="/admin/tours/$id"
            params={{ id: "new" }}
            className="inline-flex items-center justify-center rounded-[30px] border-[1.5px] border-transparent bg-green-dark px-5 py-2.5 text-[0.84rem] font-semibold text-white hover:bg-green"
          >
            + New tour
          </Link>
        }
      />

      <ErrorBanner error={error} />

      <div className="mt-4">
        <Table
          head={["Title", "Destination", "Days", "From", "Status", ""]}
          empty={tours.length === 0}
        >
          {tours.map((tour) => (
            <tr key={tour.id}>
              <Td>
                <Link
                  to="/admin/tours/$id"
                  params={{ id: tour.id }}
                  className="font-semibold text-green-dark hover:text-green hover:underline"
                >
                  {tour.title}
                </Link>
                <span className="mt-0.5 block font-mono text-[0.72rem] text-muted">
                  /{tour.slug}
                </span>
              </Td>
              <Td className="text-muted">{tour.destination_label ?? "—"}</Td>
              <Td>{tour.duration_days}</Td>
              <Td>{tour.price_usd === null ? "—" : `$${Number(tour.price_usd)}`}</Td>
              <Td>
                <span className="flex flex-wrap gap-1.5">
                  {tour.is_published ? (
                    <Badge tone="green">Published</Badge>
                  ) : (
                    <Badge tone="muted">Draft</Badge>
                  )}
                  {tour.is_featured ? <Badge tone="orange">Featured</Badge> : null}
                </span>
              </Td>
              <Td className="text-right">
                <DeleteButton
                  disabled={busy}
                  onConfirm={() => run(() => adminDeleteTour({ data: { id: tour.id } }))}
                />
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      <p className="mt-4 text-[0.78rem] text-muted">
        Deleting a tour is permanent and also removes its theme links. To take a tour off the
        site without losing it, open it and switch off <strong>Published</strong>.
      </p>
      <div className="mt-4">
        <AdminButton variant="secondary" onClick={() => window.open("/tours", "_blank")}>
          View public tours page ↗
        </AdminButton>
      </div>
    </>
  );
}
