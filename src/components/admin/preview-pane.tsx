import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminIcon } from "@/components/admin/icons";
import type { DraftChannel } from "@/lib/preview";
import { sendPreviewFocus } from "@/lib/preview-focus";

/**
 * Shared split-pane live-preview UI: an iframe of the real public page, kept in sync with
 * unsaved form state over `postMessage` (via a `DraftChannel`) instead of a reload.
 *
 * Extracted from the tour editor (`_authenticated.admin.tours.$id.tsx`), which was the
 * first and — until now — only place this pattern existed. `usePreviewPane` owns all the
 * state (open/closed, device width, divider position, the iframe's reload key) and the two
 * effects that push drafts down; `PreviewDivider`/`PreviewPane` are the presentational
 * halves a caller drops into its own split layout, exactly where the tour editor already
 * places them.
 */

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: "desktop", width: "100%" },
  { id: "tablet", label: "Tablet", icon: "tablet", width: "834px" },
  { id: "mobile", label: "Mobile", icon: "mobile", width: "390px" },
] as const;

export type DeviceId = (typeof DEVICES)[number]["id"];

export function usePreviewPane<T>(
  channel: DraftChannel<T>,
  draft: T,
  debounceMs = 180,
  /** Element id in the previewed page to scroll to and flash. */
  focusAnchor?: string,
) {
  const [open, setOpen] = useState(true);
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Debounced: typing a title should not post thirty messages a second.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => channel.sendDraft(frameRef.current, draft), debounceMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, open, debounceMs]);

  useEffect(
    () =>
      channel.onReady(() => {
        channel.sendDraft(frameRef.current, draftRef.current);
        // Sent on ready rather than on mount: the iframe finishes loading long after the editor
        // did, and an anchor posted before the document exists scrolls nothing.
        if (focusAnchor) sendPreviewFocus(frameRef.current, focusAnchor);
      }),
    [channel, focusAnchor],
  );

  // A later anchor change (the editor switched groups without remounting) re-focuses without
  // waiting for another ready handshake.
  useEffect(() => {
    if (!open || !focusAnchor) return;
    sendPreviewFocus(frameRef.current, focusAnchor);
  }, [open, focusAnchor]);

  function reload() {
    setFrameKey((k) => k + 1);
  }

  /** Drag the divider. The iframe stops swallowing the pointer while this runs. */
  function startResize(event: React.PointerEvent) {
    const bounds = splitRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    setDragging(true);

    const onMove = (e: PointerEvent) => {
      const pct = ((e.clientX - bounds.left) / bounds.width) * 100;
      setSplit(Math.min(72, Math.max(28, pct)));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return {
    open,
    setOpen,
    device,
    setDevice,
    dragging,
    frameKey,
    frameRef,
    splitRef,
    startResize,
    reload,
    /** The `--form-split` CSS var value for the caller's own flex container. */
    splitValue: open ? `${split}%` : "100%",
  };
}

/**
 * Fixed-height variant for editors that are an inline card in a scrolling page (settings,
 * posts, testimonials) rather than a dedicated full-screen route like the tour editor —
 * same toolbar and iframe, no resizable divider since there's no second pane to divide
 * against.
 */
export function EmbeddedPreview<T>({
  channel,
  draft,
  path,
  label,
  height = "560px",
}: {
  channel: DraftChannel<T>;
  draft: T;
  path: string;
  label: ReactNode;
  height?: string;
}) {
  const pane = usePreviewPane(channel, draft);
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper"
      style={{ height }}
    >
      <PreviewPane path={path} label={label} pane={pane} />
    </div>
  );
}

export function PreviewDivider({
  onPointerDown,
}: {
  onPointerDown: (event: React.PointerEvent) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize preview"
      onPointerDown={onPointerDown}
      className="group hidden w-3 shrink-0 cursor-col-resize items-center justify-center border-x border-rule bg-paper transition-colors hover:bg-mint lg:flex"
    >
      <span className="flex flex-col gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="h-[3px] w-[3px] rounded-full bg-muted/50 group-hover:bg-green" />
        ))}
      </span>
    </div>
  );
}

export function PreviewPane({
  path,
  label,
  pane,
  footnote = "This is a preview of your unsaved changes. Nothing is live until you press Save.",
}: {
  /** Public route path, without `?preview=1` — e.g. `/blog/my-post`. */
  path: string;
  /** Shown in the toolbar, e.g. `Preview · /blog/my-post`. */
  label: ReactNode;
  pane: ReturnType<typeof usePreviewPane<unknown>>;
  /** Pass `null` when the caller shows this disclaimer somewhere else (e.g. a fixed action bar). */
  footnote?: string | null;
}) {
  return (
    <div className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-rule bg-paper px-4">
        <span className="truncate text-[0.65rem] font-bold tracking-widest text-muted uppercase">
          {label}
        </span>
        <div className="flex items-center gap-1 text-muted">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-label={d.label}
              aria-pressed={pane.device === d.id}
              title={d.label}
              onClick={() => pane.setDevice(d.id)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                pane.device === d.id ? "bg-mint text-green" : "hover:text-ink"
              }`}
            >
              <AdminIcon name={d.icon} className="h-[17px] w-[17px]" />
            </button>
          ))}
          <button
            type="button"
            onClick={pane.reload}
            aria-label="Reload preview"
            title="Reload preview"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-ink"
          >
            <AdminIcon name="refresh" className="h-[17px] w-[17px]" />
          </button>
          <a
            href={path}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the live page"
            title="Open the live page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-ink"
          >
            <AdminIcon name="external" className="h-[17px] w-[17px]" />
          </a>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <div
          className="h-full w-full overflow-hidden border border-rule bg-white shadow-sm"
          style={{ maxWidth: DEVICES.find((d) => d.id === pane.device)?.width }}
        >
          <iframe
            key={pane.frameKey}
            ref={pane.frameRef}
            src={`${path}?preview=1`}
            title="Preview"
            // A dragged pointer must not disappear into the iframe's document.
            className={`h-full w-full border-none ${pane.dragging ? "pointer-events-none" : ""}`}
          />
        </div>
      </div>

      {footnote ? (
        <p className="shrink-0 border-t border-rule bg-paper px-4 py-2.5 text-[0.76rem] text-muted">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
