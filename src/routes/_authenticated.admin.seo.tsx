import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminButton,
  AdminModal,
  Badge,
  Card,
  DeleteButton,
  ErrorBanner,
  PageHeader,
  SavedNote,
  Table,
  Td,
  useAction,
} from "@/components/admin/admin-ui";
import { SelectField, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { adminListSettings, adminSaveSetting } from "@/lib/admin-content.functions";
import {
  adminDeleteRedirect,
  adminListAllSeoTargets,
  adminListRedirects,
  adminOrphanedPosts,
  adminSaveRedirect,
  adminSaveSeoMeta,
  type RedirectRow,
  type SeoTarget,
} from "@/lib/seo.functions";
import { analyzeKeyphrase, analyzeReadability, overallScore } from "@/lib/seo-analysis";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  loader: async () => {
    const [targets, redirects, orphans, settings] = await Promise.all([
      adminListAllSeoTargets(),
      adminListRedirects(),
      adminOrphanedPosts(),
      adminListSettings(),
    ]);
    const robotsRow = settings.find((s) => s.key === "robots");
    const robotsValue = robotsRow?.value as { content?: string } | null;
    return {
      targets,
      redirects,
      orphans,
      robotsContent: typeof robotsValue?.content === "string" ? robotsValue.content : "",
    };
  },
  component: SeoScreen,
});

type Tab = "pages" | "redirects" | "orphans" | "robots";
const TABS: { id: Tab; label: string }[] = [
  { id: "pages", label: "Pages" },
  { id: "redirects", label: "Redirects" },
  { id: "orphans", label: "Orphans" },
  { id: "robots", label: "Robots.txt" },
];

function SeoScreen() {
  const { targets, redirects, orphans, robotsContent } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("pages");

  return (
    <>
      <PageHeader
        title="SEO"
        subtitle="Per-page meta tags, redirects, orphaned content, and robots.txt. See it live at /sitemap.xml."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-rule pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border-[1.5px] px-4 py-1.5 text-[0.82rem] font-semibold transition-colors ${
              tab === t.id
                ? "border-transparent bg-green-dark text-white"
                : "border-rule bg-paper text-ink hover:border-green hover:text-green"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pages" ? <PagesTab targets={targets} /> : null}
      {tab === "redirects" ? <RedirectsTab redirects={redirects} /> : null}
      {tab === "orphans" ? <OrphansTab orphans={orphans} /> : null}
      {tab === "robots" ? <RobotsTab initialContent={robotsContent} /> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function scoreFor(target: SeoTarget): { score: number; color: "good" | "ok" | "bad" | "info" } {
  const seo = target.seo;
  if (!seo?.focus_keyphrase) return { score: 0, color: "info" };
  const checks = [
    ...analyzeKeyphrase({
      keyphrase: seo.focus_keyphrase,
      title: seo.meta_title ?? target.title,
      metaDescription: seo.meta_description ?? "",
      slug: target.path,
      body: "",
    }),
    ...analyzeReadability(seo.meta_description ?? ""),
  ];
  const { score, color } = overallScore(checks);
  return { score, color };
}

function PagesTab({ targets }: { targets: SeoTarget[] }) {
  const [editing, setEditing] = useState<SeoTarget | null>(null);
  return (
    <>
      <Table head={["Page", "Path", "Focus keyphrase", "Score", ""]} empty={targets.length === 0}>
        {targets.map((t) => {
          const { score, color } = scoreFor(t);
          return (
            <tr key={`${t.entity_type}:${t.entity_id}`}>
              <Td className="font-semibold text-green-dark">{t.title}</Td>
              <Td className="text-muted">{t.path}</Td>
              <Td className="text-muted">{t.seo?.focus_keyphrase || "—"}</Td>
              <Td>
                <Badge tone={color === "good" ? "green" : color === "bad" ? "orange" : "muted"}>
                  {t.seo?.focus_keyphrase ? `${score}` : "Not set"}
                </Badge>
              </Td>
              <Td className="text-right">
                <AdminButton variant="secondary" onClick={() => setEditing(t)}>
                  Edit
                </AdminButton>
              </Td>
            </tr>
          );
        })}
      </Table>
      {editing ? <SeoEditModal target={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function SeoEditModal({ target, onClose }: { target: SeoTarget; onClose: () => void }) {
  const { run, busy, error, saved } = useAction();
  const seo = target.seo;
  const [form, setForm] = useState({
    focus_keyphrase: seo?.focus_keyphrase ?? "",
    extra_keyphrases: (seo?.extra_keyphrases ?? []).join(", "),
    synonyms: (seo?.synonyms ?? []).join(", "),
    meta_title: seo?.meta_title ?? "",
    meta_description: seo?.meta_description ?? "",
    canonical_url: seo?.canonical_url ?? target.path,
    og_title: seo?.og_title ?? "",
    og_description: seo?.og_description ?? "",
    og_image: seo?.og_image ?? "",
    twitter_title: seo?.twitter_title ?? "",
    twitter_description: seo?.twitter_description ?? "",
    twitter_image: seo?.twitter_image ?? "",
    robots_noindex: seo?.robots_noindex ?? false,
    cornerstone: seo?.cornerstone ?? false,
    schema_type: seo?.schema_type ?? "",
  });

  const checks = useMemo(
    () => [
      ...analyzeKeyphrase({
        keyphrase: form.focus_keyphrase,
        title: form.meta_title || target.title,
        metaDescription: form.meta_description,
        slug: target.path,
        body: form.meta_description,
      }),
      ...analyzeReadability(form.meta_description),
    ],
    [form.focus_keyphrase, form.meta_title, form.meta_description, target.title, target.path],
  );
  const { score, label, color } = overallScore(checks);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    const ok = await run(() =>
      adminSaveSeoMeta({
        data: {
          entity_type: target.entity_type,
          entity_id: target.entity_id,
          focus_keyphrase: form.focus_keyphrase || null,
          extra_keyphrases: splitCsv(form.extra_keyphrases),
          synonyms: splitCsv(form.synonyms),
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          canonical_url: form.canonical_url || null,
          og_title: form.og_title || null,
          og_description: form.og_description || null,
          og_image: form.og_image || null,
          twitter_title: form.twitter_title || null,
          twitter_description: form.twitter_description || null,
          twitter_image: form.twitter_image || null,
          robots_noindex: form.robots_noindex,
          cornerstone: form.cornerstone,
          schema_type: form.schema_type || null,
        },
      }),
    );
    if (ok) onClose();
  }

  return (
    <AdminModal
      open
      onClose={onClose}
      title={target.title}
      description={target.path}
      footer={
        <>
          <AdminButton onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <SavedNote show={saved && !error} />
        </>
      }
    >
      <div className="flex flex-col gap-5 overflow-y-auto p-5">
        <ErrorBanner error={error} />

        <div className="flex items-center gap-3 rounded-xl border border-rule bg-cream/40 p-3">
          <Badge tone={color === "good" ? "green" : color === "bad" ? "orange" : "muted"}>
            {label}
          </Badge>
          <span className="text-[0.8rem] text-muted">Score {score}/100</span>
        </div>

        <TextField
          label="Focus keyphrase"
          value={form.focus_keyphrase}
          onChange={(v) => set("focus_keyphrase", v)}
        />
        <TextField
          label="Extra keyphrases"
          hint="Comma-separated"
          value={form.extra_keyphrases}
          onChange={(v) => set("extra_keyphrases", v)}
        />
        <TextField
          label="SEO title"
          value={form.meta_title}
          onChange={(v) => set("meta_title", v)}
        />
        <TextArea
          label="Meta description"
          rows={3}
          plain
          value={form.meta_description}
          onChange={(v) => set("meta_description", v)}
        />
        <TextField
          label="Canonical URL"
          value={form.canonical_url}
          onChange={(v) => set("canonical_url", v)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="OG title" value={form.og_title} onChange={(v) => set("og_title", v)} />
          <TextField label="OG image" value={form.og_image} onChange={(v) => set("og_image", v)} />
        </div>
        <TextArea
          label="OG description"
          rows={2}
          plain
          value={form.og_description}
          onChange={(v) => set("og_description", v)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Twitter title"
            value={form.twitter_title}
            onChange={(v) => set("twitter_title", v)}
          />
          <TextField
            label="Twitter image"
            value={form.twitter_image}
            onChange={(v) => set("twitter_image", v)}
          />
        </div>

        <Toggle
          label="Noindex"
          hint="Hide this page from search engines"
          checked={form.robots_noindex}
          onChange={(v) => set("robots_noindex", v)}
        />
        <Toggle
          label="Cornerstone content"
          checked={form.cornerstone}
          onChange={(v) => set("cornerstone", v)}
        />
      </div>
    </AdminModal>
  );
}

function splitCsv(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

function blankRedirect() {
  return { from_path: "", to_path: "", status_code: "301" as "301" | "302" };
}

function RedirectsTab({ redirects }: { redirects: RedirectRow[] }) {
  const { run, busy, error, saved } = useAction();
  const [editing, setEditing] = useState<{ id?: string; form: ReturnType<typeof blankRedirect> } | null>(
    null,
  );

  async function save() {
    if (!editing) return;
    const ok = await run(() =>
      adminSaveRedirect({
        data: {
          ...(editing.id ? { id: editing.id } : {}),
          from_path: editing.form.from_path,
          to_path: editing.form.to_path,
          status_code: Number(editing.form.status_code) as 301 | 302,
        },
      }),
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <AdminButton onClick={() => setEditing({ form: blankRedirect() })}>
          + New redirect
        </AdminButton>
      </div>
      <ErrorBanner error={error} />

      {editing ? (
        <div className="mb-6">
          <Card title={editing.id ? "Edit redirect" : "New redirect"}>
            <TextField
              label="From path"
              hint="Must start with /"
              value={editing.form.from_path}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, from_path: v } })}
            />
            <TextField
              label="To path or URL"
              value={editing.form.to_path}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, to_path: v } })}
            />
            <SelectField
              label="Status code"
              value={editing.form.status_code}
              options={[
                { value: "301", label: "301 — Permanent" },
                { value: "302", label: "302 — Temporary" },
              ]}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, status_code: v } })}
            />
            <div className="flex items-center gap-3">
              <AdminButton onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <SavedNote show={saved && !error} />
            </div>
          </Card>
        </div>
      ) : null}

      <Table head={["From", "To", "Status", ""]} empty={redirects.length === 0}>
        {redirects.map((r) => (
          <tr key={r.id}>
            <Td>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    id: r.id,
                    form: {
                      from_path: r.from_path,
                      to_path: r.to_path,
                      status_code: String(r.status_code) as "301" | "302",
                    },
                  })
                }
                className="text-left font-semibold text-green-dark hover:text-green hover:underline"
              >
                {r.from_path}
              </button>
            </Td>
            <Td className="text-muted">{r.to_path}</Td>
            <Td>{r.status_code}</Td>
            <Td className="text-right">
              <DeleteButton
                disabled={busy}
                onConfirm={() => run(() => adminDeleteRedirect({ data: { id: r.id } }))}
              />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}

// ---------------------------------------------------------------------------
// Orphans
// ---------------------------------------------------------------------------

function OrphansTab({ orphans }: { orphans: { id: string; slug: string; title: string }[] }) {
  return (
    <Card
      title="Orphaned posts"
      description="Blog posts that no other post links to via /blog/<slug>. Consider cross-linking them from related content."
    >
      {orphans.length === 0 ? (
        <p className="text-[0.86rem] text-muted">No orphaned posts. Everything is linked.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orphans.map((o) => (
            <li key={o.id} className="flex items-center justify-between border-b border-rule py-2">
              <span className="font-semibold text-green-dark">{o.title}</span>
              <span className="text-[0.8rem] text-muted">/blog/{o.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Robots
// ---------------------------------------------------------------------------

function RobotsTab({ initialContent }: { initialContent: string }) {
  const { run, busy, error, saved } = useAction();
  const [content, setContent] = useState(initialContent);

  return (
    <Card title="robots.txt" description="Leave empty to serve the built-in default.">
      <TextArea label="Content" rows={10} plain value={content} onChange={setContent} />
      <div className="flex items-center gap-3">
        <AdminButton
          disabled={busy}
          onClick={() =>
            run(() => adminSaveSetting({ data: { key: "robots", value: { content } } }))
          }
        >
          {busy ? "Saving…" : "Save"}
        </AdminButton>
        <SavedNote show={saved && !error} />
      </div>
      <ErrorBanner error={error} />
    </Card>
  );
}
