-- ================================================================
-- Multi-Region Deployment Configuration - Phase 4 Scalability
-- Date: 2025-01-29
-- Description: Configuration pour déploiement multi-régions
-- ================================================================

-- =====================================================
-- 1. CONFIGURATION READ REPLICAS
-- =====================================================
-- Les read replicas permettent de distribuer la charge de lecture
-- sur plusieurs régions pour améliorer les performances

-- Note: La création de read replicas se fait via le dashboard Supabase
-- Cette migration documente la configuration nécessaire

-- =====================================================
-- 2. CONFIGURATION EDGE FUNCTIONS MULTI-REGION
-- =====================================================
-- Les Edge Functions sont automatiquement déployées sur l'Edge Network
-- de Supabase, qui distribue les fonctions sur plusieurs régions

-- =====================================================
-- 3. CONFIGURATION STORAGE MULTI-REGION
-- =====================================================
-- Configuration des buckets de stockage pour multi-région

-- Bucket pour les produits digitaux (multi-région)
DO $$
BEGIN
  -- Vérifier si le bucket existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'digital-products'
  ) THEN
    -- Le bucket sera créé via le dashboard Supabase
    -- Cette migration documente la configuration
    RAISE NOTICE 'Bucket digital-products doit être configuré pour multi-région via le dashboard';
  END IF;
END $$;

-- Bucket pour les images produits (multi-région)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'product-images'
  ) THEN
    RAISE NOTICE 'Bucket product-images doit être configuré pour multi-région via le dashboard';
  END IF;
END $$;

-- =====================================================
-- 4. CONFIGURATION RLS MULTI-REGION
-- =====================================================
-- Les politiques RLS fonctionnent de la même manière sur toutes les régions
-- Aucune configuration supplémentaire nécessaire

-- =====================================================
-- 5. CONFIGURATION CONNECTION POOLING
-- =====================================================
-- Le connection pooling est activé automatiquement par Supabase
-- pour améliorer les performances et la scalabilité

-- Vérifier la configuration du connection pooling
DO $$
BEGIN
  -- Le connection pooling est géré automatiquement par Supabase
  -- Cette migration documente la configuration
  RAISE NOTICE 'Connection pooling activé automatiquement par Supabase';
END $$;

-- =====================================================
-- 6. CONFIGURATION CACHE MULTI-REGION
-- =====================================================
-- Configuration du cache pour améliorer les performances

-- Fonction pour invalider le cache (à utiliser dans les Edge Functions)
CREATE OR REPLACE FUNCTION invalidate_cache(
  cache_key TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cette fonction peut être utilisée pour invalider le cache
  -- L'implémentation dépend du système de cache utilisé
  -- (Redis, Cloudflare, etc.)
  RAISE NOTICE 'Cache invalidation for key: %', cache_key;
END;
$$;

-- =====================================================
-- 7. CONFIGURATION MONITORING MULTI-REGION
-- =====================================================
-- Table pour suivre les performances par région

CREATE TABLE IF NOT EXISTS region_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour les requêtes de monitoring
CREATE INDEX IF NOT EXISTS idx_region_performance_metrics_region 
ON region_performance_metrics(region);

CREATE INDEX IF NOT EXISTS idx_region_performance_metrics_timestamp 
ON region_performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_region_performance_metrics_type 
ON region_performance_metrics(metric_type);

-- RLS pour la table de monitoring
ALTER TABLE region_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins uniquement
CREATE POLICY "Admins can view region performance metrics"
ON region_performance_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- =====================================================
-- 8. FONCTION POUR ENREGISTRER LES MÉTRIQUES
-- =====================================================
-- Fonction pour enregistrer les métriques de performance par région

CREATE OR REPLACE FUNCTION record_region_metric(
  p_region TEXT,
  p_metric_type TEXT,
  p_metric_value NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO region_performance_metrics (
    region,
    metric_type,
    metric_value,
    metadata
  ) VALUES (
    p_region,
    p_metric_type,
    p_metric_value,
    p_metadata
  )
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$;

-- =====================================================
-- 9. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE region_performance_metrics IS 
'Table pour suivre les performances par région pour le monitoring multi-région';

COMMENT ON FUNCTION record_region_metric IS 
'Fonction pour enregistrer les métriques de performance par région';

COMMENT ON FUNCTION invalidate_cache IS 
'Fonction pour invalider le cache (à implémenter selon le système de cache utilisé)';

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================
-- ⚠️ ATTENTION: La configuration multi-région de Supabase se fait principalement
-- via le dashboard Supabase, pas via SQL
--
-- Pour configurer le multi-région:
-- 1. Aller dans Supabase Dashboard → Settings → Infrastructure
-- 2. Configurer les read replicas dans les régions souhaitées
-- 3. Configurer les Edge Functions pour déploiement multi-région
-- 4. Configurer les buckets de stockage pour multi-région
--
-- Cette migration documente la configuration et crée les tables/fonctions
-- nécessaires pour le monitoring multi-région


