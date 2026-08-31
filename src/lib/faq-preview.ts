import { createDraftChannel } from "@/lib/preview";
import type { FaqDTO } from "@/lib/content-types";

/** Live-preview bridge for the FAQ editor. See preview.ts for how this works. */
export const faqPreviewChannel = createDraftChannel<FaqDTO>("faq");
