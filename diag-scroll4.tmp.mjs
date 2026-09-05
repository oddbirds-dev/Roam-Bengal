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
await page.goto("http://localhost:3000/admin/tours");
await page.waitForLoadState("networkidle");
const row = page.locator("tr", { hasText: "Photography" }).first();
await row.getByRole("link", { name: "Edit" }).click();
await page.waitForTimeout(1800);

const out = await page.evaluate(() => {
  const form = document.querySelector(".mt-8.flex.flex-col.gap-8.pb-10");
  const chain = [];
  let el = form;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    chain.push({
      tag: el.tagName,
      cls: String(el.className || "").slice(0, 80),
      pos: cs.position,
      overflowY: cs.overflowY,
      styleHeight: cs.height,
      clientH: el.clientHeight,
      scrollH: el.scrollHeight,
      offsetH: el.offsetHeight,
    });
    el = el.parentElement;
  }
  return { bodyScrollHeight: document.body.scrollHeight, chain };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
