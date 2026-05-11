-- Migration: Table de monitoring des domaines personnalisés
-- Date: 2025-02-02
-- Description: Table pour suivre l'historique des vérifications DNS et l'état des domaines

-- Table pour l'historique des vérifications DNS
CREATE TABLE IF NOT EXISTS public.domain_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_result JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  propagation_time_ms INTEGER,
  
  -- Index pour les requêtes fréquentes
  CONSTRAINT idx_domain_verification_store_date 
    UNIQUE (store_id, checked_at)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_domain_verification_store_id 
  ON public.domain_verification_history(store_id);

CREATE INDEX IF NOT EXISTS idx_domain_verification_checked_at 
  ON public.domain_verification_history(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_domain_verification_status 
  ON public.domain_verification_history(status);

-- Table pour le monitoring SSL
CREATE TABLE IF NOT EXISTS public.ssl_certificate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  certificate_valid BOOLEAN DEFAULT false,
  certificate_issuer TEXT,
  certificate_expires_at TIMESTAMPTZ,
  certificate_fingerprint TEXT,
  ssl_grade TEXT CHECK (ssl_grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id)
);

-- Index pour le monitoring SSL
CREATE INDEX IF NOT EXISTS idx_ssl_certificate_store_id 
  ON public.ssl_certificate_status(store_id);

CREATE INDEX IF NOT EXISTS idx_ssl_certificate_expires_at 
  ON public.ssl_certificate_status(certificate_expires_at) 
  WHERE certificate_expires_at IS NOT NULL;

-- Fonction pour nettoyer l'historique ancien (garder 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_domain_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.domain_verification_history
  WHERE checked_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE public.domain_verification_history IS 'Historique des vérifications DNS pour les domaines personnalisés';
COMMENT ON TABLE public.ssl_certificate_status IS 'État et informations des certificats SSL pour les domaines personnalisés';
COMMENT ON FUNCTION cleanup_old_domain_history IS 'Nettoie l''historique des vérifications DNS de plus de 30 jours';

