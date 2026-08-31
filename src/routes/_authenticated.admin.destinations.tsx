import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AdminButton,
  AdminPage,
  ConfirmButton,
  EmptyState,
  ErrorBanner,
  ListTable,
  StatusBadge,
  Td,
  ViewPublicLink,
  toast,
  useAction,
} from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import { AdminIcon } from "@/components/admin/icons";
import { NumberField, StringListField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-upload";
import {
  adminDeleteDestination,
  adminListDestinations,
  adminUpsertDestination,
} from "@/lib/admin-content.functions";
import { slugify } from "@/lib/slugify";
import { getErrorMessage } from "@/lib/utils";
import { destinationPreviewChannel } from "@/lib/destination-preview";
import type { DestinationDTO } from "@/lib/content-types";

/**
 * The places tours are tagged with.
 *
 * These rows had server functions and a database table but no screen, so the only way to add a
 * destination was to open Supabase. Roam has no destination detail route; the live preview points
 * to the homepage gallery, where a destination photo actually surfaces.
 */

export const Route = createFileRoute("/_authenticated/admin/destinations")({
  loader: () => adminListDestinations(),
  component: DestinationsScreen,
});

type Row = Awaited<ReturnType<typeof adminListDestinations>>[number];

function DestinationsScreen() {
  const rows = Route.useLoaderData();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function remove(row: Row) {
    try {
      await adminDeleteDestination({ data: { id: row.id } });
      await router.invalidate();
      toast.success(`${row.name} deleted`);
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete. Please try again."));
    }
  }

  if (editingId !== null) {
    return <RowForm row={rows.find((r) => r.id === editingId)} onBack={() => setEditingId(null)} />;
  }

  return (
    <AdminPage
      title="Destinations"
      subtitle="The places you travel to. Each tour is tagged with one, which is what the destination label on a tour page reads from."
      action={
        <AdminButton onClick={() => setEditingId("new")}>
          <AdminIcon name="plus" className="mr-1.5 h-[15px] w-[15px]" />
          New destination
        </AdminButton>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>
          No destinations yet. Press &ldquo;New destination&rdquo; to add your first one.
        </EmptyState>
      ) : (
        <ListTable
          head={["Name", "Region", "Order", "Status"]}
          footNote="Deleting a destination does not delete the tours tagged with it — those tours keep their own destination label, but lose the link back to this record."
        >
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-cream/50">
              <Td>
                <button
                  type="button"
                  onClick={() => setEditingId(row.id)}
                  className="text-left font-semibold text-green-dark hover:text-green hover:underline"
                >
                  {row.name}
                </button>
                <div className="mt-0.5 font-mono text-[0.72rem] text-muted">/{row.slug}</div>
              </Td>
              <Td className="text-muted">{row.region ?? "—"}</Td>
              <Td className="text-muted">{row.sort_order}</Td>
              <Td>
                {row.is_published ? (
                  <StatusBadge tone="published">Published</StatusBadge>
                ) : (
                  <StatusBadge tone="draft">Draft</StatusBadge>
                )}
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(row.id)}
                    className="inline-flex items-center gap-1.5 rounded-[30px] border-[1.5px] border-rule px-4 py-1.5 text-[0.78rem] font-semibold transition-colors hover:border-green hover:text-green"
                  >
                    <AdminIcon name="pencil" className="h-[13px] w-[13px]" />
                    Edit
                  </button>
                  <ConfirmButton
                    title={`Delete ${row.name}?`}
                    description="The destination record and its photo reference will be removed for good. Tours tagged with it keep their own label."
                    onConfirm={() => remove(row)}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </ListTable>
      )}
      <div className="mt-6">
        <ViewPublicLink href="/">View destinations on the homepage</ViewPublicLink>
      </div>
    </AdminPage>
  );
}

function blank(row?: Row) {
  return {
    slug: row?.slug ?? "",
    name: row?.name ?? "",
    tagline: row?.tagline ?? "",
    region: row?.region ?? "",
    image_url: row?.image_url ?? "",
    intro: row?.intro ?? "",
    highlights: row?.highlights ?? [],
    best_time: row?.best_time ?? "",
    sort_order: row?.sort_order ?? 0,
    is_published: row?.is_published ?? true,
  };
}

type Form = ReturnType<typeof blank>;

function RowForm({ row, onBack }: { row?: Row; onBack: () => void }) {
  const router = useRouter();
  const { run, busy, error } = useAction();
  const [v, setV] = useState<Form>(() => blank(row));
  // Typing the name fills the slug only until the slug itself is touched, so renaming an existing
  // destination never silently repoints the link a tour was tagged with.
  const [slugTouched, setSlugTouched] = useState(Boolean(row?.slug));

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const saved = useMemo(() => blank(row), [row]);
  const dirty = useMemo(() => {
    if (!row) return true;
    return (Object.keys(saved) as (keyof Form)[]).some((k) =>
      k === "highlights"
        ? v.highlights.join("\n") !== saved.highlights.join("\n")
        : v[k] !== saved[k],
    );
  }, [v, saved, row]);

  const draft: DestinationDTO = {
    id: row?.id ?? "preview-destination",
    slug: v.slug,
    name: v.name,
    tagline: v.tagline || null,
    region: v.region || null,
    imageUrl: v.image_url || null,
    intro: v.intro || null,
    highlights: v.highlights,
    bestTime: v.best_time || null,
    sortOrder: v.sort_order,
  };

  async function save() {
    const ok = await run(() =>
      adminUpsertDestination({
        data: {
          ...(row ? { id: row.id } : {}),
          destination: {
            slug: v.slug,
            name: v.name,
            tagline: v.tagline || null,
            region: v.region || null,
            image_url: v.image_url || null,
            intro: v.intro || null,
            highlights: v.highlights.map((h) => h.trim()).filter(Boolean),
            best_time: v.best_time || null,
            sort_order: Number(v.sort_order),
            is_published: v.is_published,
          } as never,
        },
      }),
    );
    if (!ok) return;
    toast.success(row ? "Destination saved" : "Destination added");
    onBack();
  }

  async function remove() {
    if (!row) return;
    try {
      await adminDeleteDestination({ data: { id: row.id } });
      await router.invalidate();
      toast.success("Destination deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete. Please try again."));
      return;
    }
    onBack();
  }

  return (
    <EditorShell
      title={row ? "Edit destination" : "New destination"}
      blurb={row ? v.name || "Untitled destination" : "Fill out the details below."}
      previewPath="/"
      previewAnchor="section-gallery"
      previewChannel={destinationPreviewChannel}
      previewDraft={draft}
      dirty={dirty}
      saving={busy}
      onSave={save}
      onDiscard={() => {
        setV(blank(row));
        setSlugTouched(Boolean(row?.slug));
      }}
      onBack={onBack}
      backLabel="Destinations"
      footer={
        row ? (
          <ConfirmButton
            title={`Delete ${row.name}?`}
            description="The destination record and its photo reference will be removed for good. Tours tagged with it keep their own label."
            onConfirm={remove}
          >
            Delete destination
          </ConfirmButton>
        ) : null
      }
    >
      <ErrorBanner error={error} />

      <div className="mt-4 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Name"
            required
            placeholder="Sundarbans"
            value={v.name}
            onChange={(x) =>
              setV((prev) => ({
                ...prev,
                name: x,
                slug: slugTouched ? prev.slug : slugify(x),
              }))
            }
          />
          <TextField
            label="Web address"
            hint="Lowercase, dashes instead of spaces. Tours reference this."
            mono
            value={v.slug}
            onChange={(x) => {
              setSlugTouched(true);
              set("slug", slugify(x));
            }}
          />
          <TextField
            label="Tagline"
            hint="A short line under the name."
            value={v.tagline}
            onChange={(x) => set("tagline", x)}
          />
          <TextField
            label="Region"
            placeholder="Khulna Division"
            value={v.region}
            onChange={(x) => set("region", x)}
          />
          <TextField
            label="Best time to visit"
            placeholder="November to February"
            value={v.best_time}
            onChange={(x) => set("best_time", x)}
          />
          <NumberField
            label="Order"
            hint="Lower numbers appear first."
            min={0}
            value={v.sort_order}
            onChange={(x) => set("sort_order", x ?? 0)}
          />
        </div>

        <ImageField
          label="Photo"
          hint="Used wherever this destination is illustrated."
          value={v.image_url}
          onChange={(x) => set("image_url", x)}
        />

        <TextArea
          label="Introduction"
          rows={3}
          value={v.intro}
          onChange={(x) => set("intro", x)}
        />

        <StringListField
          label="Highlights"
          hint="One per line."
          values={v.highlights}
          onChange={(x) => set("highlights", x)}
        />

        <Toggle
          label="Show on the website"
          hint="Stored now; it takes effect if and when destinations get public pages of their own."
          checked={v.is_published}
          onChange={(x) => set("is_published", x)}
        />
      </div>
    </EditorShell>
  );
}
