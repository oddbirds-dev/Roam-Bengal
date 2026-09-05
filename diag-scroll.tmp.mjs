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
const shotDir = "C:/Users/alamt/AppData/Local/Temp/claude/d--Coding-Roam-Bengal/19e29e2f-5881-4861-a306-f0bd7e4e250b/scratchpad";

await page.goto("http://localhost:3000/auth");
await page.getByLabel("Email").fill(env.PLAYWRIGHT_TEST_EMAIL);
await page.getByLabel("Password").fill(env.PLAYWRIGHT_TEST_PASSWORD);
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL(/\/admin(?:\/|$)/, { timeout: 15000 });

await page.goto("http://localhost:3000/admin/tours");
await page.waitForLoadState("networkidle");
const row = page.locator("tr", { hasText: "Photography" }).first();
await row.getByRole("link", { name: "Edit" }).click();
await page.waitForURL(/\/admin\/tours\/.+/, { timeout: 15000 });
await page.waitForTimeout(1500);

const metrics = await page.evaluate(() => {
  const out = {
    innerHeight: window.innerHeight,
    bodyScrollHeight: document.body.scrollHeight,
    htmlScrollHeight: document.documentElement.scrollHeight,
    tallest: [],
  };
  const all = document.querySelectorAll("body *");
  const rows = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight + 20) {
      rows.push({
        tag: el.tagName,
        cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || "")).slice(0, 110),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
      });
    }
  }
  rows.sort((a, b) => b.bottom - a.bottom);
  out.tallest = rows.slice(0, 15);
  return out;
});
console.log(JSON.stringify(metrics, null, 2));
await page.screenshot({ path: `${shotDir}/scroll-diag.png`, fullPage: false });
await browser.close();
