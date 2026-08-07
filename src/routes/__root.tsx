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
import { mergeSettings, useSiteSettings } from "@/hooks/use-site-settings";
import { siteDefaults } from "@/content/site-defaults";

export const Route = createRootRoute({
  // Header and footer copy lives in `site_settings`, so every page needs it. Loading it
  // on the root route means it is in the SSR payload before any child renders.
  loader: () => getAllSettings(),
  head: ({ loaderData }) => {
    const meta = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Roam Bengal — Explore The Soul of Bangladesh" },
      {
        name: "description",
        content:
          "Private, locally-guided tours across Bangladesh — the Sundarbans, tea gardens, hill tracts and heritage sites. Fair prices, no shopping detours.",
      },
      { name: "theme-color", content: "#1E5F3B" },
    ];

    // Editable from Admin → Site content → Google tools, no redeploy needed.
    const integrations = mergeSettings(siteDefaults.integrations, loaderData?.integrations);
    if (integrations.google_site_verification) {
      meta.push({
        name: "google-site-verification",
        content: integrations.google_site_verification,
      });
    }

    return {
      meta,
      links: [{ rel: "stylesheet", href: appCss }],
    };
  },
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
  const { custom_fonts, integrations } = useSiteSettings();
  const gtmId = integrations.gtm_container_id;
  const adsenseClientId = integrations.adsense_client_id;

  return (
    <html lang="en">
      <head>
        <HeadContent />
        {custom_fonts?.font_url ? <link rel="stylesheet" href={custom_fonts.font_url} /> : null}
        {custom_fonts?.font_family ? (
          <style dangerouslySetInnerHTML={{ __html: `.font-custom { font-family: ${custom_fonts.font_family}; }` }} />
        ) : null}
        {gtmId ? (
          // GA4 and Google Ads are configured as tags inside the GTM container itself —
          // no separate gtag.js snippets needed once this container is live.
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        ) : null}
        {adsenseClientId ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body>
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <a href="#main" className="sr-only-focusable">
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
