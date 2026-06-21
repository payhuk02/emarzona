-- Bascule chatbot, blog et image enhancer vers Google AI Studio (Gemini Auto).
-- Utilise les clés google en DB + cascade gemini-2.0/2.5 flash gratuite (ai-gateway.ts).

UPDATE public.platform_settings
SET
  ai_management_settings = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(ai_management_settings, '{}'::jsonb),
                  '{chatbot,provider}',
                  '"google"'::jsonb,
                  true
                ),
                '{chatbot,model}',
                '"google/auto"'::jsonb,
                true
              ),
              '{chatbot,useAiFallback}',
              'true'::jsonb,
              true
            ),
            '{blogGenerator,provider}',
            '"google"'::jsonb,
            true
          ),
          '{blogGenerator,textModel}',
          '"google/auto"'::jsonb,
          true
        ),
        '{blogGenerator,imageModel}',
        '"gemini-2.0-flash-preview-image-generation"'::jsonb,
        true
      ),
      '{imageEnhancer,provider}',
      '"google"'::jsonb,
      true
    ),
    '{imageEnhancer,model}',
    '"gemini-2.0-flash-preview-image-generation"'::jsonb,
    true
  ),
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Rétrocompat : retirer useLovableAIFallback du bloc chatbot si encore présent
UPDATE public.platform_settings
SET ai_management_settings = jsonb_set(
  ai_management_settings,
  '{chatbot}',
  (ai_management_settings->'chatbot') - 'useLovableAIFallback',
  true
)
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND ai_management_settings->'chatbot' ? 'useLovableAIFallback';

COMMENT ON COLUMN public.platform_settings.ai_management_settings IS
  'Configuration IA plateforme (chatbot, contentGenerator, blogGenerator, imageEnhancer, rag). '
  'Prod : chatbot/blog → google/auto (Gemini direct, failover multi-clés).';
