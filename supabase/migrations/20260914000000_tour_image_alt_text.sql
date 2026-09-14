-- Adds alt-text metadata for tour images: a dedicated column for the hero image, and an
-- `alt` field alongside each gallery image's URL. `images` moves from a plain `text[]` to
-- `jsonb` (an array of `{url, alt}` objects) since a parallel array column would drift out
-- of sync by index whenever a gallery image is reordered or removed.
alter table public.tours
  add column if not exists hero_image_alt text;

alter table public.tours
  alter column images drop default;

alter table public.tours
  alter column images type jsonb using (
    coalesce(
      (select jsonb_agg(jsonb_build_object('url', img, 'alt', '')) from unnest(images) as img),
      '[]'::jsonb
    )
  );

alter table public.tours
  alter column images set default '[]'::jsonb;
