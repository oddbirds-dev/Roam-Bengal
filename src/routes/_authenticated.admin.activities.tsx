import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminButton,
  Card,
  DeleteButton,
  ErrorBanner,
  PageHeader,
  SavedNote,
  Table,
  Td,
  useAction,
} from "@/components/admin/admin-ui";
import { NumberField, TextArea, TextField } from "@/components/admin/fields";
import {
  adminDeleteActivity,
  adminListActivities,
  adminUpsertActivity,
} from "@/lib/admin-content.functions";

/**
 * Activities double as the theme filter pills on /tours. Not to be confused with a
 * tour's own `activity_label` / `activities_count` fields, which are display-only.
 */
export const Route = createFileRoute("/_authenticated/admin/activities")({
  loader: () => adminListActivities(),
  component: ActivitiesScreen,
});

function blank() {
  return { slug: "", name: "", description: "", sort_order: 0 };
}

type Form = ReturnType<typeof blank>;

function ActivitiesScreen() {
  const rows = Route.useLoaderData();
  const { run, busy, error, saved } = useAction();
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);

  async function save() {
    if (!editing) return;
    const form = { ...editing.form, slug: editing.form.slug.trim() || slugify(editing.form.name) };
    const ok = await run(() =>
      adminUpsertActivity({
        data: { ...(editing.id ? { id: editing.id } : {}), activity: form as never },
      }),
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Activities"
        subtitle="These double as the filter pills on /tours. Assign them to a tour from the tour editor."
        actions={<AdminButton onClick={() => setEditing({ form: blank() })}>+ New activity</AdminButton>}
      />

      <ErrorBanner error={error} />

      {editing ? (
        <div className="mb-6">
          <Card title={editing.id ? "Edit activity" : "New activity"}>
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField
                label="Name"
                required
                hint="Emoji is part of the label, e.g. 🐅 Wildlife"
                value={editing.form.name}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, name: v } })}
              />
              <TextField
                label="Slug"
                mono
                hint="Used in the URL as ?theme=…"
                placeholder={slugify(editing.form.name)}
                value={editing.form.slug}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, slug: v } })}
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
            <TextArea
              label="Description"
              rows={2}
              value={editing.form.description}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, description: v } })}
            />
            <div className="flex items-center gap-3">
              <AdminButton onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save activity"}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <SavedNote show={saved && !error} />
            </div>
          </Card>
        </div>
      ) : null}

      <Table head={["Name", "Slug", "Description", ""]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <Td>
              <button
                type="button"
                onClick={() => setEditing({ id: row.id, form: hydrate(row) })}
                className="text-left font-semibold text-green-dark hover:text-green hover:underline"
              >
                {row.name}
              </button>
            </Td>
            <Td className="font-mono text-[0.78rem] text-muted">{row.slug}</Td>
            <Td className="text-muted">{row.description ?? "—"}</Td>
            <Td className="text-right">
              <DeleteButton
                disabled={busy}
                label="Delete"
                onConfirm={() => run(() => adminDeleteActivity({ data: { id: row.id } }))}
              />
            </Td>
          </tr>
        ))}
      </Table>

      <p className="mt-4 text-[0.78rem] text-muted">
        Deleting an activity also removes it from every tour that used it.
      </p>
    </>
  );
}

function hydrate(row: Record<string, unknown>): Form {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    slug: text(row.slug),
    name: text(row.name),
    description: text(row.description),
    sort_order: Number(row.sort_order ?? 0),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
