-- IA Blog plateforme + stockage sécurisé des clés API (chiffrées, jamais exposées au client)

-- Clés API chiffrées (lecture métadonnées via RPC, écriture via edge functions service_role)
CREATE TABLE IF NOT EXISTS public.platform_ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('lovable', 'openai', 'anthropic', 'google', 'custom')),
  label TEXT NOT NULL,
  key_hint TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_ai_api_keys_provider
  ON public.platform_ai_api_keys(provider, is_default DESC);

ALTER TABLE public.platform_ai_api_keys ENABLE ROW LEVEL SECURITY;

-- Aucune policy utilisateur : accès table uniquement service_role (edge functions)
CREATE POLICY platform_ai_api_keys_deny_all
  ON public.platform_ai_api_keys FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER platform_ai_api_keys_updated_at
  BEFORE UPDATE ON public.platform_ai_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Liste masquée pour admins (sans encrypted_key)
CREATE OR REPLACE FUNCTION public.list_platform_ai_api_keys()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_platform_admin() OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', k.id,
          'provider', k.provider,
          'label', k.label,
          'key_hint', k.key_hint,
          'is_default', k.is_default,
          'created_at', k.created_at
        )
        ORDER BY k.is_default DESC, k.created_at DESC
      )
      FROM public.platform_ai_api_keys k
    ),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_platform_ai_api_keys() TO authenticated;

-- Paramètres blogGenerator dans ai_management_settings
UPDATE public.platform_settings
SET ai_management_settings = jsonb_set(
  COALESCE(ai_management_settings, '{}'::jsonb),
  '{blogGenerator}',
  COALESCE(ai_management_settings->'blogGenerator', '{
    "enabled": true,
    "provider": "lovable",
    "textModel": "google/gemini-3.1-pro-preview",
    "imageModel": "google/gemini-3.1-flash-image-preview",
    "systemPrompt": "Tu es le rédacteur en chef du blog Emarzona, plateforme e-commerce multi-boutiques en Afrique de l''Ouest et dans le monde. Tu rédiges des articles premium, experts, structurés en HTML sémantique (h2, h3, p, ul, strong), avec un ton professionnel et accessible. Tu connais les fonctionnalités Emarzona : marketplace, produits digitaux/physiques/services/cours, paiements, affiliation, analytics, IA intégrée.",
    "articlePromptTemplate": "Rédige un article de blog premium pour Emarzona.\n\nSujet : {{topic}}\nBrief : {{brief}}\nTon : {{tone}}\nLangue : {{language}}\nMots-clés cibles : {{keywords}}\n\nExigences :\n- Minimum {{minWords}} mots de contenu utile\n- Structure : introduction accrocheuse, 4-6 sections H2, conclusion avec CTA Emarzona\n- HTML propre (pas de h1, pas de markdown)\n- Intégrer naturellement les mots-clés SEO\n- Proposer un slug URL court en kebab-case\n- 5-8 tags pertinents",
    "imagePromptTemplate": "Premium editorial blog hero image for an e-commerce SaaS article about: {{title}}. Modern, professional, African and global business context, clean composition, no text overlay, photorealistic or high-end 3D illustration, 16:9 aspect ratio, brand colors subtle orange and blue accents.",
    "temperature": 0.75,
    "maxTokens": 8000,
    "minWords": 1200,
    "defaultTone": "premium",
    "defaultLanguage": "fr",
    "generateEnTranslation": true,
    "generateFeaturedImage": true,
    "autoSaveDraft": true,
    "authorName": "Emarzona",
    "authorBio": "Conseils e-commerce et produit pour la communauté Emarzona.",
    "allowCommentsDefault": true
  }'::jsonb),
  true
)
WHERE id = '00000000-0000-0000-0000-000000000001';

COMMENT ON TABLE public.platform_ai_api_keys IS 'Clés API IA chiffrées AES-GCM côté edge functions. Jamais retournées au client.';
