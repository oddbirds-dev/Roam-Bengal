-- Per-tour editor section visibility.
--
-- Which sections of the tour editor form this tour shows. Purely an authoring convenience:
-- the public tour page renders from content, not from this list, so hiding a section here
-- never removes anything from the site. Empty (the default) means every section shows,
-- which is exactly the behaviour every existing tour had before this column.

alter table public.tours
  add column if not exists hidden_sections text[] not null default '{}';

comment on column public.tours.hidden_sections is
  'Tour editor sections switched off for this tour. Editor-only; does not affect the public page.';
