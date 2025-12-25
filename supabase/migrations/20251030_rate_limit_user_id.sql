-- =========================================================
-- Migration : Ajout support userId dans rate_limit_log
-- Date : 30 Octobre 2025
-- Description : Ajoute la colonne user_id pour un rate limiting plus précis
-- =========================================================

-- Vérifier que la table existe, sinon la créer
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  request_path TEXT
);

-- Ajouter la colonne user_id si elle n'existe pas
DO $$ 
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rate_limit_log'
  ) THEN
    -- Vérifier si la colonne user_id n'existe pas déjà
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'rate_limit_log' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.rate_limit_log 
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Index pour performances (recherche par userId + endpoint + date)
-- Utiliser DROP IF EXISTS pour éviter l'erreur si l'index existe déjà
DROP INDEX IF EXISTS idx_rate_limit_user_endpoint_date;
CREATE INDEX idx_rate_limit_user_endpoint_date 
ON public.rate_limit_log(user_id, endpoint, created_at DESC)
WHERE user_id IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN public.rate_limit_log.user_id IS 'ID de l''utilisateur authentifié (optionnel, pour rate limiting par utilisateur)';

