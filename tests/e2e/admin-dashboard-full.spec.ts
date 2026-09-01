/**
 * Admin dashboard — full coverage spec
 *
 * A read-only sweep of every admin section. No test mutates data or needs a special
 * flag; each one navigates, asserts the chrome and controls render, and leaves no
 * persistent side-effects.
 *
 * Sections tested:
 *   1. Dashboard stat cards, status cards, and the Tours card link
 *   2. Inquiries page — filter buttons, empty state, card show/hide + note field
 *   3. Tours list — table columns, status badges, create + public links
 *   4. Destinations list
 *   5. Activities list
 *   6. Blogs list
 *   7. Reviews list
 *   8. FAQs list
 *   9. "View website" header link points at /
 *  10. Site content hub — "Around the site" and "Standalone pages" sections
 *  11. Sidebar settings sub-nav appears on /admin/settings
 *  12. SEO page — every tab renders without crashing
 *  13. SEO drawer with its analysis panels
 *  14. SEO search no-match then clears
 *  15. Every sidebar nav link navigates to its route
 *  16. Admin header consistent across every major route
 *  17. New tour form default values
 *  18. Site-content group editor (tours_page) with live preview
 *  19. Homepage sections editor
 *  20. FAQ new-question form fields
 *  21-23. Dashboard stat-card quick navigation
 */

import { expect, test, type Page } from "@playwright/test";
import { adminCredentials, loginAsAdmin } from "./support/auth";

// ─── helpers ──────────────────────────────────────────────────────────────────

function main(page: Page) {
  return page.locator("main");
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function goto(page: Page, path: string) {
  await page.goto(path);
  if (!path.includes("?")) {
    await expect(page).toHaveURL(new RegExp(`${escapeRegex(path)}/?$`));
  }
}

// ─── session ──────────────────────────────────────────────────────────────────

test.describe("admin access and session", () => {
  test("redirects an unauthenticated visitor away from a protected admin route", async ({
    page,
  }) => {
    await page.goto("/admin/tours");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);
    await expect(page.getByRole("heading", { name: "Staff Sign In" })).toBeVisible();
  });

  test("shows a useful error for invalid admin credentials", async ({ page }) => {
    const { email, password } = adminCredentials();

    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(`${password}-invalid`);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/auth(?:\?|$)/);
    await expect(page.getByRole("alert")).toContainText(/invalid login credentials/i);
  });
});

// ─── everything below is signed-in ────────────────────────────────────────────

test.describe("admin dashboard — comprehensive coverage", () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30_000);
    await loginAsAdmin(page);
  });

  // ── 1. Dashboard cards ────────────────────────────────────────────────────

  test("dashboard shows all stat cards with numeric values and a working Tours link", async ({
    page,
  }) => {
    await goto(page, "/admin");

    await expect(main(page).getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    await expect(
      main(page).getByText("Welcome back! Here’s your content overview.", { exact: true }),
    ).toBeVisible();

    const statLabels = [
      "Inquiries received",
      "Tours",
      "Destinations",
      "Activities",
      "Blog posts",
      "Reviews",
      "FAQs",
    ] as const;

    for (const label of statLabels) {
      const card = main(page)
        .getByRole("link")
        .filter({ hasText: new RegExp(`^${escapeRegex(label)}`) })
        .first();
      await expect(card).toBeVisible();
      expect(await card.textContent()).toMatch(/\d+/);
    }

    await expect(main(page).getByRole("heading", { name: "Draft tours" })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Published tours" })).toBeVisible();
    await expect(main(page).getByText("Not yet visible on the site", { exact: true })).toBeVisible();
    await expect(main(page).getByText("Live and bookable", { exact: true })).toBeVisible();

    await main(page).getByRole("link").filter({ hasText: /^Tours/ }).first().click();
    await expect(page).toHaveURL(/\/admin\/tours$/);
    await expect(main(page).getByRole("heading", { name: "Tours" })).toBeVisible();
  });

  // ── 2. Inquiries ─────────────────────────────────────────────────────────

  test("inquiries page renders its filter buttons and heading", async ({ page }) => {
    await goto(page, "/admin/inquiries");

    await expect(main(page).getByRole("heading", { name: "Inquiries" })).toBeVisible();

    for (const label of [/^All \(\d+\)$/, /^New \(\d+\)$/, /^Read \(\d+\)$/, /^Handled \(\d+\)$/]) {
      await expect(main(page).getByRole("button", { name: label })).toBeVisible();
    }

    await main(page).getByRole("button", { name: /^New \(\d+\)$/ }).click();
    await main(page).getByRole("button", { name: /^Handled \(\d+\)$/ }).click();
    await main(page).getByRole("button", { name: /^All \(\d+\)$/ }).click();

    await expect(main(page).getByRole("heading", { name: "Inquiries" })).toBeVisible();
  });

  test("inquiry card exposes a show/hide details toggle and a note field", async ({ page }) => {
    await goto(page, "/admin/inquiries");

    const showDetails = main(page).getByRole("button", { name: "Show details" }).first();

    if ((await showDetails.count()) === 0) {
      await expect(main(page).getByText("Nothing in this queue.", { exact: true })).toBeVisible();
      return;
    }

    await showDetails.click();
    await expect(main(page).getByLabel("Internal note").first()).toBeVisible();
    await main(page).getByRole("button", { name: "Hide details" }).first().click();
    await expect(main(page).getByRole("button", { name: "Show details" }).first()).toBeVisible();
  });

  // ── 3. Tours list ────────────────────────────────────────────────────────

  test("tours list renders the table columns, create links, and public link", async ({ page }) => {
    await goto(page, "/admin/tours");

    await expect(main(page).getByRole("heading", { name: "Tours" })).toBeVisible();

    for (const col of ["Title", "Destination", "Days", "From", "Status"]) {
      await expect(main(page).getByRole("columnheader", { name: col })).toBeVisible();
    }

    await expect(main(page).getByRole("link", { name: "+ Single day" })).toBeVisible();
    await expect(main(page).getByRole("link", { name: "+ Multi-day" })).toBeVisible();
    await expect(main(page).getByRole("link", { name: "View public tours page" })).toBeVisible();

    const rows = main(page)
      .getByRole("row")
      .filter({ has: page.getByRole("link", { name: "Edit" }) });
    if ((await rows.count()) > 0) {
      expect(await rows.first().textContent()).toMatch(/Published|Draft/);
    }
  });

  // ── 4-8. Simple content lists ────────────────────────────────────────────

  const lists = [
    { path: "/admin/destinations", heading: "Destinations", add: "New destination", link: "View destinations on the homepage" },
    { path: "/admin/activities", heading: "Activities", add: "New activity", link: "View activities on the tours page" },
    { path: "/admin/blogs", heading: "Blogs", add: "New post", link: "View public blog page" },
    { path: "/admin/reviews", heading: "Reviews", add: "Add review", link: "View public reviews page" },
    { path: "/admin/faqs", heading: "FAQs", add: "New question", link: "View public FAQs page" },
  ] as const;

  for (const section of lists) {
    test(`${section.heading.toLowerCase()} list loads with heading, add control, and public link`, async ({
      page,
    }) => {
      await goto(page, section.path);
      await expect(main(page).getByRole("heading", { name: section.heading })).toBeVisible();
      await expect(main(page).getByRole("link", { name: section.link })).toBeVisible();

      const addButton = main(page).getByRole("button", { name: section.add });
      const addLink = main(page).getByRole("link", { name: section.add });
      await expect((await addButton.count()) ? addButton : addLink).toBeVisible();
    });
  }

  // ── 9. Header "View website" ─────────────────────────────────────────────

  test('the "View website" header link points at /', async ({ page }) => {
    await goto(page, "/admin");
    const viewSite = page.getByRole("link", { name: "View website" });
    await expect(viewSite).toBeVisible();
    expect(await viewSite.getAttribute("href")).toBe("/");
  });

  // ── 10. Site content hub ────────────────────────────────────────────────

  test("site content hub shows its sections and a grid of editor cards", async ({ page }) => {
    await goto(page, "/admin/settings");
    await expect(main(page).getByRole("heading", { name: "Site content", level: 1 })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Around the site", level: 2 })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Standalone pages", level: 2 })).toBeVisible();
    await expect(main(page).getByRole("link", { name: /Homepage sections/i })).toBeVisible();

    const cards = main(page).locator("a").filter({ has: page.getByText("Edit", { exact: true }) });
    expect(await cards.count()).toBeGreaterThan(10);
  });

  // ── 11. Sidebar sub-nav ─────────────────────────────────────────────────

  test("sidebar shows the settings sub-nav links when on the settings section", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, "/admin/settings");
    await expect(
      page.locator("aside").getByRole("link", { name: /Homepage sections/i }),
    ).toBeVisible();
  });

  // ── 12. SEO tabs ───────────────────────────────────────────────────────

  test("SEO page renders the Pages tab and every other tab without crashing", async ({ page }) => {
    await goto(page, "/admin/seo");
    await expect(main(page).getByRole("heading", { name: "SEO", level: 1 })).toBeVisible();
    await expect(main(page).getByText("Missing meta description", { exact: true })).toBeVisible();
    expect(await page.locator("tbody tr").count()).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Redirects", exact: true }).click();
    await expect(page.getByRole("button", { name: "+ New redirect" })).toBeVisible();

    await page.getByRole("button", { name: "Orphans", exact: true }).click();
    await expect(page.getByText(/no other post links to/i)).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByRole("button", { name: "Robots.txt", exact: true }).click();
    await expect(page.locator("textarea")).toBeVisible();

    await page.getByRole("button", { name: "Sitemap", exact: true }).click();
    await expect(page.getByRole("link", { name: "/sitemap.xml" })).toHaveAttribute(
      "href",
      "/sitemap.xml",
    );
    await expect(page.getByText(/Currently tracked dynamic pages:/i)).toBeVisible();
  });

  // ── 13. SEO drawer ─────────────────────────────────────────────────────

  test("SEO drawer opens with its analysis panels for the first row", async ({ page }) => {
    await goto(page, "/admin/seo");

    const rows = page
      .locator("tbody tr")
      .filter({ has: page.getByRole("button", { name: "Edit" }) });
    await expect(rows.first()).toBeVisible();
    const title = (await rows.first().locator("td").first().textContent())!.trim();

    await rows.first().getByRole("button", { name: "Edit" }).click();
    const drawer = page.locator(".fixed.inset-0");
    await expect(drawer.getByRole("heading", { name: title, level: 2 })).toBeVisible();

    await expect(drawer.getByText("Google preview", { exact: true })).toBeVisible();
    await expect(drawer.getByText("Keyphrase checks", { exact: true })).toBeVisible();
    await expect(drawer.getByText("Readability checks", { exact: true })).toBeVisible();
    await expect(drawer.getByLabel("Focus keyphrase", { exact: true })).toBeVisible();

    await drawer.getByRole("button", { name: "Close", exact: true }).click();
    await expect(drawer).toBeHidden();
  });

  // ── 14. SEO search ─────────────────────────────────────────────────────

  test("SEO page search shows a no-match state, then recovers when cleared", async ({ page }) => {
    await goto(page, "/admin/seo");

    const search = page.getByPlaceholder(/Search by title or path/i);
    await search.fill(`no-match-${Date.now()}`);
    await expect(page.getByText("Nothing here yet.", { exact: true })).toBeVisible();

    await search.fill("");
    await expect(
      page.locator("tbody tr").filter({ has: page.getByRole("button", { name: "Edit" }) }).first(),
    ).toBeVisible();
  });

  // ── 15. Sidebar navigation ─────────────────────────────────────────────

  test("every sidebar nav link navigates to its correct route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, "/admin");

    const navItems: { name: string; url: RegExp }[] = [
      { name: "Dashboard", url: /\/admin\/?$/ },
      { name: "Inquiries", url: /\/admin\/inquiries/ },
      { name: "Tours", url: /\/admin\/tours/ },
      { name: "Destinations", url: /\/admin\/destinations/ },
      { name: "Activities", url: /\/admin\/activities/ },
      { name: "Blogs", url: /\/admin\/blogs/ },
      { name: "Reviews", url: /\/admin\/reviews/ },
      { name: "FAQs", url: /\/admin\/faqs/ },
      { name: "Site content", url: /\/admin\/settings/ },
      { name: "SEO", url: /\/admin\/seo/ },
      { name: "Links", url: /\/admin\/links/ },
    ];

    const sidebar = page.locator("aside");
    for (const item of navItems) {
      await sidebar.getByRole("link", { name: item.name, exact: true }).first().click();
      await expect(page).toHaveURL(item.url);
      await expect(page.getByRole("link", { name: "View website" })).toBeVisible();
    }
  });

  // ── 16. Header consistency ─────────────────────────────────────────────

  test('the admin header "View website" link is present on every major route', async ({ page }) => {
    const routes = [
      "/admin",
      "/admin/inquiries",
      "/admin/tours",
      "/admin/destinations",
      "/admin/activities",
      "/admin/blogs",
      "/admin/reviews",
      "/admin/faqs",
      "/admin/settings",
      "/admin/seo",
      "/admin/links",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(
        page.getByRole("link", { name: "View website" }),
        `"View website" missing on ${route}`,
      ).toBeVisible();
    }
  });

  // ── 17. New tour form ─────────────────────────────────────────────────

  test("new tour form opens with the expected default field values", async ({ page }) => {
    await page.goto("/admin/tours/new?category=multi-day");
    await expect(main(page).getByRole("heading", { name: "New tour" })).toBeVisible();

    await expect(main(page).getByLabel("Category")).toHaveValue("multi-day");
    await expect(main(page).getByLabel("Duration (days)")).toHaveValue("1");
    await expect(main(page).getByRole("checkbox", { name: /^Published/ })).not.toBeChecked();

    await expect(main(page).getByRole("button", { name: "Discard" })).toBeVisible();
    await expect(main(page).getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  // ── 18. Group editor ─────────────────────────────────────────────────

  test("the tours_page content editor loads with a live preview and save controls", async ({
    page,
  }) => {
    await goto(page, "/admin/settings/tours_page");
    await expect(page.getByRole("heading", { name: "Tours page", level: 1 })).toBeVisible();

    const frame = page.getByTitle("Preview");
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute("src", /\/tours\?preview=1$/);

    await expect(page.getByText("Everything is saved", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Discard" })).toBeDisabled();
  });

  // ── 19. Homepage sections editor ─────────────────────────────────────

  test("homepage sections editor loads with visibility switches present", async ({ page }) => {
    await goto(page, "/admin/settings/homepage-sections");
    await expect(page.getByRole("heading", { name: "Homepage sections", level: 1 })).toBeVisible();

    const switches = page.getByRole("switch", { name: /^(Show|Hide) / });
    await expect(switches.first()).toBeVisible();
    expect(await switches.count()).toBeGreaterThan(5);

    await expect(
      page.getByRole("button", { name: "Edit", exact: true }).first(),
    ).toHaveAttribute("aria-expanded", "false");
  });

  // ── 20. FAQ new-question form ───────────────────────────────────────

  test("the new question form has question, answer, and group fields plus action buttons", async ({
    page,
  }) => {
    await goto(page, "/admin/faqs");
    await main(page).getByRole("button", { name: "New question" }).click();
    await expect(main(page).getByRole("heading", { name: "New question" })).toBeVisible();

    for (const label of [/^Question/, /^Answer/, /^Group/]) {
      await expect(main(page).locator("label").filter({ hasText: label }).first()).toBeVisible();
    }

    await expect(main(page).getByRole("button", { name: "Discard" })).toBeVisible();
    await expect(main(page).getByRole("button", { name: "Save changes" })).toBeVisible();
    await expect(
      main(page).getByRole("button", { name: /Hide preview|Show preview/ }),
    ).toBeVisible();
  });

  // ── 21-23. Dashboard quick navigation ──────────────────────────────

  const quickLinks = [
    { label: /Inquiries received/, url: /\/admin\/inquiries$/, heading: "Inquiries" },
    { label: /Destinations/, url: /\/admin\/destinations$/, heading: "Destinations" },
    { label: /Blog posts/, url: /\/admin\/blogs$/, heading: "Blogs" },
  ] as const;

  for (const quick of quickLinks) {
    test(`dashboard card "${quick.heading}" navigates to its page`, async ({ page }) => {
      await goto(page, "/admin");
      await main(page).getByRole("link", { name: quick.label }).first().click();
      await expect(page).toHaveURL(quick.url);
      await expect(main(page).getByRole("heading", { name: quick.heading })).toBeVisible();
    });
  }
});
