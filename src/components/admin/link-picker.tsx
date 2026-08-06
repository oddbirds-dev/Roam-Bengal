import { useEffect, useMemo, useRef, useState } from "react";
import { AdminButton, AdminModal, Badge } from "@/components/admin/admin-ui";
import { adminListLinkTargets } from "@/lib/admin-content.functions";
import {
  STATIC_LINK_TARGETS,
  searchTargets,
  type LinkTarget,
  type LinkTargetKind,
} from "@/lib/link-targets";

/**
 * The searchable list of everything on the site an editor can link to.
 *
 * Used two ways: from the markdown toolbar to insert a link (`mode="href"`), and from the
 * related-content fields to pick a slug (`mode="slug"`).
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/**
 * Module-scoped promise cache.
 *
 * The picker is opened from a private component nested deep inside `fields.tsx`, reached
 * from three unrelated admin screens — threading route-loader data down to it would mean
 * plumbing through every editor. React Query is a dependency but is unused across the
 * whole app, so wiring a provider for one list is disproportionate. So: one fetch per
 * admin session, invalidated explicitly when content is saved.
 */
let cache: Promise<LinkTarget[]> | null = null;

export function invalidateLinkTargets(): void {
  cache = null;
}

async function fetchLinkTargets(): Promise<LinkTarget[]> {
  const { tours, posts } = await adminListLinkTargets();

  const tourTargets: LinkTarget[] = tours.map((t) => ({
    kind: "tour",
    path: `/tours/${t.slug}`,
    label: t.title,
    group: "Tours",
    slug: t.slug,
    keywords: [t.slug, t.category ?? ""],
    published: Boolean(t.is_published),
  }));

  const postTargets: LinkTarget[] = posts.map((p) => ({
    kind: "post",
    path: `/blog/${p.slug}`,
    label: p.title,
    group: "Blog posts",
    slug: p.slug,
    keywords: [p.slug, p.category ?? ""],
    published: Boolean(p.is_published),
  }));

  return [...tourTargets, ...postTargets, ...STATIC_LINK_TARGETS];
}

export function useLinkTargets(): { targets: LinkTarget[]; loading: boolean; error: string | null } {
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const promise = (cache ??= fetchLinkTargets());
    promise.then(
      (rows) => {
        if (!alive) return;
        setTargets(rows);
        setLoading(false);
      },
      (e: unknown) => {
        if (!alive) return;
        // A failed fetch must not poison the cache for the rest of the session.
        cache = null;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  return { targets, loading, error };
}

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

export interface LinkPickResult {
  /** The path for `mode="href"`, or the bare slug for `mode="slug"`. */
  value: string;
  label: string;
}

export function LinkPicker({
  open,
  onClose,
  onPick,
  initial,
  filter,
  mode = "href",
  title = "Insert link",
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (result: LinkPickResult) => void;
  /** Pre-fills the anchor text and pre-selects the current href when editing a link. */
  initial?: { href: string; text: string };
  filter?: LinkTargetKind[];
  mode?: "href" | "slug";
  title?: string;
  /** Shown as a "Remove link" action when the caret sits inside an existing link. */
  onRemove?: () => void;
}) {
  const { targets, loading, error } = useLinkTargets();
  const [tab, setTab] = useState<"site" | "external">("site");
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [external, setExternal] = useState("");
  const [active, setActive] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset per opening — a stale query from last time is never what the editor wants.
  useEffect(() => {
    if (!open) return;
    const editingExternal = Boolean(initial?.href && /^(https?:|mailto:|tel:)/i.test(initial.href));
    setTab(editingExternal ? "external" : "site");
    setQuery("");
    setText(initial?.text ?? "");
    setExternal(editingExternal ? initial!.href : "");
    setActive(0);
  }, [open, initial]);

  const visible = useMemo(() => {
    const pool = filter ? targets.filter((t) => filter.includes(t.kind)) : targets;
    return searchTargets(pool, query);
  }, [targets, filter, query]);

  useEffect(() => setActive(0), [query]);

  const commit = (target: LinkTarget) => {
    onPick({
      value: mode === "slug" ? (target.slug ?? target.path) : target.path,
      label: text.trim() || target.label,
    });
    onClose();
  };

  const commitExternal = () => {
    const href = external.trim();
    if (!href) return;
    onPick({ value: href, label: text.trim() || href });
    onClose();
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        const clamped = Math.max(0, Math.min(visible.length - 1, next));
        listRef.current
          ?.querySelector(`[data-index="${clamped}"]`)
          ?.scrollIntoView({ block: "nearest" });
        return clamped;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = visible[active];
      if (target) commit(target);
    }
  };

  // Group headings, preserving the ranked order search returned.
  const grouped = useMemo(() => {
    const out: { group: string; items: { target: LinkTarget; index: number }[] }[] = [];
    visible.forEach((target, index) => {
      const last = out[out.length - 1];
      if (last && last.group === target.group) last.items.push({ target, index });
      else out.push({ group: target.group, items: [{ target, index }] });
    });
    return out;
  }, [visible]);

  const showAnchorText = mode === "href";

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      description={
        mode === "slug"
          ? "Pick from the pages already on your site."
          : "Choose a page on your site, or paste an external address."
      }
      initialFocusRef={searchRef}
      footer={
        <>
          {onRemove ? (
            <span className="mr-auto">
              <AdminButton
                variant="danger"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
              >
                Remove link
              </AdminButton>
            </span>
          ) : null}
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          {tab === "external" ? (
            <AdminButton onClick={commitExternal} disabled={!external.trim()}>
              Insert
            </AdminButton>
          ) : null}
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-4">
        {mode === "href" ? (
          <div className="flex gap-1 rounded-[10px] bg-cream p-1">
            {(
              [
                ["site", "Site page"],
                ["external", "External URL"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={`flex-1 rounded-[7px] px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                  tab === key ? "bg-paper text-green shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {showAnchorText ? (
          <label className="block">
            <span className="mb-1 block text-[0.66rem] font-semibold tracking-[0.11em] text-muted uppercase">
              Link text
            </span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="The words people will click"
              className="w-full rounded-[10px] border border-rule bg-paper px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-green focus:ring-2 focus:ring-green/15"
            />
          </label>
        ) : null}

        {tab === "external" ? (
          <label className="block">
            <span className="mb-1 block text-[0.66rem] font-semibold tracking-[0.11em] text-muted uppercase">
              Web address
            </span>
            <input
              ref={searchRef}
              type="url"
              value={external}
              onChange={(e) => setExternal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commitExternal())}
              placeholder="https://example.com"
              className="w-full rounded-[10px] border border-rule bg-paper px-3.5 py-2.5 font-mono text-[0.82rem] outline-none focus:border-green focus:ring-2 focus:ring-green/15"
            />
            <span className="mt-1 block text-[0.74rem] text-muted">
              Opens in a new tab. Start with <code>https://</code>.
            </span>
          </label>
        ) : (
          <>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onListKeyDown}
              placeholder="Search tours, blog posts and pages…"
              aria-label="Search pages"
              className="w-full rounded-[10px] border border-rule bg-paper px-3.5 py-2.5 text-[0.88rem] outline-none focus:border-green focus:ring-2 focus:ring-green/15"
            />

            <div
              ref={listRef}
              role="listbox"
              aria-label="Pages"
              className="-mx-1 min-h-[220px] flex-1 overflow-y-auto px-1"
            >
              {error ? (
                <p className="p-4 text-[0.84rem] text-rust">Could not load pages: {error}</p>
              ) : loading ? (
                <p className="p-4 text-[0.84rem] text-muted">Loading pages…</p>
              ) : !visible.length ? (
                <p className="p-4 text-[0.84rem] text-muted">
                  Nothing matches “{query}”.
                </p>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group}>
                    <div className="sticky top-0 bg-paper py-1.5 text-[0.66rem] font-semibold tracking-[0.11em] text-muted uppercase">
                      {group}
                    </div>
                    {items.map(({ target, index }) => (
                      <button
                        key={target.path}
                        type="button"
                        data-index={index}
                        role="option"
                        aria-selected={index === active}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => commit(target)}
                        className={`flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left transition-colors ${
                          index === active ? "bg-mint" : "hover:bg-cream"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.86rem] font-medium text-ink">
                            {target.label}
                          </span>
                          <span className="block truncate font-mono text-[0.72rem] text-muted">
                            {target.path}
                          </span>
                        </span>
                        {target.published === false ? <Badge tone="muted">Draft</Badge> : null}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AdminModal>
  );
}
