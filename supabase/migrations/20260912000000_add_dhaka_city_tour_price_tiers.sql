-- Add the four group-size cards to the Old & New Dhaka City Tour.
--
-- Prices intentionally remain NULL until the tour manager sets them in
-- Admin -> Tours -> Pricing. The public card will show "On request" while
-- retaining the same editable layout as the other tours.
--
-- Only an empty value is changed, so this is safe to apply after an admin has
-- already configured tiers for this tour.

update public.tours
set price_tiers = jsonb_build_array(
  jsonb_build_object('label', '1', 'persons', 1, 'price', null, 'note', '', 'badge', ''),
  jsonb_build_object('label', '2', 'persons', 2, 'price', null, 'note', '', 'badge', ''),
  jsonb_build_object('label', '3', 'persons', 3, 'price', null, 'note', '', 'badge', ''),
  jsonb_build_object('label', '4', 'persons', 4, 'price', null, 'note', '', 'badge', '')
)
where slug = 'dhaka-city-tour-bangladesh'
  and (price_tiers is null or price_tiers = '[]'::jsonb);
