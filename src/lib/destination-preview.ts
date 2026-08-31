import { createDraftChannel } from "@/lib/preview";
import type { DestinationDTO } from "@/lib/content-types";

/** Live-preview bridge for the destination editor. See preview.ts for how this works. */
export const destinationPreviewChannel = createDraftChannel<DestinationDTO>("destination");
