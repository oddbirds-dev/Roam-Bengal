import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { setSidebarCollapsed, useSidebarCollapsed } from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { SETTINGS_ORDER, SETTINGS_SCHEMA } from "@/components/admin/settings-form";
import { supabase } from "@/integrations/supabase/client";
import { whoAmI } from "@/lib/admin.functions";

/**
 * Admin shell: fixed sidebar, top bar, content column.
 *
 * The role check here is cosmetic — it hides UI. Real enforcement is
 * `requireSupabaseAuth` + `assertAdmin` + RLS on every server function.
 */
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const me = await whoAmI();
    if (!me.isAdmin) throw redirect({ to: "/" });
    return { me };
  },
  loader: ({ context }) => context.me,
  component: AdminShell,
});

type NavItem = { label: string; to: string; icon: string };
type NavGroup = { heading: string; items: readonly NavItem[] };

// Grouped so the person using this can tell "things people sent me" apart from "things I
// publish" and "how the website itself reads".
const NAV: readonly NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", to: "/admin", icon: "dashboard" },
      { label: "Inquiries", to: "/admin/inquiries", icon: "inbox" },
    ],
  },
  {
    heading: "Your content",
    items: [
      { label: "Tours", to: "/admin/tours", icon: "map" },
      // No Destinations entry: the table exists but no destination pages ship in v1
      // (PRD §16), so editing them would produce content with nowhere to appear.
      { label: "Activities", to: "/admin/activities", icon: "activity" },
      { label: "Blogs", to: "/admin/posts", icon: "news" },
      { label: "Reviews", to: "/admin/testimonials", icon: "star" },
      { label: "FAQs", to: "/admin/faqs", icon: "help" },
    ],
  },
  {
    heading: "Your website",
    items: [
      { label: "Site content", to: "/admin/settings", icon: "gear" },
      { label: "Links", to: "/admin/links", icon: "search" },
      { label: "SEO", to: "/admin/seo", icon: "external" },
    ],
  },
];

// The sub-nav mirrors the Site content hub, so it reads like the page it links to rather
// than listing raw database keys.
const CONTENT_LINKS = [
  { to: "/admin/settings/homepage-sections", label: "Homepage sections" },
  ...SETTINGS_ORDER.map((key) => ({
    to: `/admin/settings/${key}`,
    label: SETTINGS_SCHEMA[key]?.title ?? key,
  })),
];

function AdminShell() {
  const me = Route.useLoaderData();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  // Desktop-only rail toggle, mirrored via useSidebarCollapsed for pages outside the shell.
  const collapsed = useSidebarCollapsed();

  useEffect(() => setMenuOpen(false), [pathname]);

  function toggleCollapsed() {
    setSidebarCollapsed(!collapsed);
  }

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-[#F6F8F6]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-55 flex-col border-r border-rule bg-paper transition-[transform,width] lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-19" : ""}`}
      >
        <div
          className={`flex h-14 shrink-0 items-center gap-2 border-b border-rule px-5 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <span
            className={`font-display flex-1 text-[1.1rem] font-bold text-ink ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Admin Panel
          </span>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-rule text-ink/70 transition-colors hover:border-green hover:text-green lg:inline-flex"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={collapsed ? "rotate-180" : ""}
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto px-3 py-4 ${collapsed ? "lg:px-2" : ""}`}>
          {NAV.map((group) => (
            <div key={group.heading} className="mb-5 last:mb-0">
              {collapsed ? (
                // A heading can't be read at this width, so the groups are separated by a
                // rule instead — except the first, which already sits against the header.
                <div className="mb-2 border-t border-rule first:hidden" />
              ) : (
                <span className="mb-2 block px-3 text-[0.6rem] font-semibold tracking-[0.18em] text-muted uppercase">
                  {group.heading}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const exact = item.to === "/admin";
                  const active = exact ? pathname === item.to : pathname.startsWith(item.to);
                  const subNav = item.to === "/admin/settings" && active && !collapsed;
                  return (
                    <div key={item.to}>
                      <Link
                        to={item.to}
                        activeOptions={{ exact }}
                        title={collapsed ? item.label : undefined}
                        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors ${
                          active
                            ? "bg-mint font-semibold text-green"
                            : "text-ink/70 hover:bg-mint/60 hover:text-green"
                        } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                      >
                        <AdminIcon name={item.icon} />
                        <span className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                          {item.label}
                        </span>
                        {active && !subNav ? (
                          <AdminIcon
                            name="chevron"
                            className={`h-4 w-4 opacity-70 ${collapsed ? "lg:hidden" : ""}`}
                          />
                        ) : null}
                      </Link>

                      {subNav ? (
                        <div className="mt-0.5 mb-1 ml-5 flex flex-col gap-px border-l border-rule pl-2">
                          {CONTENT_LINKS.map((link) => (
                            <Link
                              key={link.to}
                              to={link.to as never}
                              className={`truncate rounded px-2 py-1 text-[0.78rem] transition-colors hover:bg-mint/60 hover:text-green ${
                                pathname === link.to ? "font-semibold text-green" : "text-ink/70"
                              }`}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-rule px-3 py-3 ${collapsed ? "lg:px-2" : ""}`}>
          <button
            type="button"
            onClick={signOut}
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-ink/70 transition-colors hover:bg-rust/5 hover:text-rust ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <AdminIcon name="signOut" />
            <span className={collapsed ? "lg:hidden" : ""}>Sign out</span>
          </button>
          <p
            className={`mt-2 truncate px-3 text-[0.7rem] text-muted ${
              collapsed ? "lg:hidden" : ""
            }`}
            title={me.email ?? ""}
          >
            {me.email}
          </p>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      ) : null}

      {/* Main column */}
      <div className={`transition-[padding] ${collapsed ? "lg:pl-19" : "lg:pl-55"}`}>
        <header className="flex h-14 items-center justify-between border-b border-rule bg-paper px-5 sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rule text-ink lg:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="ml-auto">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-rule px-4 py-2.5 text-[0.84rem] font-medium text-ink transition-colors hover:border-green hover:text-green"
            >
              <AdminIcon name="external" className="h-4 w-4" />
              View website
            </a>
          </div>
        </header>

        <main id="main" className="px-5 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
