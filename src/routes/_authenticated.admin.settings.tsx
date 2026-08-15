import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  AdminButton,
  Card,
  ErrorBanner,
  PageHeader,
  SavedNote,
  useAction,
} from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import {
  PAGE_SETTINGS_ORDER,
  SETTINGS_ORDER,
  SETTINGS_SCHEMA,
  SettingsSections,
  hydrateSetting,
  mergeSetting,
  type SettingsSchema,
} from "@/components/admin/settings-form";
import { infoDefaults, policyDefaults } from "@/content/policy-defaults";
import { siteDefaults } from "@/content/site-defaults";
import { adminListSettings, adminSaveSetting } from "@/lib/admin-content.functions";
import { HOME_LAYOUT_KEY } from "@/lib/home-layout";
import { usePreviewPane, PreviewPane } from "@/components/admin/preview-pane";
import { settingsPreviewChannel } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  // Lets other admin pages (the homepage-sections builder) deep-link straight into a
  // section's editor instead of only reaching it by clicking through the grid.
  validateSearch: z.object({ key: z.string().optional() }),
  loader: () => adminListSettings(),
  component: SettingsScreen,
});

type SettingsRow = { id: string; key: string; value: unknown; description: string | null };

/** Mirrors how the public pages resolve a key: site chrome, then policy, then info. */
function defaultsFor(key: string): unknown {
  if (key.startsWith("policy_")) {
    return (policyDefaults as Record<string, unknown>)[key.slice("policy_".length)] ?? {};
  }
  if (key.startsWith("info_")) {
    return (infoDefaults as Record<string, unknown>)[key.slice("info_".length)] ?? {};
  }
  return (siteDefaults as Record<string, unknown>)[key] ?? {};
}

/**
 * Site content, edited as forms rather than JSON.
 *
 * The shape of each key lives in settings-form.tsx; this screen is the shell around it —
 * a menu of named sections, and one form at a time. Any key the schema does not describe
 * still appears at the bottom with a raw editor, so nothing in the table is unreachable.
 *
 * Every key ships a default in code (src/content/site-defaults.ts) which the stored value
 * merges over, so "Restore original wording" is a local reset of the form, not a delete.
 */
function SettingsScreen() {
  const settings = Route.useLoaderData() as SettingsRow[];
  const search = Route.useSearch();
  const [openKey, setOpenKey] = useState<string | null>(search.key ?? null);

  const rows = new Map(settings.map((row) => [row.key, row]));
  // homepage_layout has its own reorder-focused builder below, not a schema form or the raw
  // JSON fallback — keep it out of "Other content" so there's exactly one place to edit it.
  const extras = settings.filter((row) => !(row.key in SETTINGS_SCHEMA) && row.key !== HOME_LAYOUT_KEY);

  if (openKey) {
    const schema = SETTINGS_SCHEMA[openKey];
    return schema ? (
      <SectionEditor
        key={openKey}
        settingKey={openKey}
        schema={schema}
        stored={rows.get(openKey)?.value}
        onClose={() => setOpenKey(null)}
      />
    ) : (
      <RawEditor
        key={openKey}
        settingKey={openKey}
        stored={rows.get(openKey)?.value}
        onClose={() => setOpenKey(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Site content"
        subtitle="Pick a part of the website to change its wording, photos, and links. Everything here is public — never put a password or private note in it."
      />

      <Link
        to="/admin/settings/homepage-sections"
        className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-paper p-5 transition-colors hover:border-green"
      >
        <div>
          <h3 className="font-display text-[1.05rem] font-bold text-green-dark">
            Homepage sections
          </h3>
          <p className="mt-1 text-[0.82rem] text-muted">
            Reorder or hide whole blocks of the homepage — the feature strip, popular tours,
            gallery, and the rest.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-semibold text-green">
          Open builder
          <AdminIcon name="chevron" className="h-4 w-4" />
        </span>
      </Link>

      <SectionGrid
        heading="Around the site"
        blurb="Wording and pictures that appear on the homepage or on every page."
        keys={SETTINGS_ORDER}
        onOpen={setOpenKey}
      />

      <SectionGrid
        heading="Standalone pages"
        blurb="Full pages of text — the ones your footer links to, and your booking policies."
        keys={PAGE_SETTINGS_ORDER}
        onOpen={setOpenKey}
      />

      {extras.length ? (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-[1.05rem] font-bold text-green-dark">
            Other content
          </h2>
          <p className="mb-4 text-[0.82rem] text-muted">
            These entries have no form yet, so they open in a technical editor. Ask your
            developer before changing them.
          </p>
          <div className="flex flex-col gap-3">
            {extras.map((row) => (
              <div
                key={row.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-paper p-4"
              >
                <div>
                  <span className="font-mono text-[0.86rem] font-bold text-green-dark">
                    {row.key}
                  </span>
                  {row.description ? (
                    <p className="mt-0.5 text-[0.78rem] text-muted">{row.description}</p>
                  ) : null}
                </div>
                <AdminButton variant="secondary" onClick={() => setOpenKey(row.key)}>
                  Edit
                </AdminButton>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------

function SectionGrid({
  heading,
  blurb,
  keys,
  onOpen,
}: {
  heading: string;
  blurb: string;
  keys: readonly string[];
  onOpen: (key: string) => void;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-[1.15rem] font-bold text-green-dark">{heading}</h2>
      <p className="mt-1 mb-4 text-[0.82rem] text-muted">{blurb}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {keys.map((key) => {
          const schema = SETTINGS_SCHEMA[key];
          if (!schema) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpen(key)}
              className="flex h-full flex-col rounded-2xl border border-rule bg-paper p-5 text-left transition-colors hover:border-green"
            >
              <h3 className="font-display text-[1.05rem] font-bold text-green-dark">
                {schema.title}
              </h3>
              <p className="mt-1.5 flex-1 text-[0.82rem] leading-6 text-muted">
                {schema.description}
              </p>
              <span className="mt-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-cream px-2.5 py-1 text-[0.7rem] font-medium text-muted">
                  {schema.where}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-semibold text-green">
                  Edit
                  <AdminIcon name="chevron" className="h-4 w-4" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function SectionEditor({
  settingKey,
  schema,
  stored,
  onClose,
}: {
  settingKey: string;
  schema: SettingsSchema;
  stored: unknown;
  onClose: () => void;
}) {
  const { run, busy, error, saved } = useAction();
  const [draft, setDraft] = useState(() => hydrateSetting(defaultsFor(settingKey), stored));
  const pane = usePreviewPane(settingsPreviewChannel, { key: settingKey, value: draft });

  async function save() {
    const ok = await run(() =>
      adminSaveSetting({
        data: { key: settingKey, value: mergeSetting(stored, draft) as never },
      }),
    );
    if (ok) onClose();
  }

  const actions = (
    <>
      {schema.previewPath ? (
        <AdminButton variant="secondary" onClick={() => pane.setOpen((v) => !v)}>
          {pane.open ? "Hide preview" : "Show preview"}
        </AdminButton>
      ) : null}
      <AdminButton variant="secondary" onClick={onClose}>
        Cancel
      </AdminButton>
      <AdminButton onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </AdminButton>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <button
        type="button"
        onClick={onClose}
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-muted transition-colors hover:text-green"
      >
        ← All site content
      </button>

      <PageHeader title={schema.title} subtitle={schema.description} actions={actions} />

      <ErrorBanner error={error} />

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 w-full lg:flex-1">
          <SettingsSections schema={schema} value={draft} onChange={setDraft} />

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
            {actions}
            <SavedNote show={saved && !error} />
            <span className="ml-auto flex items-center gap-3">
              <span className="text-[0.78rem] text-muted">Want the wording it came with?</span>
              <AdminButton
                variant="secondary"
                onClick={() => setDraft(hydrateSetting(defaultsFor(settingKey), {}))}
              >
                Restore original wording
              </AdminButton>
            </span>
          </div>
        </div>

        {schema.previewPath && pane.open ? (
          <div className="hidden min-h-0 w-full lg:block lg:w-[46%]">
            <div className="h-full min-h-[600px] overflow-hidden rounded-2xl border border-rule bg-paper">
              <PreviewPane
                path={schema.previewPath}
                label={`Preview · ${schema.previewPath}`}
                pane={pane}
                footnote="This is a preview of your unsaved changes. Nothing is live until you press Save changes."
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Fallback for keys with no form. Kept so nothing in the table becomes uneditable. */
function RawEditor({
  settingKey,
  stored,
  onClose,
}: {
  settingKey: string;
  stored: unknown;
  onClose: () => void;
}) {
  const { run, busy, error, saved } = useAction();
  const [text, setText] = useState(() => JSON.stringify(stored ?? {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setJsonError('The top level must be a JSON object, e.g. { "heading": "…" }');
      return;
    }
    setJsonError(null);
    const ok = await run(() =>
      adminSaveSetting({ data: { key: settingKey, value: parsed as never } }),
    );
    if (ok) onClose();
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-muted transition-colors hover:text-green"
      >
        ← All site content
      </button>

      <PageHeader
        title={settingKey}
        subtitle="This entry has no form yet, so it is edited as raw data."
        actions={
          <>
            <AdminButton variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </AdminButton>
          </>
        }
      />

      <ErrorBanner error={error} />

      <Card>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.min(30, text.split("\n").length + 2)}
          spellCheck={false}
          className="w-full rounded-xl border-[1.5px] border-rule bg-cream px-3.5 py-3 font-mono text-[0.78rem] leading-6 outline-none focus:border-green"
        />
        {jsonError ? (
          <p role="alert" className="text-[0.8rem] text-rust">
            {jsonError}
          </p>
        ) : null}
        <SavedNote show={saved && !error} />
      </Card>
    </>
  );
}
