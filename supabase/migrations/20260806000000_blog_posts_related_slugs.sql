-- Curated "related posts" for the blog, mirroring the existing `tours.related_slugs`.
--
-- Before this, /blog/<slug> showed the first three other posts in sort order, with no way
-- for an editor to choose. The admin editor now offers a picker backed by this column.
--
-- Additive and defaulted, so existing rows and every current INSERT stay valid. RLS needs
-- no change: the blog_posts policies are table-level, not column-level.
--
-- This is the first file in supabase/migrations — earlier schema was applied by hand and
-- is described narratively in BACKEND.md. Run this one in the Supabase SQL editor.

alter table public.blog_posts
  add column if not exists related_slugs text[] not null default '{}'::text[];
