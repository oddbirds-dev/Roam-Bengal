-- Curated blog-post cross-links for a tour ("Blog Suggestions" in the tour editor).
--
-- Mirrors `tours.related_slugs` (tour -> tour) and `blog_posts.related_slugs`
-- (post -> post): an ordered, curated list of slugs, empty by default. The public tour
-- page falls back to the newest posts when this is empty, same pattern as the other two.

alter table public.tours
  add column if not exists related_post_slugs text[] not null default '{}';

comment on column public.tours.related_post_slugs is
  'Curated blog_posts.slug cross-links shown as "From the Blog" on the tour page. Empty falls back to the newest posts.';
