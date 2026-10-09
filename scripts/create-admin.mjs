import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 12) {
  throw new Error("Usage: npm run db:admin -- admin@example.com a-strong-password (minimum 12 characters)");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const url = new URL(process.env.DATABASE_URL);
const db = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)),
  charset: "utf8mb4",
});

const passwordHash = await bcrypt.hash(password, 12);
await db.execute(
  "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'admin') ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'",
  [randomUUID(), email.trim().toLowerCase(), passwordHash],
);
await db.end();
console.log(`Admin account ready for ${email.trim().toLowerCase()}`);
