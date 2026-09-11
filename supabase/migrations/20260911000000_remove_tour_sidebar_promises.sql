UPDATE public.site_settings
SET value = jsonb_set(value, '{sidebar_promises}', '[]'::jsonb, true)
WHERE key = 'tour_pricing'
  AND jsonb_typeof(value) = 'object';
