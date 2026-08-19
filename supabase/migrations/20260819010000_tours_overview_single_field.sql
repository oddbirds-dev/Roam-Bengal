-- `overview` moves from an array of paragraphs (one admin-repeater row each) to a single
-- text field, matching how `blog_posts.body` variants are authored: paragraphs are
-- separated by a blank line and split back apart on render (see `overviewParagraphs` in
-- src/lib/content-types.ts). This also lets a tour's opening paragraph double as its card
-- teaser and SEO description now that `summary` is gone.
--
-- Existing paragraphs are joined with a blank line rather than dropped, so a tour that had
-- multiple paragraphs (only `sundarbans-wildlife-tour` did, with 3) keeps every paragraph —
-- `overviewParagraphs` splits the blank-line-joined text back into the same paragraphs it
-- started as.

alter table public.tours add column if not exists overview_text text;

update public.tours
set overview_text = (
  select string_agg(value, e'\n\n' order by ordinality)
  from jsonb_array_elements_text(coalesce(overview, '[]'::jsonb)) with ordinality
)
where jsonb_array_length(coalesce(overview, '[]'::jsonb)) > 0;

alter table public.tours drop column if exists overview;
alter table public.tours rename column overview_text to overview;
