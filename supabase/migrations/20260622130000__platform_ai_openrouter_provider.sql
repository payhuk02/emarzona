-- OpenRouter comme provider IA principal ; retrait de Lovable

ALTER TABLE public.platform_ai_api_keys
  DROP CONSTRAINT IF EXISTS platform_ai_api_keys_provider_check;

ALTER TABLE public.platform_ai_api_keys
  ADD CONSTRAINT platform_ai_api_keys_provider_check
  CHECK (provider IN ('openrouter', 'openai', 'anthropic', 'google', 'custom'));

UPDATE public.platform_ai_api_keys
SET provider = 'openrouter'
WHERE provider = 'lovable';

UPDATE public.platform_settings
SET ai_management_settings = replace(ai_management_settings::text, '"provider":"lovable"', '"provider":"openrouter"')::jsonb
WHERE ai_management_settings::text LIKE '%"provider":"lovable"%';

UPDATE public.platform_settings
SET ai_management_settings = jsonb_set(
  COALESCE(ai_management_settings, '{}'::jsonb),
  '{blogGenerator,provider}',
  '"openrouter"'::jsonb,
  true
)
WHERE COALESCE(ai_management_settings->'blogGenerator'->>'provider', 'lovable') = 'lovable';

UPDATE public.platform_settings
SET ai_management_settings = replace(
  ai_management_settings::text,
  '"useLovableAIFallback"',
  '"useAiFallback"'
)::jsonb
WHERE ai_management_settings::text LIKE '%"useLovableAIFallback"%';
