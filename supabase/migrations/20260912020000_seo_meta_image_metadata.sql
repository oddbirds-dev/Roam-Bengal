-- Adds image-level SEO metadata (alt text + dimensions) for social/OG images so
-- crawlers and social platforms get proper og:image:alt/width/height tags instead
-- of a bare image URL. Twitter reuses og_image_alt when its own alt is blank, the
-- same fallback pattern already used for twitter_title/twitter_description.
alter table public.seo_meta
  add column if not exists og_image_alt text,
  add column if not exists og_image_width integer,
  add column if not exists og_image_height integer,
  add column if not exists twitter_image_alt text;
