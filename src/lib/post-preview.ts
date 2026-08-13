import { createDraftChannel } from "@/lib/preview";
import type { BlogPostDTO } from "@/lib/content-types";

/** Live-preview bridge for the blog post editor. See preview.ts for how this works. */
export const postPreviewChannel = createDraftChannel<BlogPostDTO>("post");
