import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv("d:/Coding/Roam Bengal/.env");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

await page.goto("http://localhost:3000/auth");
await page.getByLabel("Email").fill(env.PLAYWRIGHT_TEST_EMAIL);
await page.getByLabel("Password").fill(env.PLAYWRIGHT_TEST_PASSWORD);
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL(/\/admin(?:\/|$)/, { timeout: 15000 });

const probe = () =>
  page.evaluate(() => {
    const walk = (el, depth, out) => {
      for (const child of el.children) {
        const cs = getComputedStyle(child);
        const r = child.getBoundingClientRect();
        if (cs.position !== "absolute" && cs.position !== "fixed" && r.height > 200) {
          out.push({
            depth,
            tag: child.tagName,
            cls: String(child.className || "").slice(0, 90),
            pos: cs.position,
            h: Math.round(r.height),
            overflowY: cs.overflowY,
          });
          if (depth < 6) walk(child, depth + 1, out);
        }
      }
      return out;
    };
    return {
      url: location.pathname,
      bodyScrollHeight: document.body.scrollHeight,
      htmlScrollHeight: document.documentElement.scrollHeight,
      inFlowTall: walk(document.body, 0, []).slice(0, 12),
    };
  });

await page.goto("http://localhost:3000/admin");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);
console.log("=== /admin dashboard ===");
console.log(JSON.stringify(await probe(), null, 2));

await page.goto("http://localhost:3000/admin/tours");
await page.waitForLoadState("networkidle");
const row = page.locator("tr", { hasText: "Photography" }).first();
await row.getByRole("link", { name: "Edit" }).click();
await page.waitForURL(/\/admin\/tours\/.+/, { timeout: 15000 });
await page.waitForTimeout(1500);
console.log("=== tour editor ===");
console.log(JSON.stringify(await probe(), null, 2));

await browser.close();
