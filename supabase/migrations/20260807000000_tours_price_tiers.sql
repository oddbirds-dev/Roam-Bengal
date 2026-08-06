-- Per-group-size pricing for the tour page's "Choose Your Perfect Experience" block.
--
-- `price_usd` is a single headline rate, but the tour page now shows a tier per group
-- size (4 pax / 3 pax / 2 pax / solo), each with its own per-person price. Those are
-- editorial numbers, not a formula — a solo supplement is not a fixed multiple of the
-- group rate — so they are stored rather than derived.
--
-- Shape (array, order is display order):
--   [{ "label": "Four Pax Group", "persons": 4, "price": 66,
--      "note": "Per person — best value", "badge": "Best value" }]
--
-- Additive and defaulted, so existing rows and every current INSERT stay valid. RLS needs
-- no change: the tours policies are table-level, not column-level.

alter table public.tours
  add column if not exists price_tiers jsonb not null default '[]'::jsonb;
