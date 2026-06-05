-- Seed security_alerts defaults in admin_config (email principal + webhook optionnel)
UPDATE public.admin_config
SET settings = settings || jsonb_build_object(
  'security_alerts', jsonb_build_object(
    'enabled', true,
    'emails', jsonb_build_array('contact@edigit-agence.com'),
    'webhook_url', null
  )
)
WHERE key = 'admin';
