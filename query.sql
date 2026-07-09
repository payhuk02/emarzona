SELECT key, updated_at, jsonb_object_keys(value) as value_keys, jsonb_object_keys(settings) as settings_keys FROM public.platform_settings WHERE key = 'customization';
