/*
 * One-time cutover tool. It reads only the current project's Supabase REST and Storage
 * APIs, writes equivalent rows and binary media to MySQL, then exits. Do not place its
 * temporary SUPABASE_* variables in the production Hostinger environment.
 */
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MIGRATION_ADMIN_EMAIL", "MIGRATION_ADMIN_PASSWORD"];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key} in .env.migration`);
if (!process.env.DATABASE_URL && (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE)) {
  throw new Error("Set DATABASE_URL, or MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE in .env.migration");
}
if (process.env.MIGRATION_ADMIN_PASSWORD.length < 10) throw new Error("MIGRATION_ADMIN_PASSWORD must be at least 10 characters");

const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const tables = [
  "activities", "destinations", "tours", "tour_activities", "blog_posts", "testimonials", "faqs",
  "site_settings", "seo_meta", "redirects", "inquiries", "newsletter_subscribers",
];
const jsonColumns = {
  blog_posts: new Set(["body", "related_slugs"]), destinations: new Set(["highlights"]),
  seo_meta: new Set(["extra_keyphrases", "synonyms"]), site_settings: new Set(["value"]),
  testimonials: new Set(["images"]),
  tours: new Set(["accessibility", "addons", "advice", "exclusions", "facts", "faqs", "glance", "hidden_sections", "highlights", "images", "inclusions", "itinerary", "offers", "pledge", "price_tiers", "related_post_slugs", "related_slugs", "why_items"]),
};

const db = await mysql.createConnection(process.env.DATABASE_URL
  ? (() => {
      const url = new URL(process.env.DATABASE_URL);
      return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)), charset: "utf8mb4" };
    })()
  : { host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306), user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE, charset: "utf8mb4" },
);

async function getAll(table) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*&offset=${offset}&limit=1000`, { headers: { ...authHeaders, Range: `${offset}-${offset + 999}` } });
    if (!response.ok) throw new Error(`Could not export ${table}: ${response.status} ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

function mysqlDate(value) {
  if (typeof value !== "string" || !/\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
}

function rewriteUrls(value, mediaUrls) {
  if (typeof value === "string") return mediaUrls.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => rewriteUrls(item, mediaUrls));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteUrls(item, mediaUrls)]));
  return value;
}

async function listObjects(prefix = "") {
  const response = await fetch(`${baseUrl}/storage/v1/object/list/content-images`, {
    method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  if (!response.ok) throw new Error(`Could not list Supabase Storage: ${response.status} ${await response.text()}`);
  const entries = await response.json();
  const files = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) files.push(path);
    else files.push(...await listObjects(path));
  }
  return files;
}

async function migrateMedia() {
  const urls = new Map();
  const files = await listObjects();
  for (const path of files) {
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${baseUrl}/storage/v1/object/content-images/${encoded}`, { headers: authHeaders });
    if (!response.ok) throw new Error(`Could not download ${path}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) throw new Error(`${path} exceeds the 8 MB MySQL-media limit`);
    const id = randomUUID();
    const type = response.headers.get("content-type")?.split(";", 1)[0] || "application/octet-stream";
    await db.execute("INSERT INTO media (id, filename, content_type, bytes) VALUES (?, ?, ?, ?)", [id, path.slice(-255), type, bytes]);
    urls.set(`${baseUrl}/storage/v1/object/public/content-images/${encoded}`, `/media/${id}`);
    urls.set(`${baseUrl}/storage/v1/object/content-images/${encoded}`, `/media/${id}`);
  }
  console.log(`Migrated ${files.length} media file(s)`);
  return urls;
}

async function insertRows(table, rows, mediaUrls) {
  for (const original of rows) {
    const row = rewriteUrls(original, mediaUrls);
    const entries = Object.entries(row).map(([column, value]) => [column, jsonColumns[table]?.has(column) && value !== null ? JSON.stringify(value) : mysqlDate(value)]);
    if (!entries.length) continue;
    const columns = entries.map(([column]) => `\`${column}\``).join(", ");
    const marks = entries.map(() => "?").join(", ");
    const updates = entries.filter(([column]) => column !== "id").map(([column]) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
    await db.execute(`INSERT INTO \`${table}\` (${columns}) VALUES (${marks}) ON DUPLICATE KEY UPDATE ${updates}`, entries.map(([, value]) => value));
  }
  console.log(`Migrated ${rows.length} ${table} row(s)`);
}

try {
  const mediaUrls = await migrateMedia();
  for (const table of tables) await insertRows(table, await getAll(table), mediaUrls);
  const email = process.env.MIGRATION_ADMIN_EMAIL.trim().toLowerCase();
  const hash = await bcrypt.hash(process.env.MIGRATION_ADMIN_PASSWORD, 12);
  await db.execute("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'admin') ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'", [randomUUID(), email, hash]);
  console.log(`Migration complete. Sign in with ${email}; Supabase passwords are intentionally not copied.`);
} finally {
  await db.end();
}
