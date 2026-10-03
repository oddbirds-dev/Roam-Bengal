-- Extends every image field across the site with alt text, a meta title, and a free-text
-- meta description (no length cap — enforced only at the Zod layer, same as other
-- "unrestricted" admin copy). Previously only the tours gallery carried alt/title;
-- destinations, blog posts, and testimonials had no per-image metadata at all.

alter table public.tours
  add column if not exists hero_image_title text,
  add column if not exists hero_image_description text;

alter table public.destinations
  add column if not exists image_alt text,
  add column if not exists image_title text,
  add column if not exists image_description text;

alter table public.blog_posts
  add column if not exists cover_image_alt text,
  add column if not exists cover_image_title text,
  add column if not exists cover_image_description text,
  add column if not exists author_avatar_alt text,
  add column if not exists author_avatar_title text,
  add column if not exists author_avatar_description text;

alter table public.testimonials
  add column if not exists avatar_alt text,
  add column if not exists avatar_title text,
  add column if not exists avatar_description text;

-- Testimonials' "extra photos" field moves from a plain `text[]` to `jsonb` (an array of
-- `{url, alt, title, description}` objects), same reasoning as the tours gallery migration:
-- a parallel array column drifts out of sync by index whenever a photo is reordered/removed.
alter table public.testimonials
  alter column images drop default;

create or replace function pg_temp.testimonial_images_to_jsonb(imgs text[])
returns jsonb
language sql
immutable
as $$
  select coalesce(
    (select jsonb_agg(jsonb_build_object('url', img, 'alt', '', 'title', '', 'description', ''))
     from unnest(imgs) as img),
    '[]'::jsonb
  );
$$;

alter table public.testimonials
  alter column images type jsonb using pg_temp.testimonial_images_to_jsonb(images);

alter table public.testimonials
  alter column images set default '[]'::jsonb;
