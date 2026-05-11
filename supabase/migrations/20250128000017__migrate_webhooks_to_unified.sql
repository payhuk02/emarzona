-- ============================================================================
-- MIGRATION: Migration des Webhooks vers le Système Unifié
-- Date: 2025-01-28
-- Author: Emarzona Team
-- Description: Migre les webhooks des systèmes fragmentés vers le système unifié
-- ============================================================================

-- ============================================================================
-- 1. MIGRATION DES WEBHOOKS PRODUITS DIGITAUX
-- ============================================================================

-- Créer une fonction helper pour convertir ENUM[] vers TEXT[]
-- Cette fonction sera utilisée dans USING pour éviter les sous-requêtes
CREATE OR REPLACE FUNCTION public.convert_enum_array_to_text_array(enum_array anyarray)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT[];
BEGIN
  SELECT array_agg(elem::TEXT) INTO result
  FROM unnest(enum_array) AS elem;
  
  RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$;

-- Convertir FORCÉMENT la colonne events de ENUM[] vers TEXT[] si nécessaire
-- Cette conversion DOIT réussir avant les insertions
DO $$
DECLARE
  is_enum_array BOOLEAN := false;
BEGIN
  -- Vérifier si la colonne events existe et est de type ENUM array
  SELECT EXISTS (
    SELECT 1 
    FROM pg_attribute a
    JOIN pg_type t ON a.atttypid = t.oid
    JOIN pg_type e ON t.typelem = e.oid
    WHERE a.attrelid = 'public.webhooks'::regclass
      AND a.attname = 'events'
      AND e.typtype = 'e'  -- 'e' = enum type
  ) INTO is_enum_array;
  
  IF is_enum_array THEN
    -- Convertir ENUM[] vers TEXT[] - FORCER la conversion
    -- Utiliser la fonction helper pour éviter les sous-requêtes dans USING
    ALTER TABLE public.webhooks 
    ALTER COLUMN events TYPE TEXT[] 
    USING public.convert_enum_array_to_text_array(events);
    
    RAISE NOTICE 'Converted events column from ENUM[] to TEXT[]';
  ELSE
    RAISE NOTICE 'Events column is already TEXT[] or does not exist';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to convert events column: %. Please convert manually before running this migration.', SQLERRM;
END $$;

INSERT INTO public.webhooks (
  store_id,
  created_by,
  name,
  description,
  url,
  secret,
  events,
  status,
  retry_count,
  timeout_seconds,
  rate_limit_per_minute,
  custom_headers,
  verify_ssl,
  include_payload,
  metadata,
  created_at,
  updated_at
)
SELECT 
  store_id,
  created_by,
  COALESCE(name, 'Digital Product Webhook'),
  description,
  url,
  secret_key as secret,
  -- events est maintenant TEXT[] après la conversion ci-dessus
  -- digital_product_webhooks.events est déjà TEXT[]
  COALESCE(digital_product_webhooks.events, ARRAY[]::TEXT[])::TEXT[] as events,
  CASE 
    WHEN is_active THEN 'active'::webhook_status 
    ELSE 'inactive'::webhook_status 
  END as status,
  COALESCE(retry_count, 3) as retry_count,
  COALESCE(timeout_seconds, 30) as timeout_seconds,
  60 as rate_limit_per_minute, -- Valeur par défaut
  COALESCE(headers, '{}'::jsonb) as custom_headers,
  TRUE as verify_ssl,
  TRUE as include_payload,
  jsonb_build_object(
    'source', 'digital_product_webhooks',
    'original_id', digital_product_webhooks.id::TEXT
  ) || COALESCE(metadata, '{}'::jsonb) as metadata,
  created_at,
  updated_at
FROM digital_product_webhooks
WHERE NOT EXISTS (
  -- Éviter les doublons basés sur store_id + url + original_id dans metadata
  SELECT 1 FROM public.webhooks w
  WHERE w.store_id = digital_product_webhooks.store_id
    AND w.url = digital_product_webhooks.url
    AND w.metadata->>'source' = 'digital_product_webhooks'
    AND w.metadata->>'original_id' = digital_product_webhooks.id::TEXT
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. MIGRATION DES WEBHOOKS PRODUITS PHYSIQUES
-- ============================================================================

INSERT INTO public.webhooks (
  store_id,
  created_by,
  name,
  description,
  url,
  secret,
  events,
  status,
  retry_count,
  timeout_seconds,
  rate_limit_per_minute,
  custom_headers,
  verify_ssl,
  include_payload,
  metadata,
  created_at,
  updated_at
)
SELECT 
  store_id,
  NULL as created_by, -- Pas de created_by dans physical_product_webhooks
  -- Générer un nom basé sur event_type (pas de colonne name dans physical_product_webhooks)
  'Physical Product Webhook - ' || event_type as name,
  NULL as description,
  target_url as url,
  secret_key as secret,
  ARRAY[event_type]::TEXT[] as events, -- Un seul événement par webhook
  CASE 
    WHEN is_active THEN 'active'::webhook_status 
    ELSE 'inactive'::webhook_status 
  END as status,
  3 as retry_count, -- Valeur par défaut (pas de max_attempts dans physical_product_webhooks)
  30 as timeout_seconds, -- Valeur par défaut
  60 as rate_limit_per_minute, -- Valeur par défaut
  '{}'::jsonb as custom_headers,
  TRUE as verify_ssl,
  TRUE as include_payload,
  jsonb_build_object(
    'source', 'physical_product_webhooks',
    'original_id', id::TEXT,
    'trigger_count', trigger_count,
    'success_count', success_count,
    'failure_count', failure_count
  ) as metadata,
  created_at,
  updated_at
FROM physical_product_webhooks
WHERE NOT EXISTS (
  -- Éviter les doublons basés sur store_id + url + events
  SELECT 1 FROM public.webhooks w
  WHERE w.store_id = physical_product_webhooks.store_id
    AND w.url = physical_product_webhooks.target_url
    AND w.events = ARRAY[physical_product_webhooks.event_type]::TEXT[]
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. MIGRATION DES STATISTIQUES
-- ============================================================================

-- Mettre à jour les statistiques des webhooks migrés depuis digital_product_webhooks
UPDATE public.webhooks w
SET 
  total_deliveries = COALESCE(d.total_sent, 0),
  successful_deliveries = COALESCE(d.total_succeeded, 0),
  failed_deliveries = COALESCE(d.total_failed, 0),
  last_triggered_at = d.last_sent_at
FROM digital_product_webhooks d
WHERE w.metadata->>'source' = 'digital_product_webhooks'
  AND w.url = d.url
  AND w.store_id = d.store_id
  AND w.metadata->>'original_id' = d.id::TEXT;

-- Mettre à jour les statistiques des webhooks migrés depuis physical_product_webhooks
DO $$
BEGIN
  -- Mettre à jour les statistiques seulement si la colonne failure_count existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhooks'
      AND column_name = 'failure_count'
  ) THEN
    UPDATE public.webhooks w
    SET 
      total_deliveries = COALESCE((w.metadata->>'trigger_count')::INTEGER, 0),
      successful_deliveries = COALESCE((w.metadata->>'success_count')::INTEGER, 0),
      failed_deliveries = COALESCE((w.metadata->>'failure_count')::INTEGER, 0),
      failure_count = COALESCE((w.metadata->>'failure_count')::INTEGER, 0),
      last_triggered_at = p.last_triggered_at
    FROM physical_product_webhooks p
    WHERE w.metadata->>'source' = 'physical_product_webhooks'
      AND w.url = p.target_url
      AND w.store_id = p.store_id
      AND w.metadata->>'original_id' = p.id::TEXT;
  ELSE
    -- Si failure_count n'existe pas, mettre à jour sans cette colonne
    UPDATE public.webhooks w
    SET 
      total_deliveries = COALESCE((w.metadata->>'trigger_count')::INTEGER, 0),
      successful_deliveries = COALESCE((w.metadata->>'success_count')::INTEGER, 0),
      failed_deliveries = COALESCE((w.metadata->>'failure_count')::INTEGER, 0),
      last_triggered_at = p.last_triggered_at
    FROM physical_product_webhooks p
    WHERE w.metadata->>'source' = 'physical_product_webhooks'
      AND w.url = p.target_url
      AND w.store_id = p.store_id
      AND w.metadata->>'original_id' = p.id::TEXT;
  END IF;
END $$;

-- ============================================================================
-- 4. CRÉER UNE TABLE DE MAPPING POUR RÉFÉRENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_migration_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  unified_webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_table, source_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_webhook_migration_map_source 
  ON public.webhook_migration_map(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_webhook_migration_map_unified 
  ON public.webhook_migration_map(unified_webhook_id);

-- Remplir la table de mapping pour digital_product_webhooks
INSERT INTO public.webhook_migration_map (source_table, source_id, unified_webhook_id)
SELECT 
  'digital_product_webhooks' as source_table,
  d.id as source_id,
  w.id as unified_webhook_id
FROM digital_product_webhooks d
JOIN public.webhooks w ON (
  w.store_id = d.store_id
  AND w.url = d.url
  AND w.metadata->>'source' = 'digital_product_webhooks'
  AND w.metadata->>'original_id' = d.id::TEXT
)
ON CONFLICT DO NOTHING;

-- Remplir la table de mapping pour physical_product_webhooks
INSERT INTO public.webhook_migration_map (source_table, source_id, unified_webhook_id)
SELECT 
  'physical_product_webhooks' as source_table,
  p.id as source_id,
  w.id as unified_webhook_id
FROM physical_product_webhooks p
JOIN public.webhooks w ON (
  w.store_id = p.store_id
  AND w.url = p.target_url
  AND w.events = ARRAY[p.event_type]::TEXT[]
  AND w.metadata->>'source' = 'physical_product_webhooks'
  AND w.metadata->>'original_id' = p.id::TEXT
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. VÉRIFICATIONS
-- ============================================================================

-- Afficher un résumé de la migration
DO $$
DECLARE
  digital_count INTEGER;
  physical_count INTEGER;
  unified_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO digital_count FROM digital_product_webhooks;
  SELECT COUNT(*) INTO physical_count FROM physical_product_webhooks;
  SELECT COUNT(*) INTO unified_count FROM public.webhooks 
    WHERE metadata->>'source' IN ('digital_product_webhooks', 'physical_product_webhooks');
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Digital Product Webhooks: %', digital_count;
  RAISE NOTICE '  Physical Product Webhooks: %', physical_count;
  RAISE NOTICE '  Migrated to Unified: %', unified_count;
  
  IF unified_count < (digital_count + physical_count) THEN
    RAISE WARNING 'Some webhooks may not have been migrated. Please verify.';
  END IF;
END $$;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.webhook_migration_map IS 
  'Table de mapping pour tracer la migration des webhooks depuis les anciens systèmes vers le système unifié';

COMMENT ON COLUMN public.webhook_migration_map.source_table IS 
  'Table source: digital_product_webhooks ou physical_product_webhooks';

COMMENT ON COLUMN public.webhook_migration_map.source_id IS 
  'ID du webhook dans la table source';

COMMENT ON COLUMN public.webhook_migration_map.unified_webhook_id IS 
  'ID du webhook dans la table unifiée webhooks';

