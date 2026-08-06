/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "@/styles/app.css?url";
import { NotFound } from "@/components/not-found";
import { ErrorPage } from "@/components/error-page";
import { getAllSettings } from "@/lib/site-content.functions";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createRootRoute({
  // Header and footer copy lives in `site_settings`, so every page needs it. Loading it
  // on the root route means it is in the SSR payload before any child renders.
  loader: () => getAllSettings(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Roam Bengal — Explore The Soul of Bangladesh" },
      {
        name: "description",
        content:
          "Private, locally-guided tours across Bangladesh — the Sundarbans, tea gardens, hill tracts and heritage sites. Fair prices, no shopping detours.",
      },
      { name: "theme-color", content: "#1E5F3B" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const { custom_fonts } = useSiteSettings();
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {custom_fonts?.font_url ? <link rel="stylesheet" href={custom_fonts.font_url} /> : null}
        {custom_fonts?.font_family ? (
          <style dangerouslySetInnerHTML={{ __html: `.font-custom { font-family: ${custom_fonts.font_family}; }` }} />
        ) : null}
      </head>
      <body>
        <a href="#main" className="sr-only-focusable">
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
