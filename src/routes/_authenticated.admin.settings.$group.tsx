import { useState } from "react";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { AdminButton, Card, ErrorBanner, PageHeader, SavedNote, useAction } from "@/components/admin/admin-ui";
import { EditorShell } from "@/components/admin/editor-shell";
import {
  SETTINGS_SCHEMA,
  SettingsSections,
  hydrateSetting,
  mergeSetting,
  type SettingsSchema,
} from "@/components/admin/settings-form";
import { infoDefaults, policyDefaults } from "@/content/policy-defaults";
import { siteDefaults } from "@/content/site-defaults";
import { adminSaveSetting } from "@/lib/admin-content.functions";

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

function GroupEditor() {
  const { group: groupId } = Route.useParams();
  const rows = useLoaderData({ from: "/_authenticated/admin/settings" }) as SettingsRow[];
  const stored = rows.find((r) => r.key === groupId)?.value;
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
 * The shape of each key lives in settings-form.tsx. Every key ships a default in code
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
  const initial = hydrateSetting(defaultsFor(settingKey), stored);
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(() => serialize(initial));
  const dirty = serialize(draft) !== baseline;

  async function save() {
    const merged = mergeSetting(stored, draft);
    const ok = await run(() => adminSaveSetting({ data: { key: settingKey, value: merged as never } }));
    if (ok) setBaseline(serialize(draft));
  }

  return (
    <EditorShell
      title={schema.title}
      blurb={schema.description}
      previewPath={schema.previewPath}
      previewDraft={{ [settingKey]: draft }}
      dirty={dirty}
      saving={busy}
      onSave={save}
      onDiscard={() => setDraft(hydrateSetting(defaultsFor(settingKey), stored))}
      backTo="/admin/settings"
    >
      <ErrorBanner error={error} />
      <div className="mt-4">
        <SettingsSections schema={schema} value={draft} onChange={setDraft} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-6 pb-2">
        <span className="text-[0.78rem] text-muted">Want the wording it came with?</span>
        <AdminButton
          variant="secondary"
          onClick={() => setDraft(hydrateSetting(defaultsFor(settingKey), {}))}
        >
          Restore original wording
        </AdminButton>
      </div>
    </EditorShell>
  );
}

/** Fallback for keys with no form. Kept so nothing in the settings table becomes uneditable. */
function RawEditor({ settingKey, stored }: { settingKey: string; stored: unknown }) {
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
    await run(() => adminSaveSetting({ data: { key: settingKey, value: parsed as never } }));
  }

  return (
    <>
      <Link
        to="/admin/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-muted transition-colors hover:text-green"
      >
        ← All site content
      </Link>

      <PageHeader
        title={settingKey}
        subtitle="This entry has no form yet, so it is edited as raw data."
        actions={
          <AdminButton onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </AdminButton>
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
