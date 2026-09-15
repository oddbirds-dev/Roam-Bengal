import { useMemo, useState } from "react";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { AdminIcon } from "@/components/admin/icons";
import { ErrorBanner, SwitchToggle, useAction } from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import {
  FieldControl,
  hydrateSetting,
} from "@/components/admin/settings-form";
import { AreaIdsPicker, DraggableRepeaterField } from "@/components/admin/fields";
import { HOMEPAGE_SECTION_FIELDS, asRows } from "@/lib/content-schema";
import { adminPatchSetting, adminSaveSetting } from "@/lib/admin-content.functions";
import {
  HOME_LAYOUT_KEY,
  resolveHomeLayout,
  serializeHomeLayout,
  type HomeLayout,
} from "@/lib/home-layout";
import { siteDefaults } from "@/content/site-defaults";
import { HOME_SECTIONS, HOME_SECTION_SETTINGS_KEY, type HomeSectionId } from "@/components/home/registry";

export const Route = createFileRoute("/_authenticated/admin/settings/homepage-sections")({
  component: HomepageSectionsScreen,
});

type SettingsRow = { id: string; key: string; value: unknown; description: string | null };
type Obj = Record<string, unknown>;

function readValue(rows: SettingsRow[], key: string): unknown {
  return rows.find((r) => r.key === key)?.value;
}

function HomepageSectionsScreen() {
  const rows = useLoaderData({ from: "/_authenticated/admin/settings" }) as SettingsRow[];

  const initialLayout = useMemo(() => resolveHomeLayout(readValue(rows, HOME_LAYOUT_KEY)), [rows]);
  const storedCopy = readValue(rows, "homepage");
  const initialCopy = useMemo(
    () => hydrateSetting(siteDefaults.homepage, storedCopy) as Obj,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows],
  );

  const [layout, setLayout] = useState<HomeLayout>(initialLayout);
  const [copy, setCopy] = useState<Obj>(initialCopy);
  const [expanded, setExpanded] = useState<HomeSectionId | null>(null);
  const { run, busy, error } = useAction();

  const [baseline, setBaseline] = useState(() => ({ layout: initialLayout, copy: initialCopy }));
  const dirty = JSON.stringify([layout, copy]) !== JSON.stringify([baseline.layout, baseline.copy]);

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
    setLayout(baseline.layout);
    setCopy(baseline.copy);
  }

  async function save() {
    const homepagePatch = Object.fromEntries(
      Object.values(HOMEPAGE_SECTION_FIELDS)
        .flat()
        .map((field) => [field.key, copy[field.key]] as const),
    );
    // Two independent rows (different keys), so the calls can run concurrently rather than
    // paying two round trips back-to-back.
    const ok = await run(() =>
      Promise.all([
        adminSaveSetting({ data: { key: HOME_LAYOUT_KEY, value: serializeHomeLayout(layout) } }),
        adminPatchSetting({ data: { key: "homepage", patch: homepagePatch as never } }),
      ]),
    );
    if (ok) setBaseline({ layout, copy });
  }

  return (
    <EditorShell
      title="Homepage sections"
      blurb="Drag a block by its handle to move it up or down the page. Switch one off to hide it without deleting anything, or press Edit to change its wording and photos."
      previewPath="/"
      previewAnchor={
        expanded === "popularTours"
          ? "packages"
          : expanded === "reviews"
            ? "reviews"
            : expanded === "gallery"
              ? "section-gallery"
              : expanded === "whyChooseUs"
                ? "section-why-choose-us"
                : expanded === "dreamCta"
                  ? "contact"
                  : undefined
      }
      previewDraft={{ [HOME_LAYOUT_KEY]: serializeHomeLayout(layout), homepage: copy }}
      dirty={dirty}
      saving={busy}
      onSave={save}
      onDiscard={discard}
    >
      <ErrorBanner error={error} />

      <div className="flex items-start gap-3 rounded-xl border border-green/25 bg-mint/50 px-4 py-3 text-[0.82rem] text-ink">
        <AdminIcon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-green-dark" />
        <p>
          The big photo banner is always the first thing on the page and can't be moved.{" "}
          <Link
            to="/admin/settings/$group"
            params={{ group: "hero" }}
            className="font-semibold text-green-dark underline decoration-green-dark/40 underline-offset-2 hover:text-green"
          >
            Edit the banner.
          </Link>
        </p>
      </div>

      <div className="mt-4">
        <SortableList ids={layout.map((entry) => entry.id)} onReorder={reorder}>
          <div className="flex flex-col gap-3">
            {layout.map((entry, index) => {
              const meta = HOME_SECTIONS[entry.id];
              const fields = HOMEPAGE_SECTION_FIELDS[entry.id] ?? [];
              const isExpanded = expanded === entry.id;
              return (
                <SortableRow key={entry.id} id={entry.id}>
                  {(handle) => (
                    <div
                      className={`rounded-2xl border border-rule bg-paper transition-opacity ${
                        entry.visible ? "" : "opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 p-4">
                        {handle}
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
                        {fields.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : entry.id)}
                            aria-expanded={isExpanded}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-rule px-3.5 py-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:border-green hover:text-green"
                          >
                            Edit
                            <AdminIcon
                              name="chevron"
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </button>
                        ) : (
                          <Link
                            to="/admin/settings/$group"
                            params={{ group: HOME_SECTION_SETTINGS_KEY[entry.id] }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border-[1.5px] border-rule px-3.5 py-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:border-green hover:text-green"
                          >
                            Edit
                            <AdminIcon name="chevron" className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>

                      {isExpanded ? (
                        <div className="flex flex-col gap-5 border-t border-rule p-4">
                          {fields.map((field) =>
                            field.kind === "rows" && field.key === "trip_builder_presets" ? (
                              <DraggableRepeaterField
                                key={field.key}
                                label={field.label}
                                hint={field.hint}
                                columns={field.columns.map((col) =>
                                  col.key === "areaIds"
                                    ? {
                                        ...col,
                                        render: (value: unknown, onChange: (v: unknown) => void) => (
                                          <AreaIdsPicker
                                            areas={asRows(copy.trip_builder_areas) as unknown as {
                                              id: string;
                                              label: string;
                                            }[]}
                                            value={String(value ?? "")}
                                            onChange={onChange}
                                          />
                                        ),
                                      }
                                    : col,
                                )}
                                values={asRows(copy[field.key])}
                                blank={() => ({ ...field.blank })}
                                onChange={(v) => setCopy((prev) => ({ ...prev, [field.key]: v }))}
                              />
                            ) : (
                              <FieldControl
                                key={field.key}
                                field={field}
                                value={copy[field.key]}
                                onChange={(v) => setCopy((prev) => ({ ...prev, [field.key]: v }))}
                              />
                            ),
                          )}
                          <p className="flex items-center gap-1.5 text-[0.78rem] text-muted">
                            <AdminIcon name="eye" className="h-3.5 w-3.5" />
                            Watch the preview — changes show up as you type.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </SortableRow>
              );
            })}
          </div>
        </SortableList>
      </div>
    </EditorShell>
  );
}
