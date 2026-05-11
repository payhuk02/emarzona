-- Add ai_management_settings column to platform_settings
ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS ai_management_settings JSONB DEFAULT '{
  "chatbot": {
    "enabled": true,
    "useLovableAIFallback": false,
    "model": "google/gemini-3-flash-preview",
    "systemPrompt": "Tu es l''assistant IA d''Emarzona, plateforme e-commerce multi-boutiques en Afrique de l''Ouest. Réponds en français de façon concise et professionnelle. Aide sur commandes, livraison, retours, produits et boutiques.",
    "temperature": 0.7,
    "maxTokens": 800,
    "language": "fr"
  },
  "contentGenerator": {
    "enabled": true,
    "provider": "lovable",
    "model": "google/gemini-3-flash-preview",
    "systemPrompt": "Tu es un expert en rédaction e-commerce SEO. Tu réponds toujours avec du JSON valide.",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "imageEnhancer": {
    "enabled": true,
    "model": "google/gemini-3.1-flash-image-preview",
    "defaultInstruction": "Improve this image for a premium e-commerce listing: enhance lighting, contrast, sharpness, balance colors, remove visual noise. Keep the subject 100% identical."
  },
  "recommendations": {
    "enabled": true,
    "configRef": "ai_recommendation_settings"
  }
}'::jsonb;

COMMENT ON COLUMN public.platform_settings.ai_management_settings IS 'Configuration centralisée de tous les systèmes AI (chatbot, génération contenu, image, recommandations).';

-- Ensure default row has the column populated
UPDATE public.platform_settings
SET ai_management_settings = COALESCE(ai_management_settings, '{
  "chatbot": {"enabled": true, "useLovableAIFallback": false, "model": "google/gemini-3-flash-preview", "systemPrompt": "Tu es l''assistant IA d''Emarzona.", "temperature": 0.7, "maxTokens": 800, "language": "fr"},
  "contentGenerator": {"enabled": true, "provider": "lovable", "model": "google/gemini-3-flash-preview", "systemPrompt": "Tu es un expert en rédaction e-commerce SEO.", "temperature": 0.7, "maxTokens": 2000},
  "imageEnhancer": {"enabled": true, "model": "google/gemini-3.1-flash-image-preview", "defaultInstruction": "Improve this image for premium e-commerce."},
  "recommendations": {"enabled": true, "configRef": "ai_recommendation_settings"}
}'::jsonb)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- RPC: get the ai management settings (anyone can read - non-sensitive)
CREATE OR REPLACE FUNCTION public.get_ai_management_settings()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ai_management_settings
  FROM public.platform_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';
$$;

-- RPC: update settings (admin only)
CREATE OR REPLACE FUNCTION public.update_ai_management_settings(_settings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin BOOLEAN;
BEGIN
  -- Check admin role using existing has_role function
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO _is_admin;
  IF NOT COALESCE(_is_admin, false) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  UPDATE public.platform_settings
  SET ai_management_settings = _settings,
      updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RETURN _settings;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_management_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_ai_management_settings(JSONB) TO authenticated;