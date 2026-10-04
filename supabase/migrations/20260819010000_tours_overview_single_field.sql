-- `overview` moves from `jsonb` to a single text field, matching how `blog_posts.body`
-- variants are authored: paragraphs are separated by a blank line and split back apart on
-- render (see `overviewParagraphs` in src/lib/content-types.ts).
--
-- The column has held two shapes over time: an array of paragraphs (the original admin
-- repeater) and a single JSON string of rich-text HTML (the current editor). Strings are
-- unwrapped as-is; arrays are joined with a blank line so every paragraph survives. An
-- earlier version of this file assumed arrays only and failed on string rows.
--
-- Converted in place rather than via add/drop/rename so the column keeps its position, and
-- made nullable with no default, since the admin form saves an empty overview as null.

create or replace function pg_temp.tour_overview_to_text(ov jsonb)
returns text
language sql
immutable
as $$
  select case jsonb_typeof(ov)
    when 'string' then nullif(ov #>> '{}', '')
    when 'array' then nullif(
      (select string_agg(value, e'\n\n' order by ordinality)
       from jsonb_array_elements_text(ov) with ordinality), '')
    else null
  end;
$$;

alter table public.tours alter column overview drop default;
alter table public.tours alter column overview drop not null;
alter table public.tours
  alter column overview type text using pg_temp.tour_overview_to_text(overview);
