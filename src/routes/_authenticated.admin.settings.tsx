import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminButton,
  Card,
  ErrorBanner,
  PageHeader,
  SavedNote,
  useAction,
} from "@/components/admin/admin-ui";
import { adminListSettings, adminSaveSetting } from "@/lib/admin-content.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  loader: () => adminListSettings(),
  component: SettingsScreen,
});

/**
 * Site settings are free-form JSON per key, so this is a JSON editor with validation
 * rather than a typed form per key. Every key ships a default in code
 * (src/content/site-defaults.ts) which the stored JSON merges over — so removing a field
 * here restores the default rather than blanking the page.
 */
function SettingsScreen() {
  const settings = Route.useLoaderData();
  const { run, busy, error, saved } = useAction();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  function open(key: string, value: unknown) {
    setOpenKey(key);
    setDraft(JSON.stringify(value, null, 2));
    setJsonError(null);
  }

  async function save(key: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setJsonError("The top level must be a JSON object, e.g. { \"heading\": \"…\" }");
      return;
    }
    setJsonError(null);
    const ok = await run(() => adminSaveSetting({ data: { key, value: parsed as never } }));
    if (ok) setOpenKey(null);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Site chrome and page copy. Anything stored here is publicly readable — never put a secret in it."
      />

      <ErrorBanner error={error} />

      <div className="flex flex-col gap-4">
        {settings.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-mono text-[0.92rem] font-bold text-green-dark">{row.key}</h2>
                {row.description ? (
                  <p className="mt-1 text-[0.8rem] text-muted">{row.description}</p>
                ) : null}
              </div>
              {openKey === row.key ? (
                <div className="flex items-center gap-2">
                  <AdminButton onClick={() => save(row.key)} disabled={busy}>
                    {busy ? "Saving…" : "Save"}
                  </AdminButton>
                  <AdminButton variant="secondary" onClick={() => setOpenKey(null)}>
                    Cancel
                  </AdminButton>
                </div>
              ) : (
                <AdminButton variant="secondary" onClick={() => open(row.key, row.value)}>
                  Edit
                </AdminButton>
              )}
            </div>

            {openKey === row.key ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={Math.min(30, draft.split("\n").length + 2)}
                  spellCheck={false}
                  className="w-full rounded-xl border-[1.5px] border-rule bg-cream px-3.5 py-3 font-mono text-[0.78rem] leading-6 outline-none focus:border-green"
                />
                {jsonError ? (
                  <p role="alert" className="text-[0.8rem] text-rust">
                    {jsonError}
                  </p>
                ) : null}
                <SavedNote show={saved && !error} />
              </>
            ) : (
              <pre className="max-h-40 overflow-auto rounded-xl bg-cream p-3 font-mono text-[0.72rem] leading-5 text-muted">
                {JSON.stringify(row.value, null, 2)}
              </pre>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
