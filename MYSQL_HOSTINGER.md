# MySQL and Hostinger deployment

This application now uses MySQL 8, local Node.js authentication, and MySQL-backed media.
It has no runtime dependency on Supabase.

## First-time cutover

1. In Hostinger, create a MySQL database and user, then import [`mysql/schema.sql`](mysql/schema.sql) through phpMyAdmin.
2. From a local machine with remote MySQL access enabled, copy `.env.migration.example` to `.env.migration`, add the old Supabase service-role key and the new MySQL connection URL, then run:

   ```sh
   npm run db:migrate-from-supabase
   ```

   The importer copies every content table and every `content-images` file. It rewrites stored Supabase Storage URLs to local `/media/<id>` URLs. It creates the one specified MySQL administrator; existing Supabase password hashes are deliberately not imported.
3. Before deploying, verify the imported site locally with `DATABASE_URL` and `SESSION_SECRET` in `.env`. To create or reset an administrator later, run:

   ```sh
   npm run db:admin -- admin@example.com a-strong-password
   ```
4. After the imported site is live and verified, revoke the Supabase service-role key and close the old project.

## Hostinger Node.js app settings

Create a **Node.js Web App** on a Business or Cloud plan. Select Node **22.x** and use:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Start command | `npm start` |
| Entry file when requested | `server.mjs` |
| Output directory when requested | `dist` |

Set these environment variables in the Hostinger dashboard:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:3306/DATABASE` |
| `SESSION_SECRET` | A random secret of at least 32 characters |
| `VITE_SITE_URL` | Your final `https://` domain |
| `NODE_ENV` | `production` |

Do not add the temporary `SUPABASE_*` migration variables to Hostinger. They are used only while running the local one-time importer.

## Backups

The `media` table contains uploaded image bytes, so a MySQL backup now contains both content and uploaded images. Take a database backup before every schema or bulk-content change.
