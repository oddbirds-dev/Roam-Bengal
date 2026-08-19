-- `summary` (the card teaser / meta-description blurb) is retired in favour of
-- `overview[0]` — the tour page's own Trip Overview text — so cards and SEO description
-- no longer need a second, separately-maintained field.
--
-- Existing summary text is not migrated into `overview`: it was written for a different
-- purpose (a short hook) than the overview's long-form opening paragraph, so a mechanical
-- copy would read wrong in the new context and every tour should be reviewed by hand.

alter table public.tours
  drop column if exists summary;
