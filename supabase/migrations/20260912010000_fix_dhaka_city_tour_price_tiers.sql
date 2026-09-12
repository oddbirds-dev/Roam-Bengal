-- Ensure the group-price cards are added to the existing Old & New Dhaka tour.
-- The production record historically uses the `bandladesh` slug typo; matching
-- by title keeps this update correct if the slug is fixed later.

update public.tours
set price_tiers = jsonb_build_array(
  jsonb_build_object('label', '1', 'persons', 1, 'price', null, 'note', '', 'badge', ''),
  jsonb_build_object('label', '2', 'persons', 2, 'price', null, 'note', '', 'badge', ''),
  jsonb_build_object('label', '3', 'persons', 3, 'price', null, 'note', '', 'badge', ''),
  jsonb_build_object('label', '4', 'persons', 4, 'price', null, 'note', '', 'badge', '')
)
where lower(title) = lower('Old & New Dhaka City Tour')
  and (price_tiers is null or price_tiers = '[]'::jsonb);
