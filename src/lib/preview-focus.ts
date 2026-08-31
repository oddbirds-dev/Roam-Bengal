import { useEffect } from "react";

/**
 * "Show me the bit I'm editing" for the live preview.
 *
 * A settings group like the homepage banner or the photo gallery sits somewhere down a long
 * public page; opening its editor and seeing the top of the homepage means scrolling the iframe
 * by hand to find out whether the change landed. `ContentGroupDef.previewAnchor` names an element
 * id on that page, and the editor posts it once the frame is ready.
 *
 * Deliberately separate from `createDraftChannel`: which element to scroll to has nothing to do
 * with which entity is being drafted, and every preview — settings, tour, blog, review — wants
 * the same behaviour.
 */

const FOCUS_TYPE = "roam-bengal/preview-focus";
const FLASH_MS = 1200;

/** Editor side. No-op until the iframe has a document to receive it. */
export function sendPreviewFocus(frame: HTMLIFrameElement | null, anchor: string): void {
  if (!anchor) return;
  frame?.contentWindow?.postMessage({ type: FOCUS_TYPE, anchor }, window.location.origin);
}

/**
 * Preview side. Scrolls the named element into view and outlines it briefly, so the change is
 * findable even on a page where three sections look alike.
 */
export function usePreviewFocus(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.parent === window) return;

    let timer = 0;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; anchor?: string } | null;
      if (!data || data.type !== FOCUS_TYPE || !data.anchor) return;

      const el = document.getElementById(data.anchor);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Set on the style attribute rather than a class so this needs no co-operation from the
      // previewed page's own stylesheet.
      const previous = el.style.outline;
      const previousOffset = el.style.outlineOffset;
      el.style.outline = "3px solid var(--color-green-bright, #22b57a)";
      el.style.outlineOffset = "-3px";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        el.style.outline = previous;
        el.style.outlineOffset = previousOffset;
      }, FLASH_MS);
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [enabled]);
}
