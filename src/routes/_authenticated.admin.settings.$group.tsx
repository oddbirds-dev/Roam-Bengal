import { useState } from "react";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AdminButton, ErrorBanner, useAction } from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import { SettingsSections, hydrateSetting } from "@/components/admin/settings-form";
import { SETTINGS_SCHEMA, asObject, type SettingsSchema } from "@/lib/content-schema";
import { infoDefaults, policyDefaults } from "@/content/policy-defaults";
import { siteDefaults } from "@/content/site-defaults";
import { adminPatchSetting } from "@/lib/admin-content.functions";
import { blocksToHtml } from "@/lib/info-sections-to-html";

export const Route = createFileRoute("/_authenticated/admin/settings/$group")({
  component: GroupEditor,
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

function serialize(v: unknown): string {
  return JSON.stringify(v);
}

/**
 * These pages used to be edited as a list of `blocks` (or, on rows pasted from the reference
 * implementation, `sections`) and are now one rich-text `body`. Rows saved before the switch —
 * and the shipped defaults in `src/content/policy-defaults.ts`, which are still written in the
 * block shape — are flattened to HTML on the way into the editor, so an old page opens styled
 * rather than blank.
 *
 * Read-side only: nothing writes `blocks` any more, and the original array is left on the row
 * untouched, so this is reversible until someone saves.
 */
function withStandaloneBody(key: string, value: unknown): unknown {
  if (!key.startsWith("info_") && !key.startsWith("policy_")) return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const row = value as Record<string, unknown>;

  // An existing body wins: once the page has been saved in the new shape, the stale block array
  // beside it is history, not content.
  if (typeof row.body === "string" && row.body.trim()) return value;

  const legacy = Array.isArray(row.blocks) ? row.blocks : row.sections;
  const body = blocksToHtml(legacy);
  return body ? { ...row, body } : value;
}

function GroupEditor() {
  const { group: groupId } = Route.useParams();
  const rows = useLoaderData({ from: "/_authenticated/admin/settings" }) as SettingsRow[];
  const stored = withStandaloneBody(groupId, rows.find((r) => r.key === groupId)?.value);
  const schema = SETTINGS_SCHEMA[groupId];

  return schema ? (
    <SchemaEditor key={groupId} settingKey={groupId} schema={schema} stored={stored} />
  ) : (
    <RawEditor key={groupId} settingKey={groupId} stored={stored} />
  );
}

/**
 * Site content, edited as a form rather than JSON.
 *
 * The shape of each key lives in content-schema.ts. Every key ships a default in code
 * (src/content/site-defaults.ts) which the stored value merges over, so "Restore original
 * wording" is a local reset of the form, not a delete.
 */
function SchemaEditor({
  settingKey,
  schema,
  stored,
}: {
  settingKey: string;
  schema: SettingsSchema;
  stored: unknown;
}) {
  const { run, busy, error } = useAction();
  // Run the legacy conversion over the *merged* value, not just the stored row: the shipped
  // defaults are still written as blocks, so a page nobody has saved yet would otherwise open
  // with an empty body.
  const hydrate = (row: unknown) =>
    asObject(withStandaloneBody(settingKey, hydrateSetting(defaultsFor(settingKey), row)));
  const initial = hydrate(stored);
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const dirty = serialize(draft) !== serialize(baseline);

  async function save() {
    // Optional fields the page has never had set (e.g. `banner_image` on a page whose
    // shipped default omits it) hydrate to `undefined`. The patch validator only accepts
    // JSON values, and a shallow merge treats a missing key and an undefined one the same,
    // so drop them rather than send `undefined` over the wire.
    const patch = Object.fromEntries(
      schema.sections.flatMap((section) =>
        section.fields
          .map((field) => [field.key, draft[field.key]] as const)
          .filter(([, value]) => value !== undefined),
      ),
    );
    const ok = await run(() =>
      adminPatchSetting({ data: { key: settingKey, patch: patch as never } }),
    );
    if (ok) setBaseline(draft);
  }

  return (
    <EditorShell
      title={schema.title}
      blurb={schema.description}
      previewPath={schema.previewPath}
      previewAnchor={schema.previewAnchor}
      previewDraft={{ [settingKey]: draft }}
      dirty={dirty}
      saving={busy}
      onSave={save}
      onDiscard={() => setDraft(baseline)}
      backTo="/admin/settings"
      backLabel="All site content"
    >
      <ErrorBanner error={error} />
      <div className="mt-4">
        <SettingsSections schema={schema} value={draft} onChange={setDraft} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-6 pb-2">
        <span className="text-[0.78rem] text-muted">Want the wording it came with?</span>
        <AdminButton
          variant="secondary"
          onClick={() => setDraft(hydrate({}))}
        >
          Restore original wording
        </AdminButton>
      </div>
    </EditorShell>
  );
}

/** Fallback for keys with no form. Kept so nothing in the settings table becomes uneditable. */
function RawEditor({ settingKey, stored }: { settingKey: string; stored: unknown }) {
  const { run, busy, error } = useAction();
  const [text, setText] = useState(() => JSON.stringify(stored ?? {}, null, 2));
  const [baseline, setBaseline] = useState(text);
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
      adminPatchSetting({ data: { key: settingKey, patch: parsed as never } }),
    );
    if (ok) setBaseline(text);
  }

  return (
    <EditorShell
      title={settingKey}
      blurb="This entry has no form yet, so it is edited as raw data."
      previewDraft={{ [settingKey]: text }}
      dirty={text !== baseline}
      saving={busy}
      onSave={save}
      onDiscard={() => {
        setText(baseline);
        setJsonError(null);
      }}
      backTo="/admin/settings"
      backLabel="All site content"
    >
      <ErrorBanner error={error} />
      <div className="rounded-2xl border border-rule bg-paper p-5">
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
      </div>
    </EditorShell>
  );
}
