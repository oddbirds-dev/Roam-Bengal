/**
 * Seeds and removes the throwaway accounts the smoke tests sign in as.
 *
 *   node scripts/test-users.mjs seed
 *   node scripts/test-users.mjs teardown
 *
 * Uses the GoTrue Admin API via the service-role key, which is the correct way to create
 * users. Creating them with `INSERT INTO auth.users` requires setting eight token columns
 * to '' by hand — a NULL in any of them breaks password grants for the entire project
 * (PRD §13). The Admin API has no such trap.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from .env. That key bypasses RLS entirely, so it never
 * belongs in application code — only in operator scripts like this one.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const URL_ = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is not set in .env — required to manage test users.",
  );
  process.exit(1);
}

const admin = createClient(URL_, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const TEST_USERS = {
  admin: "authtest-admin@example.com",
  plain: "authtest-plain@example.com",
};
const PASSWORD = "TestPass!2026";

async function findByEmail(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

async function seed() {
  for (const email of Object.values(TEST_USERS)) {
    const existing = await findByEmail(email);
    if (existing) {
      console.log(`exists   ${email}`);
      continue;
    }
    const { error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`${email}: ${error.message}`);
    console.log(`created  ${email}`);
  }

  const adminUser = await findByEmail(TEST_USERS.admin);
  const { error } = await admin
    .from("user_roles")
    .upsert({ user_id: adminUser.id, role: "admin" }, { onConflict: "user_id,role" });
  if (error) throw new Error(`grant admin: ${error.message}`);
  console.log(`granted  admin role to ${TEST_USERS.admin}`);
}

async function teardown() {
  for (const email of Object.values(TEST_USERS)) {
    const user = await findByEmail(email);
    if (!user) {
      console.log(`absent   ${email}`);
      continue;
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`${email}: ${error.message}`);
    console.log(`deleted  ${email}`);
  }

  // The RLS test submits an inquiry as `anon` to prove the public write path works, and
  // anon has no DELETE grant — by design — so it cannot tidy up after itself. Sweep those
  // here, where the service-role key can.
  const { data: rows, error } = await admin
    .from("inquiries")
    .delete()
    .like("email", "smoke%@example.com")
    .select("id");
  if (error) throw new Error(`sweep inquiries: ${error.message}`);
  console.log(`swept    ${rows?.length ?? 0} smoke-test inquir${rows?.length === 1 ? "y" : "ies"}`);
}

const command = process.argv[2];
if (command === "seed") await seed();
else if (command === "teardown") await teardown();
else {
  console.error("usage: node scripts/test-users.mjs seed|teardown");
  process.exit(1);
}
