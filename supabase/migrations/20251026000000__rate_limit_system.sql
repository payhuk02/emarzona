-- =========================================================
-- Migration : Système de Rate Limiting
-- Date : 26 Octobre 2025
-- Description : Table pour logger et gérer le rate limiting
-- =========================================================

-- Table pour logger les requêtes (rate limiting)
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  request_path TEXT
);

-- Index pour performances (recherche par IP + endpoint + date)
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint_date 
ON public.rate_limit_log(ip_address, endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at 
ON public.rate_limit_log(created_at DESC);

-- Fonction de nettoyage automatique (garder seulement 24h d'historique)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - INTERVAL '24 hours';
END;
$$;

-- Commentaires
COMMENT ON TABLE public.rate_limit_log IS 'Logs des requêtes pour rate limiting (24h de rétention)';
COMMENT ON COLUMN public.rate_limit_log.ip_address IS 'Adresse IP du client';
COMMENT ON COLUMN public.rate_limit_log.endpoint IS 'Endpoint appelé (auth, api, webhook, default)';

-- Désactiver RLS (table système)
ALTER TABLE public.rate_limit_log DISABLE ROW LEVEL SECURITY;

-- Note: Créer un cron job pour nettoyer automatiquement
-- Exemple: SELECT cron.schedule('cleanup-rate-limit', '0 * * * *', 'SELECT cleanup_rate_limit_log();');

