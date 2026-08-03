import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Signed-in-only layout.
 *
 * `ssr: false` — the session lives in localStorage, so the server cannot know whether
 * the visitor is authenticated and would flash the wrong shell.
 *
 * This guard is COSMETIC. It hides UI; it is not security. Anyone can call the server
 * function endpoints directly, so the real enforcement is `requireSupabaseAuth` +
 * `assertAdmin` + RLS on every one of them.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
