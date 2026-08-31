import { createServerFn } from "@tanstack/react-start";
import {
  assertAdmin,
  isAdmin,
  requireSupabaseAuth,
} from "@/integrations/supabase/auth-middleware";

/**
 * Identity and dashboard functions.
 *
 * `whoAmI` requires a valid session but NOT the admin role — it is what the route guard
 * calls to decide whether to show the admin area at all. Everything else asserts admin
 * as its first statement.
 */

export interface WhoAmI {
  userId: string;
  email: string | null;
  isAdmin: boolean;
}

export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WhoAmI> => {
    return {
      userId: context.userId,
      email: context.email,
      isAdmin: await isAdmin(context),
    };
  });

export interface AdminStats {
  tours: number;
  publishedTours: number;
  posts: number;
  testimonials: number;
  faqs: number;
  activities: number;
  destinations: number;
  inquiries: number;
  newInquiries: number;
  subscribers: number;
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    await assertAdmin(context);
    const sb = context.supabase;

    // `head: true` fetches counts without row payloads.
    const count = (table: string, apply?: (q: never) => never) => {
      const q = sb.from(table as never).select("*", { head: true, count: "exact" });
      return apply ? apply(q as never) : q;
    };

    const [
      tours,
      publishedTours,
      posts,
      testimonials,
      faqs,
      activities,
      destinations,
      inquiries,
      newInquiries,
      subscribers,
    ] = await Promise.all([
      count("tours"),
      sb.from("tours").select("*", { head: true, count: "exact" }).eq("is_published", true),
      count("blog_posts"),
      count("testimonials"),
      count("faqs"),
      count("activities"),
      count("destinations"),
      count("inquiries"),
      sb.from("inquiries").select("*", { head: true, count: "exact" }).eq("status", "new"),
      count("newsletter_subscribers"),
    ]);

    return {
      tours: tours.count ?? 0,
      publishedTours: publishedTours.count ?? 0,
      posts: posts.count ?? 0,
      testimonials: testimonials.count ?? 0,
      faqs: faqs.count ?? 0,
      activities: activities.count ?? 0,
      destinations: destinations.count ?? 0,
      inquiries: inquiries.count ?? 0,
      newInquiries: newInquiries.count ?? 0,
      subscribers: subscribers.count ?? 0,
    };
  });
