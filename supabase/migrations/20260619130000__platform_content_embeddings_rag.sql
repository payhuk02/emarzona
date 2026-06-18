-- RAG profond plateforme : pgvector + content_embeddings + recherche sémantique

-- ---------------------------------------------------------------------------
-- Extension pgvector
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Extension vector : privilèges insuffisants — activer via le dashboard Supabase';
  WHEN OTHERS THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS vector;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Extension vector non disponible: %', SQLERRM;
    END;
END $$;

-- ---------------------------------------------------------------------------
-- Table des morceaux vectorisés (blog, FAQ, produits)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL
    CHECK (source_type IN ('blog', 'faq', 'product')),
  source_id UUID NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr',
  chunk_index INTEGER NOT NULL DEFAULT 0 CHECK (chunk_index >= 0),
  chunk_text TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding extensions.vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_embeddings_source_chunk_unique
    UNIQUE (source_type, source_id, locale, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_source
  ON public.content_embeddings (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_locale
  ON public.content_embeddings (locale);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_source_type_locale
  ON public.content_embeddings (source_type, locale);

-- Index HNSW — similarité cosinus (recherche rapide)
CREATE INDEX IF NOT EXISTS idx_content_embeddings_hnsw_cosine
  ON public.content_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TRIGGER content_embeddings_updated_at
  BEFORE UPDATE ON public.content_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.content_embeddings IS
  'Morceaux de contenu plateforme (blog, FAQ, produits) avec vecteurs sémantiques 1536D pour RAG.';

-- ---------------------------------------------------------------------------
-- Recherche par similarité cosinus
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_platform_content(
  query_embedding extensions.vector(1536),
  match_threshold DOUBLE PRECISION DEFAULT 0.55,
  match_count INTEGER DEFAULT 8,
  filter_locale TEXT DEFAULT NULL,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  locale TEXT,
  chunk_index INTEGER,
  chunk_text TEXT,
  metadata JSONB,
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    ce.id,
    ce.source_type,
    ce.source_id,
    ce.locale,
    ce.chunk_index,
    ce.chunk_text,
    ce.metadata,
    (1 - (ce.embedding OPERATOR(extensions.<=>) query_embedding))::DOUBLE PRECISION AS similarity
  FROM public.content_embeddings ce
  WHERE
  (filter_locale IS NULL OR ce.locale = filter_locale)
  AND (
    filter_source_types IS NULL
    OR cardinality(filter_source_types) = 0
    OR ce.source_type = ANY(filter_source_types)
  )
  AND (1 - (ce.embedding <=> query_embedding)) >= match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(COALESCE(match_count, 8), 25));
$$;

COMMENT ON FUNCTION public.match_platform_content IS
  'Retrouve les morceaux de contenu plateforme les plus pertinents pour un vecteur de requête (cosinus).';

GRANT EXECUTE ON FUNCTION public.match_platform_content(
  extensions.vector(1536),
  DOUBLE PRECISION,
  INTEGER,
  TEXT,
  TEXT[]
) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS : lecture connectés, écriture admin plateforme (+ service_role bypass)
-- ---------------------------------------------------------------------------
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_embeddings_authenticated_select ON public.content_embeddings;
CREATE POLICY content_embeddings_authenticated_select
  ON public.content_embeddings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS content_embeddings_admin_all ON public.content_embeddings;
CREATE POLICY content_embeddings_admin_all
  ON public.content_embeddings
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Paramètres RAG par défaut dans ai_management_settings
-- ---------------------------------------------------------------------------
UPDATE public.platform_settings
SET ai_management_settings = jsonb_set(
  COALESCE(ai_management_settings, '{}'::jsonb),
  '{rag}',
  COALESCE(ai_management_settings->'rag', '{
    "enabled": true,
    "embeddingModel": "openai/text-embedding-3-small",
    "matchCount": 8,
    "matchThreshold": 0.55,
    "sourceTypes": ["blog", "faq", "product"]
  }'::jsonb),
  true
)
WHERE id IS NOT NULL;
