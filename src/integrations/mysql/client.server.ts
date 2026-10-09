import { randomUUID } from "node:crypto";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

type Result = {
  data: Record<string, any>[] | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

type Filter = { column: string; value: unknown };
type Mutation = "select" | "insert" | "update" | "delete" | "upsert";

const TABLES = new Set([
  "activities",
  "blog_posts",
  "destinations",
  "faqs",
  "inquiries",
  "newsletter_subscribers",
  "redirects",
  "seo_meta",
  "site_settings",
  "testimonials",
  "tour_activities",
  "tours",
  "users",
  "media",
]);

const JSON_COLUMNS: Record<string, Set<string>> = {
  blog_posts: new Set(["body", "related_slugs"]),
  destinations: new Set(["highlights"]),
  seo_meta: new Set(["extra_keyphrases", "synonyms"]),
  site_settings: new Set(["value"]),
  testimonials: new Set(["images"]),
  tours: new Set([
    "accessibility", "addons", "advice", "exclusions", "facts", "faqs", "glance", "hidden_sections",
    "highlights", "images", "inclusions", "itinerary", "offers", "pledge", "price_tiers", "related_post_slugs",
    "related_slugs", "why_items",
  ]),
};

const BOOLEAN_COLUMNS: Record<string, Set<string>> = {
  blog_posts: new Set(["is_featured", "is_published"]),
  destinations: new Set(["is_published"]),
  faqs: new Set(["is_published"]),
  seo_meta: new Set(["robots_noindex", "cornerstone"]),
  testimonials: new Set(["is_featured", "is_published"]),
  tours: new Set(["is_featured", "is_published"]),
};

let pool: Pool | undefined;

function connectionOptions() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    };
  }
  const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
    throw new Error("Missing DATABASE_URL (or MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE)");
  }
  return {
    host: MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  };
}

export function mysqlPool(): Pool {
  return (pool ??= mysql.createPool({
    ...connectionOptions(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    charset: "utf8mb4",
  }));
}

function identifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `\`${value}\``;
}

function assertTable(table: string): string {
  if (!TABLES.has(table)) throw new Error(`Unknown table: ${table}`);
  return identifier(table);
}

function mapError(error: unknown): { message: string; code?: string } {
  const e = error as { message?: string; code?: string };
  return { message: e?.message ?? "Database operation failed", code: e?.code === "ER_DUP_ENTRY" ? "23505" : e?.code };
}

function decodeRow(table: string, source: Record<string, unknown>): Record<string, unknown> {
  const row = { ...source };
  for (const column of JSON_COLUMNS[table] ?? []) {
    if (typeof row[column] === "string") {
      try { row[column] = JSON.parse(row[column] as string); } catch { /* corrupt legacy JSON remains visible */ }
    }
  }
  for (const column of BOOLEAN_COLUMNS[table] ?? []) {
    if (row[column] !== null && row[column] !== undefined) row[column] = Boolean(row[column]);
  }
  return row;
}

function normalizeValues(table: string, values: Record<string, unknown>, addId: boolean): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [column, value] of Object.entries(values)) {
    if (value === undefined) continue;
    identifier(column);
    output[column] = (JSON_COLUMNS[table]?.has(column) && value !== null && typeof value !== "string")
      ? JSON.stringify(value)
      : value;
  }
  if (addId && table !== "tour_activities" && !output.id) output.id = randomUUID();
  return output;
}

/**
 * Minimal PostgREST-shaped client. Keeping this small compatibility layer lets the route
 * and server-function code retain its proven validation and response behavior while all
 * SQL, auth, and media now run locally against MySQL.
 */
export class Query {
  private filters: Filter[] = [];
  private fields = "*";
  private ordering?: { column: string; ascending: boolean };
  private returnOne = false;
  private countOnly = false;
  private mutation: Mutation = "select";
  private values: Record<string, unknown>[] = [];
  private conflict?: string[];

  constructor(private readonly table: string) { assertTable(table); }

  select(fields = "*", options?: { head?: boolean; count?: "exact" }) {
    this.fields = fields;
    this.countOnly = Boolean(options?.head && options.count === "exact");
    return this;
  }

  eq(column: string, value: unknown) { identifier(column); this.filters.push({ column, value }); return this; }
  order(column: string, options?: { ascending?: boolean }) {
    identifier(column);
    this.ordering = { column, ascending: options?.ascending !== false };
    return this;
  }
  maybeSingle(): any { this.returnOne = true; return this; }
  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.mutation = "insert";
    this.values = (Array.isArray(values) ? values : [values]).map((row) => normalizeValues(this.table, row, true));
    return this;
  }
  update(values: Record<string, unknown>) {
    this.mutation = "update";
    this.values = [normalizeValues(this.table, values, false)];
    return this;
  }
  delete() { this.mutation = "delete"; return this; }
  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }) {
    this.mutation = "upsert";
    this.values = (Array.isArray(values) ? values : [values]).map((row) => normalizeValues(this.table, row, true));
    this.conflict = options?.onConflict?.split(",").map((item) => item.trim());
    return this;
  }

  then<TResult1 = Result, TResult2 = never>(
    fulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(fulfilled, rejected);
  }

  private where(): { sql: string; params: unknown[] } {
    if (!this.filters.length) return { sql: "", params: [] };
    const clauses: string[] = [];
    const params: unknown[] = [];
    for (const { column, value } of this.filters) {
      if (value === null) clauses.push(`${identifier(column)} IS NULL`);
      else { clauses.push(`${identifier(column)} = ?`); params.push(value); }
    }
    return { sql: ` WHERE ${clauses.join(" AND ")}`, params };
  }

  private selectColumns(): string {
    if (this.fields === "*") return "*";
    return this.fields.split(",").map((raw) => identifier(raw.trim())).join(", ");
  }

  private async execute(): Promise<Result> {
    try {
      if (this.mutation === "select") return await this.read();
      return await this.write();
    } catch (error) {
      return { data: null, error: mapError(error), count: null };
    }
  }

  private async read(): Promise<Result> {
    const where = this.where();
    if (this.table === "tour_activities" && this.fields.includes("tours(") && this.fields.includes("activities(")) {
      const [rows] = await mysqlPool().execute<RowDataPacket[]>(
        "SELECT t.slug AS tour_slug, a.slug AS activity_slug FROM tour_activities ta JOIN tours t ON t.id = ta.tour_id JOIN activities a ON a.id = ta.activity_id",
      );
      const data = rows.map((row) => ({ tours: { slug: row.tour_slug }, activities: { slug: row.activity_slug } }));
      return { data: (this.returnOne ? data[0] ?? null : data) as any, error: null, count: data.length };
    }
    if (this.countOnly) {
      const [rows] = await mysqlPool().execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${assertTable(this.table)}${where.sql}`, where.params as any);
      return { data: null, error: null, count: Number(rows[0]?.total ?? 0) };
    }
    const order = this.ordering ? ` ORDER BY ${identifier(this.ordering.column)} ${this.ordering.ascending ? "ASC" : "DESC"}` : "";
    const one = this.returnOne ? " LIMIT 1" : "";
    const [rows] = await mysqlPool().execute<RowDataPacket[]>(`SELECT ${this.selectColumns()} FROM ${assertTable(this.table)}${where.sql}${order}${one}`, where.params as any);
    const data = rows.map((row) => decodeRow(this.table, row));
    return { data: (this.returnOne ? data[0] ?? null : data) as any, error: null, count: data.length };
  }

  private async write(): Promise<Result> {
    const where = this.where();
    if (this.mutation === "delete") {
      await mysqlPool().execute(`DELETE FROM ${assertTable(this.table)}${where.sql}`, where.params as any);
      return { data: null, error: null };
    }
    if (this.mutation === "update") {
      const row = this.values[0] ?? {};
      const entries = Object.entries(row);
      if (!entries.length) return { data: null, error: null };
      const set = entries.map(([key]) => `${identifier(key)} = ?`).join(", ");
      await mysqlPool().execute(`UPDATE ${assertTable(this.table)} SET ${set}${where.sql}`, [...entries.map(([, value]) => value), ...where.params] as any);
      const result = decodeRow(this.table, { ...row, ...Object.fromEntries(this.filters.map((f) => [f.column, f.value])) });
      return { data: (this.returnOne ? result : [result]) as any, error: null };
    }
    for (const row of this.values) {
      const entries = Object.entries(row);
      const columns = entries.map(([key]) => identifier(key)).join(", ");
      const placeholders = entries.map(() => "?").join(", ");
      let sql = `INSERT INTO ${assertTable(this.table)} (${columns}) VALUES (${placeholders})`;
      if (this.mutation === "upsert") {
        const conflict = this.conflict?.length ? this.conflict : this.table === "site_settings" ? ["key"] : this.table === "seo_meta" ? ["entity_type", "entity_id"] : ["id"];
        for (const field of conflict) identifier(field);
        const updates = entries.filter(([key]) => !conflict.includes(key)).map(([key]) => `${identifier(key)} = VALUES(${identifier(key)})`);
        if (updates.length) sql += ` ON DUPLICATE KEY UPDATE ${updates.join(", ")}`;
      }
      await mysqlPool().execute(sql, entries.map(([, value]) => value) as any);
    }
    const data = this.values.map((row) => decodeRow(this.table, row));
    return { data: (this.returnOne ? data[0] ?? null : data) as any, error: null };
  }
}

export interface DbClient { from(table: string): Query; }

export function serverClient(): DbClient {
  return { from: (table: string) => new Query(table) };
}

export async function queryOne<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | null> {
  const [rows] = await mysqlPool().execute<RowDataPacket[]>(sql, params as any);
  return (rows[0] as T | undefined) ?? null;
}

export async function execute(sql: string, params: unknown[] = []) {
  return mysqlPool().execute(sql, params as any);
}
