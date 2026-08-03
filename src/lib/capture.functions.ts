import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "@/integrations/supabase/client";

/**
 * The two public writes.
 *
 * Both insert through the **anon** client, not the service-role client, so the RLS
 * `WITH CHECK` clause is the final authority on shape. BACKEND.md §9 used the service
 * role here; that was only necessary because its Zod schema and its RLS policy disagreed
 * about whether `message` could be null. Ours agree, so the anon path works — and it
 * means the app needs no secret key to accept a lead.
 *
 * Raw Supabase errors are logged server-side and never returned to the caller.
 */

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(120).optional().or(z.literal("")),
  tour_slug: z.string().trim().max(120).optional().or(z.literal("")),
  destination: z.string().trim().max(120).optional().or(z.literal("")),
  start_date: z.string().trim().max(20).optional().or(z.literal("")),
  travelers: z.coerce.number().int().min(1).max(50).optional(),
  budget: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(2000),
});

export type InquiryInput = z.infer<typeof InquirySchema>;

/** Empty strings must become null: Postgres rejects '' for a `date`, and a stored
 *  empty string is worse than an absent value everywhere else. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const submitInquiry = createServerFn({ method: "POST" })
  .validator(InquirySchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { error } = await serverClient()
      .from("inquiries")
      .insert({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: nullIfBlank(data.phone),
        country: nullIfBlank(data.country),
        tour_slug: nullIfBlank(data.tour_slug),
        destination: nullIfBlank(data.destination),
        start_date: nullIfBlank(data.start_date),
        travelers: data.travelers ?? null,
        budget: nullIfBlank(data.budget),
        message: data.message.trim(),
      });

    if (error) {
      console.error("[capture] submitInquiry:", error.message);
      throw new Error("We couldn't submit your inquiry. Please try again.");
    }
    return { ok: true };
  });

const NewsletterSchema = z.object({
  email: z.string().trim().email().max(200),
  source: z.string().trim().max(60).optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator(NewsletterSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { error } = await serverClient()
      .from("newsletter_subscribers")
      .insert({ email: data.email.trim(), source: data.source ?? null });

    // 23505 = unique_violation. Someone re-subscribing is a success from their side;
    // saying "you are already on the list" would leak who is subscribed.
    if (error && error.code !== "23505") {
      console.error("[capture] subscribeNewsletter:", error.message);
      throw new Error("We couldn't sign you up. Please try again.");
    }
    return { ok: true };
  });
