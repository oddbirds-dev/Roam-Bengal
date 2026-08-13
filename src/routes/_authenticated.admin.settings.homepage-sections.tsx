import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AdminButton,
  Card,
  ErrorBanner,
  PageHeader,
  SavedNote,
  useAction,
} from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { adminListSettings, adminSaveSetting } from "@/lib/admin-content.functions";
import {
  HOME_LAYOUT_KEY,
  resolveHomeLayout,
  serializeHomeLayout,
  type HomeLayout,
} from "@/lib/home-layout";
import { HOME_SECTIONS, type HomeSectionId } from "@/components/home/registry";

export const Route = createFileRoute("/_authenticated/admin/settings/homepage-sections")({
  loader: async () => {
    const rows = await adminListSettings();
    const row = rows.find((r) => r.key === HOME_LAYOUT_KEY);
    return resolveHomeLayout(row?.value);
  },
  component: HomepageSectionsScreen,
});

function HomepageSectionsScreen() {
  const initial = Route.useLoaderData();
  const [layout, setLayout] = useState<HomeLayout>(initial);
  const { run, busy, error, saved } = useAction();

  function reorder(nextIds: string[]) {
    const byId = new Map(layout.map((entry) => [entry.id, entry]));
    setLayout(nextIds.map((id) => byId.get(id as HomeSectionId)!));
  }

  function toggleVisible(id: HomeSectionId) {
    setLayout((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, visible: !entry.visible } : entry)),
    );
  }

  function save() {
    run(() => adminSaveSetting({ data: { key: HOME_LAYOUT_KEY, value: serializeHomeLayout(layout) } }));
  }

  return (
    <>
      <PageHeader
        title="Homepage sections"
        subtitle="Drag to reorder, or hide a section entirely. The hero banner is always first."
        actions={
          <>
            <Link
              to="/admin/settings"
              className="inline-flex items-center rounded-[30px] border-[1.5px] border-rule bg-paper px-5 py-2.5 text-[0.84rem] font-semibold text-ink transition-colors hover:border-green hover:text-green"
            >
              Back to Site content
            </Link>
            <AdminButton onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save order"}
            </AdminButton>
          </>
        }
      />

      <ErrorBanner error={error} />

      <Card>
        <div className="flex items-center gap-3 rounded-xl border border-rule bg-cream/40 px-4 py-2.5 text-[0.82rem] text-muted">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange text-white">
            ▲
          </span>
          <span className="font-semibold text-ink">Hero banner</span>
          <span>— always shown first, not reorderable here.</span>
        </div>

        <SortableList ids={layout.map((entry) => entry.id)} onReorder={reorder}>
          <div className="flex flex-col gap-2">
            {layout.map((entry) => {
              const meta = HOME_SECTIONS[entry.id];
              return (
                <SortableRow key={entry.id} id={entry.id}>
                  {(handle) => (
                    <div
                      className={`flex items-center gap-3 rounded-xl border border-rule bg-paper px-3 py-3 ${
                        entry.visible ? "" : "opacity-50"
                      }`}
                    >
                      {handle}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9rem] font-semibold text-green-dark">
                          {meta.label}
                        </p>
                        <p className="truncate text-[0.76rem] text-muted">{meta.blurb}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleVisible(entry.id)}
                        aria-label={entry.visible ? "Hide section" : "Show section"}
                        title={entry.visible ? "Hide section" : "Show section"}
                        className="shrink-0 rounded-full border-[1.5px] border-rule p-2 text-muted transition-colors hover:border-green hover:text-green"
                      >
                        <AdminIcon name={entry.visible ? "eye" : "eyeOff"} className="h-[16px] w-[16px]" />
                      </button>
                    </div>
                  )}
                </SortableRow>
              );
            })}
          </div>
        </SortableList>

        <div className="flex items-center gap-3">
          <AdminButton onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save order"}
          </AdminButton>
          <SavedNote show={saved && !error} />
        </div>
      </Card>
    </>
  );
}
