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

const probe = async (label) => {
  const r = await page.evaluate(() => {
    const res = { bodyScrollHeight: document.body.scrollHeight, near: [] };
    const target = document.body.scrollHeight;
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > target - 60 && rect.height > 0) {
        const cs = getComputedStyle(el);
        res.near.push({
          tag: el.tagName,
          cls: String(el.className || "").slice(0, 100),
          pos: cs.position,
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          h: Math.round(rect.height),
        });
      }
    }
    res.near = res.near.slice(0, 10);
    return res;
  });
  console.log(`=== ${label} ===`);
  console.log(JSON.stringify(r, null, 2));
};

// Control: a different editor that uses the same shell but none of the changed fields.
await page.goto("http://localhost:3000/admin/blogs");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
await probe("blogs list");

const blogEdit = page.getByRole("link", { name: "Edit" }).first();
if (await blogEdit.count()) {
  await blogEdit.click();
  await page.waitForTimeout(1500);
  await probe("blog editor (control - no changed fields)");
}

await page.goto("http://localhost:3000/admin/tours");
await page.waitForLoadState("networkidle");
const row = page.locator("tr", { hasText: "Photography" }).first();
await row.getByRole("link", { name: "Edit" }).click();
await page.waitForTimeout(1500);
await probe("tour editor");

await browser.close();
