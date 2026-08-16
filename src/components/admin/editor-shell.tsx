import { useEffect, useState, type ReactNode } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { AdminButton, useSidebarCollapsed } from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { PreviewPane, usePreviewPane } from "@/components/admin/preview-pane";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { settingsPreviewChannel } from "@/hooks/use-site-settings";
import { useMediaQuery } from "@/hooks/use-media-query";

const PREVIEW_PREF = "admin:preview-open";

/**
 * The frame every `site_settings` content editor shares: the form on the left, a live view
 * of the real page on the right, and one save bar that always says whether there is
 * anything unsaved. Fills the admin shell's `<main>` edge to edge (`fixed inset-0 top-14`,
 * offset by the sidebar's current width) so the save bar stays pinned to the bottom of the
 * viewport instead of scrolling away with a long form.
 */
export function EditorShell({
  title,
  blurb,
  previewPath,
  previewDraft,
  dirty,
  saving,
  onSave,
  onDiscard,
  backTo,
  backLabel = "← All site content",
  children,
}: {
  title: string;
  blurb: string;
  /** Public route path the preview loads, e.g. `/` or `/tours`. Omitted where there's no
   *  single page this content visibly affects — the form then fills the full width. */
  previewPath?: string;
  /** Every `site_settings` row this screen can edit, with its unsaved draft merged in. */
  previewDraft: Record<string, unknown>;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  const sidebarCollapsed = useSidebarCollapsed();
  const wide = useMediaQuery("(min-width: 1024px)");
  const pane = usePreviewPane(settingsPreviewChannel, previewDraft);
  const [dragging, setDragging] = useState(false);

  // Read the stored preference after mount: on the server there is no localStorage, and
  // guessing wrong would flash the wrong layout.
  useEffect(() => {
    pane.setOpen(window.localStorage.getItem(PREVIEW_PREF) !== "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // react-resizable-panels exposes no drag-state prop; the iframe still needs to stop
  // swallowing the pointer mid-drag, so track it the same way `usePreviewPane.startResize`
  // does for the tour editor's own hand-rolled divider.
  useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [dragging]);

  function togglePreview() {
    pane.setOpen((open) => {
      window.localStorage.setItem(PREVIEW_PREF, open ? "0" : "1");
      return !open;
    });
  }

  // Leaving mid-edit — whether by closing the tab or navigating to another admin page —
  // loses the work silently otherwise. `enableBeforeUnload` covers the tab-close/refresh
  // case; `shouldBlockFn` covers in-app navigation, which the browser has no prompt for.
  useBlocker({
    shouldBlockFn: () => !window.confirm("You have unsaved changes. Leave without saving?"),
    enableBeforeUnload: true,
    disabled: !dirty,
  });

  const form = (
    <>
      {backTo ? (
        <Link
          to={backTo as never}
          className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-muted transition-colors hover:text-green"
        >
          {backLabel}
        </Link>
      ) : null}
      <h1 className={`font-display text-[1.7rem] text-green ${backTo ? "mt-4" : ""}`}>{title}</h1>
      <p className="mt-1 max-w-xl text-[0.86rem] text-muted">{blurb}</p>
      <div className="mt-6">{children}</div>
    </>
  );

  return (
    <div
      className={`fixed inset-0 top-14 z-10 flex flex-col bg-[#F6F8F6] transition-[left] ${
        sidebarCollapsed ? "lg:left-19" : "lg:left-55"
      }`}
    >
      <div className="min-h-0 flex-1 p-4">
        {previewPath && wide && pane.open ? (
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full overflow-hidden rounded-2xl border border-rule bg-paper"
          >
            <ResizablePanel defaultSize="45" minSize="30">
              <div className="h-full overflow-y-auto p-6">{form}</div>
            </ResizablePanel>
            <ResizableHandle withHandle onPointerDown={() => setDragging(true)} />
            <ResizablePanel defaultSize="55" minSize="25">
              {/* `PreviewPane`'s own root is a flex *item* (`flex-1`) that expects a flex
                  container parent with a definite height — true of every other place it's
                  used, but `Panel`'s internal wrapper div isn't `display:flex`, so without
                  this wrapper `flex-1` is inert and the iframe collapses to the browser's
                  ~150px default iframe height. */}
              <div className="flex h-full flex-col">
                <PreviewPane
                  path={previewPath}
                  label={`Preview · ${previewPath}`}
                  pane={{ ...pane, dragging }}
                  footnote={null}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full overflow-y-auto rounded-2xl border border-rule bg-paper p-6">
            <div className="mx-auto max-w-3xl">{form}</div>
          </div>
        )}
      </div>

      <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-t border-rule bg-white px-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:px-6">
        <div className="flex min-w-0 items-center gap-5 text-[0.85rem] text-muted">
          <span className={dirty ? "font-semibold text-ink" : ""}>
            {saving ? "Saving…" : dirty ? "Unsaved changes" : "Everything is saved"}
          </span>
          {previewPath && wide ? (
            <button
              type="button"
              onClick={togglePreview}
              className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-ink"
            >
              <AdminIcon name={pane.open ? "eyeOff" : "eye"} className="h-4 w-4" />
              {pane.open ? "Hide preview" : "Show preview"}
            </button>
          ) : null}
          {previewPath && wide && pane.open ? (
            <span className="hidden truncate text-[0.78rem] text-muted lg:inline">
              This is a preview of your unsaved changes. Nothing is live until you press Save
              changes.
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <AdminButton variant="secondary" onClick={onDiscard} disabled={!dirty || saving}>
            Discard
          </AdminButton>
          <AdminButton onClick={onSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
