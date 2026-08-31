import { createDraftChannel } from "@/lib/preview";
import type { ActivityDTO } from "@/lib/content-types";

/** Live-preview bridge for the activity editor. See preview.ts for how this works. */
export const activityPreviewChannel = createDraftChannel<ActivityDTO>("activity");
