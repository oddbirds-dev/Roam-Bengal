import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminButton, ErrorBanner, SwitchToggle, useAction } from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { usePreviewPane, PreviewPane } from "@/components/admin/preview-pane";
import { adminListSettings, adminSaveSetting } from "@/lib/admin-content.functions";
import {
  HOME_LAYOUT_KEY,
  resolveHomeLayout,
  serializeHomeLayout,
  type HomeLayout,
} from "@/lib/home-layout";
import { settingsPreviewChannel } from "@/hooks/use-site-settings";
import { HOME_SECTIONS, HOME_SECTION_SETTINGS_KEY, type HomeSectionId } from "@/components/home/registry";

export const Route = createFileRoute("/_authenticated/admin/settings/homepage-sections")({
  loader: async () => {
    const rows = await adminListSettings();
    const row = rows.find((r) => r.key === HOME_LAYOUT_KEY);
    return resolveHomeLayout(row?.value);
  },
  component: HomepageSectionsScreen,
});

function serialize(layout: HomeLayout): string {
  return JSON.stringify(layout);
}

function HomepageSectionsScreen() {
  const initial = Route.useLoaderData();
  const [layout, setLayout] = useState<HomeLayout>(initial);
  const { run, busy, error, saved } = useAction();

  const [baseline, setBaseline] = useState(() => serialize(initial));
  const dirty = serialize(layout) !== baseline;

  const draft = useMemo(() => ({ key: HOME_LAYOUT_KEY, value: serializeHomeLayout(layout) }), [layout]);
  const pane = usePreviewPane(settingsPreviewChannel, draft);

  function reorder(nextIds: string[]) {
    const byId = new Map(layout.map((entry) => [entry.id, entry]));
    setLayout(nextIds.map((id) => byId.get(id as HomeSectionId)!));
  }

  function toggleVisible(id: HomeSectionId) {
    setLayout((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, visible: !entry.visible } : entry)),
    );
  }

  function discard() {
    setLayout(initial);
  }

  async function save() {
    const ok = await run(() =>
      adminSaveSetting({ data: { key: HOME_LAYOUT_KEY, value: serializeHomeLayout(layout) } }),
    );
    if (ok) setBaseline(serialize(layout));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-5">
        <h1 className="font-display text-[1.7rem] text-green">Homepage sections</h1>
        <p className="mt-1 max-w-xl text-[0.86rem] text-muted">
          Drag a block by its handle to move it up or down the page. Switch one off to hide it
          without deleting anything, or press Edit to change its wording and photos.
        </p>
      </div>

      <ErrorBanner error={error} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* List pane */}
        <div className="flex min-h-0 w-full flex-col gap-4 overflow-y-auto lg:w-[42%]">
          <div className="flex items-start gap-3 rounded-xl border border-green/25 bg-mint/50 px-4 py-3 text-[0.82rem] text-ink">
            <AdminIcon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-green-dark" />
            <p>
              The big photo banner is always the first thing on the page and can't be moved.{" "}
              <Link
                to="/admin/settings"
                search={{ key: "hero" }}
                className="font-semibold text-green-dark underline decoration-green-dark/40 underline-offset-2 hover:text-green"
              >
                Edit the banner.
              </Link>
            </p>
          </div>

          <SortableList ids={layout.map((entry) => entry.id)} onReorder={reorder}>
            <div className="flex flex-col gap-3">
              {layout.map((entry, index) => {
                const meta = HOME_SECTIONS[entry.id];
                return (
                  <SortableRow key={entry.id} id={entry.id}>
                    {(handle) => (
                      <div className="flex items-stretch gap-3">
                        <div className="flex w-12 shrink-0 items-center justify-center rounded-2xl border border-rule bg-paper">
                          {handle}
                        </div>
                        <div
                          className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-rule bg-paper p-4 transition-opacity ${
                            entry.visible ? "" : "opacity-50"
                          }`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-[0.78rem] font-bold text-green-dark">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.92rem] font-bold text-ink">{meta.label}</p>
                            <p className="truncate text-[0.78rem] text-muted">{meta.blurb}</p>
                          </div>
                          <SwitchToggle
                            checked={entry.visible}
                            onChange={() => toggleVisible(entry.id)}
                            label={entry.visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
                          />
                          <Link
                            to="/admin/settings"
                            search={{ key: HOME_SECTION_SETTINGS_KEY[entry.id] }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-rule px-3.5 py-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:border-green hover:text-green"
                          >
                            Edit
                            <AdminIcon name="chevron" className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </SortableRow>
                );
              })}
            </div>
          </SortableList>
        </div>

        {/* Preview pane */}
        {pane.open ? (
          <div className="hidden min-h-0 flex-1 lg:block">
            <div className="h-full min-h-[600px] overflow-hidden rounded-2xl border border-rule bg-paper">
              <PreviewPane
                path="/"
                label="Preview · /"
                pane={pane}
                footnote="This is a preview of your unsaved changes. Nothing is live until you press Save changes."
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
        <span className={`text-[0.85rem] ${dirty ? "font-semibold text-ink" : "text-muted"}`}>
          {busy ? "Saving…" : dirty ? "Unsaved changes" : "Everything is saved"}
        </span>
        <button
          type="button"
          onClick={() => pane.setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-muted transition-colors hover:text-ink"
        >
          <AdminIcon name={pane.open ? "eyeOff" : "eye"} className="h-4 w-4" />
          {pane.open ? "Hide preview" : "Show preview"}
        </button>
        <span className="ml-auto flex items-center gap-3">
          <AdminButton variant="secondary" onClick={discard} disabled={!dirty || busy}>
            Discard
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || !dirty}>
            {busy ? "Saving…" : saved && !dirty ? "Saved" : "Save changes"}
          </AdminButton>
        </span>
      </div>
    </div>
  );
}
