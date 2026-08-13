import { createDraftChannel } from "@/lib/preview";
import type { TestimonialDTO } from "@/lib/content-types";

/** Live-preview bridge for the testimonial editor. See preview.ts for how this works. */
export const testimonialPreviewChannel = createDraftChannel<TestimonialDTO>("testimonial");
