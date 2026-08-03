import { useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

/** Shared chrome and interaction helpers for the admin screens. */

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
