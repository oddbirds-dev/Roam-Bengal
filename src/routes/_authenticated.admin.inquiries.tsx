import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminButton,
  Badge,
  DeleteButton,
  ErrorBanner,
  PageHeader,
  useAction,
} from "@/components/admin/admin-ui";
import {
  adminDeleteInquiry,
  adminListInquiries,
  adminUpdateInquiry,
} from "@/lib/admin-content.functions";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  loader: () => adminListInquiries(),
  component: InquiriesScreen,
});

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "handled", label: "Handled" },
] as const;

function InquiriesScreen() {
  const inquiries = Route.useLoaderData();
  const { run, busy, error } = useAction();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const visible = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);
  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <>
      <PageHeader
        title="Inquiries"
        subtitle={
          newCount
            ? `${newCount} waiting for a reply`
            : "Every lead is here — nothing new right now"
        }
      />

      <ErrorBanner error={error} />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? inquiries.length
              : inquiries.filter((i) => i.status === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-[30px] border-[1.5px] px-4 py-2 text-[0.82rem] font-semibold transition-colors ${
                filter === f.value
                  ? "border-green-dark bg-green-dark text-white"
                  : "border-rule bg-paper text-ink hover:border-green"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule bg-paper py-16 text-center text-[0.9rem] text-muted">
          Nothing in this queue.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((inq) => (
            <article key={inq.id} className="rounded-2xl border border-rule bg-paper p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-[1.1rem] font-bold text-green-dark">
                    {inq.name}
                    {inq.country ? (
                      <span className="ml-2 text-[0.8rem] font-normal text-muted">
                        {inq.country}
                      </span>
                    ) : null}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-3 text-[0.8rem] text-muted">
                    <a href={`mailto:${inq.email}`} className="hover:text-green hover:underline">
                      {inq.email}
                    </a>
                    {inq.phone ? <span>{inq.phone}</span> : null}
                    <span>{new Date(inq.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <StatusBadge status={inq.status} />
              </header>

              {inq.tour_slug ? (
                <p className="mt-3 text-[0.82rem] text-muted">
                  Interested in <strong className="text-ink">{inq.tour_slug}</strong>
                </p>
              ) : null}

              <p className="mt-3 rounded-xl bg-cream p-4 text-[0.88rem] leading-7 whitespace-pre-line">
                {inq.message}
              </p>

              <div className="mt-4">
                <label
                  htmlFor={`note-${inq.id}`}
                  className="mb-1.5 block text-[0.78rem] font-semibold text-ink"
                >
                  Internal note
                </label>
                <textarea
                  id={`note-${inq.id}`}
                  rows={2}
                  value={notes[inq.id] ?? inq.admin_note ?? ""}
                  onChange={(e) => setNotes({ ...notes, [inq.id]: e.target.value })}
                  className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(["new", "read", "handled"] as const)
                  .filter((s) => s !== inq.status)
                  .map((status) => (
                    <AdminButton
                      key={status}
                      variant={status === "handled" ? "primary" : "secondary"}
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          adminUpdateInquiry({
                            data: {
                              id: inq.id,
                              status,
                              admin_note: notes[inq.id] ?? inq.admin_note ?? "",
                            },
                          }),
                        )
                      }
                    >
                      Mark {status}
                    </AdminButton>
                  ))}

                <AdminButton
                  variant="secondary"
                  disabled={busy || notes[inq.id] === undefined}
                  onClick={() =>
                    run(() =>
                      adminUpdateInquiry({
                        data: { id: inq.id, admin_note: notes[inq.id] ?? "" },
                      }),
                    )
                  }
                >
                  Save note
                </AdminButton>

                <span className="ml-auto">
                  <DeleteButton
                    disabled={busy}
                    onConfirm={() => run(() => adminDeleteInquiry({ data: { id: inq.id } }))}
                  />
                </span>
              </div>

              {inq.handled_at ? (
                <p className="mt-3 text-[0.74rem] text-muted">
                  Handled {new Date(inq.handled_at).toLocaleString()}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "new") return <Badge tone="orange">New</Badge>;
  if (status === "handled") return <Badge tone="green">Handled</Badge>;
  return <Badge tone="muted">Read</Badge>;
}
