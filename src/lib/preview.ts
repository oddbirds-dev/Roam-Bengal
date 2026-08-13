import { useEffect, useState } from "react";

/**
 * Generic version of the postMessage bridge `tour-preview.ts` pioneered for the tour
 * editor's live preview. `tour-preview.ts` is left as-is (its two call sites keep working
 * unchanged); this is what every *other* editor's live preview is built on.
 *
 * Message types are namespaced per `kind` so channels can't cross-talk — a settings draft
 * message and a post draft message look nothing alike on the wire, even if both iframes
 * happen to be open in the same browser tab (nested previews aren't a real scenario, but
 * there's no reason to leave the door open).
 *
 * Both sides pin `targetOrigin` to their own origin: the frames are always same-origin, so
 * a message crossing an origin boundary means something is wrong and should be dropped.
 */
export interface DraftChannel<T> {
  /** Preview-side listener. Returns the latest draft, or null until one arrives. */
  useDraft(enabled: boolean): T | null;
  /** Editor-side send. No-op until the iframe has a document to receive it. */
  sendDraft(frame: HTMLIFrameElement | null, payload: T): void;
  /**
   * Editor-side: resend the current draft when the iframe announces it has mounted and is
   * ready to receive one. The iframe finishes loading long after the editor itself mounted,
   * so without this the first draft the preview would see is whatever change happens next,
   * not the form's current state.
   */
  onReady(callback: () => void): () => void;
}

export function createDraftChannel<T>(kind: string): DraftChannel<T> {
  const DRAFT_TYPE = `roam-bengal/${kind}-draft`;
  const READY_TYPE = `roam-bengal/${kind}-preview-ready`;

  function useDraft(enabled: boolean): T | null {
    const [draft, setDraft] = useState<T | null>(null);

    useEffect(() => {
      if (!enabled || typeof window === "undefined") return;
      if (window.parent === window) return;

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data as { type?: string; payload?: T } | null;
        if (!data || data.type !== DRAFT_TYPE || data.payload === undefined) return;
        setDraft(data.payload);
      };

      window.addEventListener("message", onMessage);
      window.parent.postMessage({ type: READY_TYPE }, window.location.origin);
      return () => window.removeEventListener("message", onMessage);
    }, [enabled]);

    return draft;
  }

  function sendDraft(frame: HTMLIFrameElement | null, payload: T): void {
    frame?.contentWindow?.postMessage({ type: DRAFT_TYPE, payload }, window.location.origin);
  }

  function onReady(callback: () => void): () => void {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type !== READY_TYPE) return;
      callback();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }

  return { useDraft, sendDraft, onReady };
}
