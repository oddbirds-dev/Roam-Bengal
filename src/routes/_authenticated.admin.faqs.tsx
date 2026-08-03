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
import { NumberField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import {
  adminDeleteFaq,
  adminListFaqs,
  adminUpsertFaq,
} from "@/lib/admin-content.functions";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  loader: () => adminListFaqs(),
  component: FaqsScreen,
});

function blank() {
  return { question: "", answer: "", category: "", is_published: true, sort_order: 0 };
}

type Form = ReturnType<typeof blank>;

function FaqsScreen() {
  const rows = Route.useLoaderData();
  const { run, busy, error, saved } = useAction();
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);

  async function save() {
    if (!editing) return;
    const ok = await run(() =>
      adminUpsertFaq({
        data: { ...(editing.id ? { id: editing.id } : {}), faq: editing.form as never },
      }),
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="FAQs"
        subtitle="Shown on /travel-faqs. Tour-specific questions live on the tour itself."
        actions={<AdminButton onClick={() => setEditing({ form: blank() })}>+ New FAQ</AdminButton>}
      />

      <ErrorBanner error={error} />

      {editing ? (
        <div className="mb-6">
          <Card title={editing.id ? "Edit FAQ" : "New FAQ"}>
            <TextField
              label="Question"
              required
              value={editing.form.question}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, question: v } })}
            />
            <TextArea
              label="Answer"
              rows={4}
              value={editing.form.answer}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, answer: v } })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Category"
                placeholder="Booking"
                value={editing.form.category}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, category: v } })}
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
            <Toggle
              label="Published"
              checked={editing.form.is_published}
              onChange={(v) =>
                setEditing({ ...editing, form: { ...editing.form, is_published: v } })
              }
            />
            <div className="flex items-center gap-3">
              <AdminButton onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save FAQ"}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <SavedNote show={saved && !error} />
            </div>
          </Card>
        </div>
      ) : null}

      <Table head={["Question", "Category", "Status", ""]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <Td>
              <button
                type="button"
                onClick={() => setEditing({ id: row.id, form: hydrate(row) })}
                className="text-left font-semibold text-green-dark hover:text-green hover:underline"
              >
                {row.question}
              </button>
            </Td>
            <Td className="text-muted">{row.category ?? "—"}</Td>
            <Td>
              {row.is_published ? (
                <Badge tone="green">Published</Badge>
              ) : (
                <Badge tone="muted">Hidden</Badge>
              )}
            </Td>
            <Td className="text-right">
              <DeleteButton
                disabled={busy}
                onConfirm={() => run(() => adminDeleteFaq({ data: { id: row.id } }))}
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
    question: text(row.question),
    answer: text(row.answer),
    category: text(row.category),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
  };
}
