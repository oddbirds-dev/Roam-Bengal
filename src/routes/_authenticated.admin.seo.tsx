import { useMemo, useState } from "react";
import { createFileRoute, useBlocker, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AdminButton,
  AdminModal,
  Badge,
  Card,
  ConfirmButton,
  ErrorBanner,
  PageHeader,
  Table,
  Td,
  toast,
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
  validateSearch: z.object({
    tab: z.enum(["pages", "redirects", "orphans", "robots", "sitemap"]).optional().catch("pages"),
    q: z.string().optional().catch(""),
    type: z.enum(["all", "tour", "destination", "blog", "activity", "page"]).optional().catch("all"),
  }),
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

type Tab = "pages" | "redirects" | "orphans" | "robots" | "sitemap";
const TABS: { id: Tab; label: string }[] = [
  { id: "pages", label: "Pages" },
  { id: "redirects", label: "Redirects" },
  { id: "orphans", label: "Orphans" },
  { id: "robots", label: "Robots.txt" },
  { id: "sitemap", label: "Sitemap" },
];

function SeoScreen() {
  const { targets, redirects, orphans, robotsContent } = Route.useLoaderData();
  const { tab = "pages" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const missingDescription = targets.filter((target) => !target.seo?.meta_description).length;
  const missingKeyphrase = targets.filter((target) => !target.seo?.focus_keyphrase).length;
  const cornerstone = targets.filter((target) => target.seo?.cornerstone).length;

  return (
    <>
      <PageHeader
        title="SEO"
        subtitle="Per-page meta tags, redirects, orphaned content, and robots.txt. See it live at /sitemap.xml."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SeoStat label="Pages" value={targets.length} />
        <SeoStat label="Missing meta description" value={missingDescription} warn={missingDescription > 0} />
        <SeoStat label="Missing keyphrase" value={missingKeyphrase} warn={missingKeyphrase > 0} />
        <SeoStat label="Cornerstone" value={cornerstone} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-rule pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate({ search: (previous) => ({ ...previous, tab: t.id }), replace: true, resetScroll: false })}
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
      {tab === "sitemap" ? <SitemapTab targets={targets} /> : null}
    </>
  );
}

function SeoStat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-paper p-4 ${warn ? "border-rust/50" : "border-rule"}`}>
      <p className={`font-display text-2xl font-bold ${warn ? "text-rust" : "text-green-dark"}`}>{value}</p>
      <p className="mt-1 text-[0.76rem] font-semibold tracking-wide text-muted uppercase">{label}</p>
    </div>
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
  const { q = "", type = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const needle = q.trim().toLowerCase();
  const filtered = targets.filter((target) =>
    (type === "all" || target.entity_type === type) &&
    (!needle || target.title.toLowerCase().includes(needle) || target.path.toLowerCase().includes(needle)),
  );
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input
          type="search"
          value={q}
          onChange={(event) => navigate({ search: (previous) => ({ ...previous, q: event.target.value }), replace: true, resetScroll: false })}
          placeholder="Search by title or path"
          className="rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
        />
        <select
          value={type}
          onChange={(event) => navigate({ search: (previous) => ({ ...previous, type: event.target.value as typeof type }), replace: true, resetScroll: false })}
          className="rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
        >
          <option value="all">All content types</option>
          <option value="tour">Tours</option>
          <option value="destination">Destinations</option>
          <option value="blog">Blog posts</option>
          <option value="activity">Activities</option>
          <option value="page">Static pages</option>
        </select>
      </div>
      <Table head={["Page", "Path", "Focus keyphrase", "Score", ""]} empty={filtered.length === 0}>
        {filtered.map((t) => {
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
  const { run, busy, error } = useAction();
  const seo = target.seo;
  const initial = useMemo(() => ({
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
  }), [seo, target.path]);
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useBlocker({
    shouldBlockFn: () => !window.confirm("You have unsaved SEO changes. Leave without saving?"),
    enableBeforeUnload: true,
    disabled: !dirty,
  });

  const keyphraseChecks = useMemo(
    () => analyzeKeyphrase({
        keyphrase: form.focus_keyphrase,
        title: form.meta_title || target.title,
        metaDescription: form.meta_description,
        slug: target.path,
        body: form.meta_description,
      }),
    [form.focus_keyphrase, form.meta_title, form.meta_description, target.title, target.path],
  );
  const readabilityChecks = useMemo(
    () => analyzeReadability(form.meta_description),
    [form.meta_description],
  );
  const checks = [...keyphraseChecks, ...readabilityChecks];
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
    if (ok) {
      toast.success("SEO saved");
      onClose();
    }
  }

  function close() {
    if (!dirty || window.confirm("Discard your unsaved SEO changes?")) onClose();
  }

  const publicUrl = new URL(target.path, window.location.origin).toString();

  return (
    <AdminModal
      open
      onClose={close}
      title={target.title}
      description={target.path}
      panelClassName="max-w-5xl"
      footer={
        <>
          <AdminButton onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={close}>
            Cancel
          </AdminButton>
        </>
      }
    >
      <div className="overflow-y-auto p-5">
        <ErrorBanner error={error} />
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">

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
          label="Synonyms"
          hint="Comma-separated"
          value={form.synonyms}
          onChange={(v) => set("synonyms", v)}
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
          label="Twitter description"
          rows={2}
          plain
          value={form.twitter_description}
          onChange={(v) => set("twitter_description", v)}
        />
        <TextField
          label="Schema type"
          hint="For example: TouristTrip, Article, or WebPage"
          value={form.schema_type}
          onChange={(v) => set("schema_type", v)}
        />
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
          <aside className="grid content-start gap-5">
          <SerpPreview
            title={form.meta_title || target.title}
            url={publicUrl}
            description={form.meta_description}
          />
          <SocialPreview
            title={form.og_title || form.meta_title || target.title}
            description={form.og_description || form.meta_description}
            image={form.og_image || form.twitter_image}
            url={publicUrl}
          />
          <ChecksList title="Keyphrase checks" checks={keyphraseChecks} />
          <ChecksList title="Readability checks" checks={readabilityChecks} />
          </aside>
        </div>
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

type SeoCheck = ReturnType<typeof analyzeKeyphrase>[number];

function ChecksList({ title, checks }: { title: string; checks: SeoCheck[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-paper">
      <p className="border-b border-rule bg-cream/50 px-4 py-2 text-[0.74rem] font-semibold tracking-wide uppercase">{title}</p>
      <ul className="divide-y divide-rule">
        {checks.map((check) => (
          <li key={check.id} className="flex gap-3 px-4 py-3 text-[0.8rem]">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${check.status === "good" ? "bg-green" : check.status === "bad" ? "bg-rust" : check.status === "ok" ? "bg-orange" : "bg-muted"}`} />
            <div><p className="font-semibold text-ink">{check.label}</p><p className="mt-0.5 text-muted">{check.message}</p></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SerpPreview({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-4">
      <p className="mb-3 text-[0.72rem] font-semibold tracking-wide text-muted uppercase">Google preview</p>
      <p className="truncate text-[0.78rem] text-green-dark">{url}</p>
      <p className="mt-1 truncate text-lg font-medium text-[#1a0dab]">{title || "Untitled page"}</p>
      <p className="mt-1 line-clamp-2 text-[0.82rem] leading-5 text-muted">{description || "No meta description set."}</p>
    </div>
  );
}

function SocialPreview({ title, description, image, url }: { title: string; description: string; image: string; url: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-paper">
      {image ? <img src={image} alt="" className="aspect-[1200/630] w-full object-cover" /> : <div className="grid aspect-[1200/630] w-full place-items-center bg-cream text-[0.78rem] text-muted">No social image</div>}
      <div className="p-4">
        <p className="text-[0.7rem] tracking-wide text-muted uppercase">{new URL(url).host}</p>
        <p className="mt-1 line-clamp-2 font-display text-lg font-bold text-green-dark">{title}</p>
        <p className="mt-1 line-clamp-2 text-[0.8rem] text-muted">{description}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

function blankRedirect() {
  return { from_path: "", to_path: "", status_code: "301" as "301" | "302" };
}

function RedirectsTab({ redirects }: { redirects: RedirectRow[] }) {
  const { run, busy, error } = useAction();
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
    if (ok) {
      toast.success("Redirect saved");
      setEditing(null);
    }
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
              <ConfirmButton
                title={`Delete redirect ${r.from_path}?`}
                description={`Visitors going to ${r.from_path} will no longer be sent to ${r.to_path}.`}
                disabled={busy}
                onConfirm={async () => {
                  const ok = await run(() => adminDeleteRedirect({ data: { id: r.id } }));
                  if (ok) toast.success("Redirect deleted");
                }}
              >
                Delete
              </ConfirmButton>
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
  const { run, busy, error } = useAction();
  const [content, setContent] = useState(initialContent);

  async function save() {
    const ok = await run(() => adminSaveSetting({ data: { key: "robots", value: { content } } }));
    if (ok) toast.success("robots.txt saved");
  }

  return (
    <Card title="robots.txt" description="Leave empty to serve the built-in default.">
      <TextArea label="Content" rows={10} plain value={content} onChange={setContent} />
      <div className="flex items-center gap-3">
        <AdminButton
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save"}
        </AdminButton>
      </div>
      <ErrorBanner error={error} />
    </Card>
  );
}

function SitemapTab({ targets }: { targets: SeoTarget[] }) {
  return (
    <Card title="XML sitemap">
      <p className="text-[0.86rem] leading-6 text-muted">
        The sitemap is generated from published site content and served live at{" "}
        <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="font-semibold text-green hover:underline">
          /sitemap.xml
        </a>
        .
      </p>
      <p className="mt-3 text-[0.86rem] text-ink">Currently tracked dynamic pages: <strong>{targets.length}</strong></p>
    </Card>
  );
}
