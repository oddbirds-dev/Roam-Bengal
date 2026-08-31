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
import { NumberField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { adminDeleteFaq, adminListFaqs, adminUpsertFaq } from "@/lib/admin-content.functions";
import type { FaqDTO } from "@/lib/content-types";
import { faqPreviewChannel } from "@/lib/faq-preview";
import { getErrorMessage } from "@/lib/utils";

/** Where the questions actually appear. Drives the preview and the public link. */
const PUBLIC_PATH = "/travel-faqs";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  loader: () => adminListFaqs(),
  component: FaqsScreen,
});

type Row = Awaited<ReturnType<typeof adminListFaqs>>[number];

function FaqsScreen() {
  const rows = Route.useLoaderData();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function remove(row: Row) {
    try {
      await adminDeleteFaq({ data: { id: row.id } });
      await router.invalidate();
      toast.success("Question deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete. Please try again."));
    }
  }

  // "new" matches no row, so `row` arrives undefined and the form opens in create mode.
  if (editingId !== null) {
    return <RowForm row={rows.find((r) => r.id === editingId)} onBack={() => setEditingId(null)} />;
  }

  return (
    <AdminPage
      title="FAQs"
      subtitle="Questions and answers shown on your travel FAQs page. The lower the order number, the higher it appears. Tour-specific questions live on the tour itself."
      action={
        <AdminButton onClick={() => setEditingId("new")}>
          <AdminIcon name="plus" className="mr-1.5 h-[15px] w-[15px]" />
          New question
        </AdminButton>
      }
    >
      {rows.length === 0 ? (
        <EmptyState>No FAQs yet. Press &ldquo;New question&rdquo; to add your first one.</EmptyState>
      ) : (
        <ListTable head={["Question", "Group", "Order", "Status"]}>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-cream/50">
              <Td>
                <button
                  type="button"
                  onClick={() => setEditingId(row.id)}
                  className="max-w-md truncate text-left font-semibold text-green-dark hover:text-green hover:underline"
                >
                  {row.question}
                </button>
              </Td>
              <Td className="text-muted">{row.category ?? "—"}</Td>
              <Td className="text-muted">{row.sort_order}</Td>
              <Td>
                {row.is_published ? (
                  <StatusBadge tone="published">Published</StatusBadge>
                ) : (
                  <StatusBadge tone="draft">Hidden</StatusBadge>
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
                    title="Delete this question?"
                    description="It will be removed from your FAQs page for good."
                    onConfirm={() => remove(row)}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </ListTable>
      )}

      <div className="mt-6">
        <ViewPublicLink href={PUBLIC_PATH}>View public FAQs page</ViewPublicLink>
      </div>
    </AdminPage>
  );
}

function blank(row?: Row) {
  return {
    question: row?.question ?? "",
    answer: row?.answer ?? "",
    category: row?.category ?? "",
    sort_order: row?.sort_order ?? 0,
    is_published: row?.is_published ?? true,
  };
}

type Form = ReturnType<typeof blank>;

function RowForm({ row, onBack }: { row?: Row; onBack: () => void }) {
  const router = useRouter();
  const { run, busy, error } = useAction();
  const [v, setV] = useState<Form>(() => blank(row));

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  // Field-by-field rather than a JSON diff, so undoing an edit correctly reports
  // "Everything is saved" instead of staying dirty for the rest of the session.
  const saved = useMemo(() => blank(row), [row]);
  const dirty = useMemo(
    () => !row || (Object.keys(saved) as (keyof Form)[]).some((k) => v[k] !== saved[k]),
    [v, saved, row],
  );

  const draft: FaqDTO = {
    id: row?.id ?? "preview-faq",
    question: v.question,
    answer: v.answer,
    category: v.category || null,
  };

  async function save() {
    const ok = await run(() =>
      adminUpsertFaq({
        data: {
          ...(row ? { id: row.id } : {}),
          faq: {
            question: v.question,
            answer: v.answer,
            category: v.category || null,
            sort_order: Number(v.sort_order),
            is_published: v.is_published,
          } as never,
        },
      }),
    );
    if (!ok) return;
    toast.success(row ? "Question saved" : "Question added");
    onBack();
  }

  async function remove() {
    if (!row) return;
    try {
      await adminDeleteFaq({ data: { id: row.id } });
      await router.invalidate();
      toast.success("Question deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete. Please try again."));
      return;
    }
    // Leaving the form mounted after a delete is what let a later save resurrect the row.
    onBack();
  }

  return (
    <EditorShell
      title={row ? "Edit question" : "New question"}
      blurb={row ? v.question || "Untitled question" : "Fill out the details below."}
      previewPath={PUBLIC_PATH}
      previewChannel={faqPreviewChannel}
      previewDraft={draft}
      dirty={dirty}
      saving={busy}
      onSave={save}
      onDiscard={() => setV(blank(row))}
      onBack={onBack}
      backLabel="FAQs"
      footer={
        row ? (
          <ConfirmButton
            title="Delete this question?"
            description="It will be removed from your FAQs page for good."
            onConfirm={remove}
          >
            Delete question
          </ConfirmButton>
        ) : null
      }
    >
      <ErrorBanner error={error} />

      <div className="mt-4 flex flex-col gap-5">
        <TextField
          label="Question"
          required
          placeholder="How far in advance should I book?"
          value={v.question}
          onChange={(x) => set("question", x)}
        />
        <TextArea label="Answer" rows={4} plain value={v.answer} onChange={(x) => set("answer", x)} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Group"
            hint="Optional heading to file this under."
            placeholder="Booking"
            value={v.category}
            onChange={(x) => set("category", x)}
          />
          <NumberField
            label="Order"
            hint="Lower numbers appear first."
            min={0}
            value={v.sort_order}
            onChange={(x) => set("sort_order", x ?? 0)}
          />
        </div>
        <Toggle
          label="Show on the website"
          checked={v.is_published}
          onChange={(x) => set("is_published", x)}
        />
      </div>
    </EditorShell>
  );
}
