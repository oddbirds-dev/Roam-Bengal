import { createFileRoute, Outlet } from "@tanstack/react-router";
import { adminListSettings } from "@/lib/admin-content.functions";

/**
 * Pure layout: loads every `site_settings` row once so the hub grid, the generic per-group
 * editor, and the homepage-sections builder can all read it via
 * `useLoaderData({ from: "/_authenticated/admin/settings" })` instead of each fetching it
 * again.
 */
export const Route = createFileRoute("/_authenticated/admin/settings")({
  loader: () => adminListSettings(),
  component: () => <Outlet />,
});
