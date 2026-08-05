import { useEffect, useState } from "react";
import type { TourDTO } from "@/lib/content-types";

/**
 * The bridge behind the admin tour editor's live preview.
 *
 * The public tour page is rendered in an iframe at `/tours/<slug>?preview=1`. Instead of
 * reloading it on every keystroke — which would flash, lose scroll position, and only
 * ever show *saved* content — the editor posts the in-progress form down as a `TourDTO`
 * and the page renders that in place of its loader data. Nothing is written until Save.
 *
 * Both sides pin `targetOrigin` to their own origin: the frames are same-origin, so a
 * message crossing an origin boundary means something is wrong and should be dropped.
 */

export const TOUR_DRAFT_MESSAGE = "roam-bengal/tour-draft";
export const PREVIEW_READY_MESSAGE = "roam-bengal/preview-ready";

export interface TourDraftMessage {
  type: typeof TOUR_DRAFT_MESSAGE;
  tour: TourDTO;
}

export interface PreviewReadyMessage {
  type: typeof PREVIEW_READY_MESSAGE;
}

/**
 * Preview-side listener. Returns the latest draft, or null until one arrives.
 *
 * The ready ping matters: the iframe finishes loading long after the editor mounted, so
 * without it the first draft would be whatever change happened to come next.
 */
export function useTourDraft(enabled: boolean): TourDTO | null {
  const [draft, setDraft] = useState<TourDTO | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.parent === window) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as TourDraftMessage | null;
      if (!data || data.type !== TOUR_DRAFT_MESSAGE || !data.tour) return;
      setDraft(data.tour);
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      { type: PREVIEW_READY_MESSAGE } satisfies PreviewReadyMessage,
      window.location.origin,
    );
    return () => window.removeEventListener("message", onMessage);
  }, [enabled]);

  return draft;
}

/** Editor-side send. No-op until the iframe has a document to receive it. */
export function sendTourDraft(frame: HTMLIFrameElement | null, tour: TourDTO): void {
  frame?.contentWindow?.postMessage(
    { type: TOUR_DRAFT_MESSAGE, tour } satisfies TourDraftMessage,
    window.location.origin,
  );
}
