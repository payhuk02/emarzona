-- =====================================================
-- PAYHUK PRODUCT VERSIONING - BETA & ROLLBACK SUPPORT
-- Date: 27 Janvier 2025
-- Description: Amélioration du système de versioning avec support Beta et Rollback automatique
-- =====================================================

-- =====================================================
-- 1. Ajouter colonnes Beta et Rollback à product_versions
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'product_versions'
  ) THEN
    -- Colonne pour marquer les versions beta
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'is_beta'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN is_beta BOOLEAN DEFAULT FALSE;
      
      COMMENT ON COLUMN public.product_versions.is_beta IS 'Marque cette version comme version beta (test)';
    END IF;
    
    -- Colonne pour le pourcentage de rollback (si > 0, rollback automatique activé)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rollback_threshold_percentage'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rollback_threshold_percentage NUMERIC(5, 2) DEFAULT NULL CHECK (rollback_threshold_percentage >= 0 AND rollback_threshold_percentage <= 100);
      
      COMMENT ON COLUMN public.product_versions.rollback_threshold_percentage IS 'Pourcentage de taux d''erreur pour déclencher rollback automatique (NULL = désactivé)';
    END IF;
    
    -- Colonne pour le nombre minimum de téléchargements avant évaluation rollback
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rollback_min_downloads'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rollback_min_downloads INTEGER DEFAULT 100 CHECK (rollback_min_downloads >= 0);
      
      COMMENT ON COLUMN public.product_versions.rollback_min_downloads IS 'Nombre minimum de téléchargements avant évaluation du rollback';
    END IF;
    
    -- Colonne pour le statut de rollback
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rollback_status'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rollback_status TEXT CHECK (rollback_status IN ('none', 'monitoring', 'rolled_back', 'rollback_failed')) DEFAULT 'none';
      
      COMMENT ON COLUMN public.product_versions.rollback_status IS 'Statut du système de rollback';
    END IF;
    
    -- Colonne pour la date de rollback
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rolled_back_at'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rolled_back_at TIMESTAMPTZ;
      
      COMMENT ON COLUMN public.product_versions.rolled_back_at IS 'Date du rollback automatique';
    END IF;
    
    -- Colonne pour la raison du rollback
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rollback_reason'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rollback_reason TEXT;
      
      COMMENT ON COLUMN public.product_versions.rollback_reason IS 'Raison du rollback (erreur, bug, etc.)';
    END IF;
    
    -- Colonne pour les métriques de monitoring
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rollback_metrics'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rollback_metrics JSONB DEFAULT '{}'::jsonb;
      
      COMMENT ON COLUMN public.product_versions.rollback_metrics IS 'Métriques pour le rollback (taux d''erreur, téléchargements, etc.)';
    END IF;
    
    -- Colonne pour la version précédente (pour rollback)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'previous_version_id'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN previous_version_id UUID REFERENCES public.product_versions(id) ON DELETE SET NULL;
      
      COMMENT ON COLUMN public.product_versions.previous_version_id IS 'Version précédente (pour rollback)';
    END IF;
    
    -- Colonne pour la version de rollback (si rollback effectué)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'product_versions'
      AND column_name = 'rolled_back_to_version_id'
    ) THEN
      ALTER TABLE public.product_versions
      ADD COLUMN rolled_back_to_version_id UUID REFERENCES public.product_versions(id) ON DELETE SET NULL;
      
      COMMENT ON COLUMN public.product_versions.rolled_back_to_version_id IS 'Version vers laquelle le rollback a été effectué';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: version_rollback_logs (Historique rollbacks)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_rollback_logs'
  ) THEN
    CREATE TABLE public.version_rollback_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version_id UUID NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
      rolled_back_to_version_id UUID REFERENCES public.product_versions(id) ON DELETE SET NULL,
      
      -- Rollback info
      rollback_type TEXT NOT NULL CHECK (rollback_type IN ('automatic', 'manual', 'scheduled')),
      rollback_reason TEXT NOT NULL,
      rollback_triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = automatique
      
      -- Metrics at time of rollback
      error_rate_percentage NUMERIC(5, 2),
      total_downloads INTEGER,
      total_errors INTEGER,
      metrics_snapshot JSONB DEFAULT '{}'::jsonb,
      
      -- Status
      rollback_status TEXT NOT NULL CHECK (rollback_status IN ('success', 'failed', 'partial')) DEFAULT 'success',
      error_message TEXT,
      
      -- Dates
      rolled_back_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    COMMENT ON TABLE public.version_rollback_logs IS 'Historique des rollbacks de versions';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_rollback_logs'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_rollback_logs_version_id ON public.version_rollback_logs(version_id);
    CREATE INDEX IF NOT EXISTS idx_rollback_logs_rolled_back_at ON public.version_rollback_logs(rolled_back_at DESC);
    CREATE INDEX IF NOT EXISTS idx_rollback_logs_status ON public.version_rollback_logs(rollback_status);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: version_download_errors (Tracking erreurs)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_download_errors'
  ) THEN
    CREATE TABLE public.version_download_errors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version_id UUID NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      
      -- Error info
      error_type TEXT NOT NULL, -- 'download_failed', 'file_corrupted', 'checksum_mismatch', 'installation_failed', etc.
      error_message TEXT,
      error_code TEXT,
      error_stack TEXT, -- Pour debugging
      
      -- Context
      download_url TEXT,
      file_size_mb NUMERIC,
      user_agent TEXT,
      ip_address TEXT,
      country TEXT,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    COMMENT ON TABLE public.version_download_errors IS 'Tracking des erreurs de téléchargement pour rollback automatique';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_download_errors'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_version_errors_version_id ON public.version_download_errors(version_id);
    CREATE INDEX IF NOT EXISTS idx_version_errors_created_at ON public.version_download_errors(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_version_errors_type ON public.version_download_errors(error_type);
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTION: Calculate version error rate
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_version_error_rate(
  p_version_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_total_downloads INTEGER;
  v_total_errors INTEGER;
  v_error_rate NUMERIC;
BEGIN
  -- Compter les téléchargements
  SELECT COUNT(*) INTO v_total_downloads
  FROM public.version_download_logs
  WHERE version_id = p_version_id;
  
  -- Compter les erreurs
  SELECT COUNT(*) INTO v_total_errors
  FROM public.version_download_errors
  WHERE version_id = p_version_id;
  
  -- Calculer le taux d'erreur
  IF v_total_downloads > 0 THEN
    v_error_rate := (v_total_errors::NUMERIC / v_total_downloads::NUMERIC) * 100;
  ELSE
    v_error_rate := 0;
  END IF;
  
  RETURN v_error_rate;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCTION: Check and trigger rollback if needed
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_trigger_rollback(
  p_version_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_version RECORD;
  v_error_rate NUMERIC;
  v_total_downloads INTEGER;
  v_total_errors INTEGER;
  v_previous_version RECORD;
  v_rollback_log_id UUID;
BEGIN
  -- Récupérer la version
  SELECT * INTO v_version
  FROM public.product_versions
  WHERE id = p_version_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'version_not_found'
    );
  END IF;
  
  -- Vérifier si le rollback est activé
  IF v_version.rollback_threshold_percentage IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'rollback_not_enabled'
    );
  END IF;
  
  -- Vérifier si déjà rollback
  IF v_version.rollback_status = 'rolled_back' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_rolled_back'
    );
  END IF;
  
  -- Compter les téléchargements
  SELECT COUNT(*) INTO v_total_downloads
  FROM public.version_download_logs
  WHERE version_id = p_version_id;
  
  -- Vérifier le minimum de téléchargements
  IF v_total_downloads < v_version.rollback_min_downloads THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_downloads',
      'message', format('Minimum %s téléchargements requis', v_version.rollback_min_downloads),
      'current_downloads', v_total_downloads
    );
  END IF;
  
  -- Calculer le taux d'erreur
  SELECT COUNT(*) INTO v_total_errors
  FROM public.version_download_errors
  WHERE version_id = p_version_id;
  
  v_error_rate := calculate_version_error_rate(p_version_id);
  
  -- Vérifier si le seuil est dépassé
  IF v_error_rate >= v_version.rollback_threshold_percentage THEN
    -- Trouver la version précédente stable
    SELECT * INTO v_previous_version
    FROM public.product_versions
    WHERE product_id = v_version.product_id
      AND status = 'stable'
      AND is_beta = FALSE
      AND id != p_version_id
      AND (release_date IS NULL OR release_date < v_version.release_date)
    ORDER BY release_date DESC NULLS LAST
    LIMIT 1;
    
    IF NOT FOUND THEN
      -- Pas de version stable précédente, marquer comme rollback failed
      UPDATE public.product_versions
      SET
        rollback_status = 'rollback_failed',
        rollback_reason = format('Taux d''erreur de %s%% (seuil: %s%%), mais aucune version stable précédente disponible', v_error_rate, v_version.rollback_threshold_percentage),
        rollback_metrics = jsonb_build_object(
          'error_rate', v_error_rate,
          'total_downloads', v_total_downloads,
          'total_errors', v_total_errors,
          'checked_at', now()
        )
      WHERE id = p_version_id;
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'no_previous_stable_version',
        'error_rate', v_error_rate,
        'threshold', v_version.rollback_threshold_percentage
      );
    END IF;
    
    -- Effectuer le rollback
    UPDATE public.product_versions
    SET
      status = 'deprecated',
      rollback_status = 'rolled_back',
      rolled_back_at = now(),
      rolled_back_to_version_id = v_previous_version.id,
      rollback_reason = format('Taux d''erreur de %s%% dépasse le seuil de %s%%', v_error_rate, v_version.rollback_threshold_percentage),
      rollback_metrics = jsonb_build_object(
        'error_rate', v_error_rate,
        'total_downloads', v_total_downloads,
        'total_errors', v_total_errors,
        'rolled_back_at', now()
      )
    WHERE id = p_version_id;
    
    -- Réactiver la version précédente
    UPDATE public.product_versions
    SET status = 'stable'
    WHERE id = v_previous_version.id;
    
    -- Enregistrer le log
    INSERT INTO public.version_rollback_logs (
      version_id,
      rolled_back_to_version_id,
      rollback_type,
      rollback_reason,
      error_rate_percentage,
      total_downloads,
      total_errors,
      rollback_status,
      metrics_snapshot
    ) VALUES (
      p_version_id,
      v_previous_version.id,
      'automatic',
      format('Taux d''erreur de %s%% dépasse le seuil de %s%%', v_error_rate, v_version.rollback_threshold_percentage),
      v_error_rate,
      v_total_downloads,
      v_total_errors,
      'success',
      jsonb_build_object(
        'error_rate', v_error_rate,
        'total_downloads', v_total_downloads,
        'total_errors', v_total_errors
      )
    ) RETURNING id INTO v_rollback_log_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'rollback_log_id', v_rollback_log_id,
      'error_rate', v_error_rate,
      'threshold', v_version.rollback_threshold_percentage,
      'rolled_back_to_version', v_previous_version.version_number
    );
  ELSE
    -- Mettre à jour les métriques mais pas de rollback
    UPDATE public.product_versions
    SET
      rollback_status = 'monitoring',
      rollback_metrics = jsonb_build_object(
        'error_rate', v_error_rate,
        'total_downloads', v_total_downloads,
        'total_errors', v_total_errors,
        'checked_at', now()
      )
    WHERE id = p_version_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'monitoring',
      'error_rate', v_error_rate,
      'threshold', v_version.rollback_threshold_percentage,
      'message', format('Taux d''erreur de %s%% en dessous du seuil de %s%%', v_error_rate, v_version.rollback_threshold_percentage)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCTION: Manual rollback
-- =====================================================

CREATE OR REPLACE FUNCTION manual_rollback_version(
  p_version_id UUID,
  p_rollback_to_version_id UUID,
  p_reason TEXT,
  p_triggered_by UUID
) RETURNS JSONB AS $$
DECLARE
  v_version RECORD;
  v_target_version RECORD;
  v_rollback_log_id UUID;
BEGIN
  -- Récupérer la version à rollback
  SELECT * INTO v_version
  FROM public.product_versions
  WHERE id = p_version_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'version_not_found');
  END IF;
  
  -- Récupérer la version cible
  SELECT * INTO v_target_version
  FROM public.product_versions
  WHERE id = p_rollback_to_version_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_version_not_found');
  END IF;
  
  -- Effectuer le rollback
  UPDATE public.product_versions
  SET
    status = 'deprecated',
    rollback_status = 'rolled_back',
    rolled_back_at = now(),
    rolled_back_to_version_id = p_rollback_to_version_id,
    rollback_reason = p_reason
  WHERE id = p_version_id;
  
  -- Réactiver la version cible
  UPDATE public.product_versions
  SET status = 'stable'
  WHERE id = p_rollback_to_version_id;
  
  -- Enregistrer le log
  INSERT INTO public.version_rollback_logs (
    version_id,
    rolled_back_to_version_id,
    rollback_type,
    rollback_reason,
    rollback_triggered_by,
    rollback_status
  ) VALUES (
    p_version_id,
    p_rollback_to_version_id,
    'manual',
    p_reason,
    p_triggered_by,
    'success'
  ) RETURNING id INTO v_rollback_log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'rollback_log_id', v_rollback_log_id,
    'rolled_back_from', v_version.version_number,
    'rolled_back_to', v_target_version.version_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_rollback_logs'
  ) THEN
    ALTER TABLE public.version_rollback_logs ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can view rollback logs
    DROP POLICY IF EXISTS "Store owners view rollback logs" ON public.version_rollback_logs;
    CREATE POLICY "Store owners view rollback logs"
      ON public.version_rollback_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.product_versions v
          INNER JOIN public.stores s ON v.store_id = s.id
          WHERE v.id = version_rollback_logs.version_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS pour version_download_errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'version_download_errors'
  ) THEN
    ALTER TABLE public.version_download_errors ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can view errors
    DROP POLICY IF EXISTS "Store owners view version errors" ON public.version_download_errors;
    CREATE POLICY "Store owners view version errors"
      ON public.version_download_errors
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.product_versions v
          INNER JOIN public.stores s ON v.store_id = s.id
          WHERE v.id = version_download_errors.version_id
          AND s.user_id = auth.uid()
        )
      );
    
    -- Users can insert their own errors
    DROP POLICY IF EXISTS "Users can report version errors" ON public.version_download_errors;
    CREATE POLICY "Users can report version errors"
      ON public.version_download_errors
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 8. VÉRIFICATION
-- =====================================================

SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE '%rollback%' OR tablename LIKE '%version%error%'
  AND schemaname = 'public'
ORDER BY tablename;

