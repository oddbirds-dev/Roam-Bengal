import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useRouter } from "@tanstack/react-router";
import { AdminIcon } from "@/components/admin/icons";

/** Shared chrome and interaction helpers for the admin screens. */

const SIDEBAR_COLLAPSE_KEY = "admin:sidebar-collapsed";
const SIDEBAR_COLLAPSE_EVENT = "admin:sidebar-collapse-change";

/**
 * Mirrors the admin shell's collapsed-sidebar preference outside the shell itself — for
 * pages like the tour editor that render their own `fixed` layout and must reserve the
 * same left offset the sidebar actually occupies.
 *
 * Starts expanded so SSR and first paint agree; the stored preference (and any change made
 * elsewhere in the same tab, via `setSidebarCollapsed`) is applied after mount.
 */
export function useSidebarCollapsed(): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const sync = () => setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1");
    sync();
    window.addEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
    return () => window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
  }, []);
  return collapsed;
}

/** Persists the sidebar's collapsed state and notifies other mounted `useSidebarCollapsed`
 *  consumers in the same tab — a plain `storage` event only fires in *other* tabs. */
export function setSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
  window.dispatchEvent(new Event(SIDEBAR_COLLAPSE_EVENT));
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.7rem] text-green">{title}</h1>
        {subtitle ? <p className="mt-1 text-[0.86rem] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  children,
  description,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-rule bg-paper p-6">
      {title ? (
        <header className="mb-5">
          <h2 className="font-display text-[1.1rem] font-bold text-green-dark">{title}</h2>
          {description ? (
            <p className="mt-1 text-[0.8rem] text-muted">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function AdminButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-green-dark text-white hover:bg-green border-transparent",
    secondary: "bg-paper text-ink border-rule hover:border-green hover:text-green",
    danger: "bg-paper text-rust border-rust/40 hover:bg-rust hover:text-white",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-[30px] border-[1.5px] px-5 py-2.5 text-[0.84rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "orange" | "muted";
}) {
  const styles = {
    neutral: "bg-mint text-green",
    green: "bg-green text-white",
    orange: "bg-orange text-white",
    muted: "bg-cream text-muted",
  }[tone];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${styles}`}>
      {children}
    </span>
  );
}

export function Table({
  head,
  children,
  empty,
}: {
  head: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-rule bg-paper">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-rule">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[0.72rem] font-semibold tracking-wide text-muted uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-12 text-center text-[0.88rem] text-muted">
                Nothing here yet.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-rule px-4 py-3 text-[0.86rem] ${className}`}>{children}</td>;
}

/**
 * Runs a server function and refreshes the route's loader data.
 *
 * Server functions report failure two different ways: a thrown Response surfaces as an
 * HTTP status (401/403/404), while an error thrown inside the handler — a Zod validation
 * failure, for instance — arrives as a rejected promise. Both land in `catch` here, so
 * neither can be mistaken for a successful save.
 */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function run<T>(fn: () => Promise<T>, opts?: { refresh?: boolean }): Promise<T | null> {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const result = await fn();
      if (opts?.refresh !== false) await router.invalidate();
      setSaved(true);
      return result;
    } catch (e) {
      setError(readableError(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error, saved, clearError: () => setError(null) };
}

/** Zod errors arrive as a JSON array of issues; show the messages, not the raw blob. */
function readableError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  try {
    const issues = JSON.parse(message);
    if (Array.isArray(issues)) {
      return issues
        .map((i) => {
          const path = Array.isArray(i.path) ? i.path.join(" → ") : "";
          return path ? `${path}: ${i.message}` : i.message;
        })
        .join("\n");
    }
  } catch {
    /* not JSON — fall through */
  }
  return message;
}

export function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-rust/40 bg-rust/5 p-4 text-[0.84rem] whitespace-pre-line text-rust"
    >
      {error}
    </div>
  );
}

export function SavedNote({ show, children = "Saved." }: { show: boolean; children?: ReactNode }) {
  if (!show) return null;
  return <span className="text-[0.82rem] font-semibold text-green">✓ {children}</span>;
}

/** Guarded destructive action — deletes here are not recoverable. */
export function DeleteButton({
  onConfirm,
  label = "Delete",
  confirmLabel = "Really delete?",
  disabled,
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <AdminButton variant="danger" onClick={() => setArmed(true)} disabled={disabled}>
        {label}
      </AdminButton>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <AdminButton
        variant="danger"
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </AdminButton>
      <AdminButton variant="secondary" onClick={() => setArmed(false)}>
        Cancel
      </AdminButton>
    </span>
  );
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog.
 *
 * Rendered inline with `fixed inset-0` rather than through `createPortal` — this mirrors
 * the mobile nav drawer in site-header.tsx (the only other overlay in the codebase) and
 * keeps SSR markup identical to the client's first render. `z-[60]` clears the admin
 * sidebar's `z-50`.
 *
 * Note `fixed` escapes an ancestor's `overflow` but not its `transform`; the tour editor's
 * split pane must not gain one.
 */
export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useFieldSafeId(title);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Return focus to whatever opened the dialog, so closing does not dump the caret at the
  // top of the document — the editor is usually mid-sentence in a textarea.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const target = initialFocusRef?.current ?? panelRef.current;
    target?.focus();
    return () => opener?.focus?.();
  }, [open, initialFocusRef]);

  if (!open) return null;

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/60"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapTab}
        className="relative flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-rule bg-paper shadow-xl outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-[1.05rem] font-bold text-green-dark">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[0.78rem] text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted transition-colors hover:bg-cream hover:text-ink"
          >
            <AdminIcon name="close" className="h-[16px] w-[16px]" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-rule bg-cream/40 px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/** Stable, SSR-safe id derived from the title — `useId` would be fine too, but this
 *  reads better in the DOM inspector and there is only ever one dialog open. */
function useFieldSafeId(label: string): string {
  return `dialog-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
