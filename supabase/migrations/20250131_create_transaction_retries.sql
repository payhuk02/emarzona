-- Migration: Système de retry automatique pour transactions échouées
-- Date: 31 Janvier 2025
-- Description: Crée la table et les fonctions pour gérer les retries automatiques

-- Table pour tracker les tentatives de retry
CREATE TABLE IF NOT EXISTS public.transaction_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  
  -- Informations de retry
  attempt_number INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE NOT NULL,
  retry_strategy TEXT NOT NULL DEFAULT 'exponential' CHECK (retry_strategy IN ('exponential', 'linear', 'fixed')),
  
  -- Résultats
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  last_attempt_result JSONB,
  error_message TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_transaction_retries_transaction_id ON public.transaction_retries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_retries_status ON public.transaction_retries(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_transaction_retries_next_retry_at ON public.transaction_retries(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transaction_retries_created_at ON public.transaction_retries(created_at DESC);

-- Index unique partiel : une seule retry active par transaction
-- Cette contrainte garantit qu'il ne peut y avoir qu'une seule retry en statut 'pending' ou 'processing' par transaction
CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_retries_unique_active 
ON public.transaction_retries(transaction_id) 
WHERE status IN ('pending', 'processing');

-- Fonction pour calculer la prochaine date de retry
CREATE OR REPLACE FUNCTION public.calculate_next_retry_date(
  p_attempt_number INTEGER,
  p_strategy TEXT DEFAULT 'exponential'
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_hours INTEGER;
BEGIN
  -- Stratégie exponentielle : 1h, 6h, 24h, 48h, 72h
  IF p_strategy = 'exponential' THEN
    v_hours := CASE p_attempt_number
      WHEN 1 THEN 1
      WHEN 2 THEN 6
      WHEN 3 THEN 24
      WHEN 4 THEN 48
      ELSE 72
    END;
  -- Stratégie linéaire : 2h, 4h, 6h, 8h, 10h
  ELSIF p_strategy = 'linear' THEN
    v_hours := p_attempt_number * 2;
  -- Stratégie fixe : 6h à chaque fois
  ELSE
    v_hours := 6;
  END IF;
  
  RETURN NOW() + (v_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour créer ou mettre à jour une retry
CREATE OR REPLACE FUNCTION public.create_or_update_transaction_retry(
  p_transaction_id UUID,
  p_max_attempts INTEGER DEFAULT 3,
  p_strategy TEXT DEFAULT 'exponential'
)
RETURNS UUID AS $$
DECLARE
  v_retry_id UUID;
  v_existing_retry RECORD;
  v_next_attempt INTEGER;
BEGIN
  -- Vérifier si une retry existe déjà
  SELECT * INTO v_existing_retry
  FROM public.transaction_retries
  WHERE transaction_id = p_transaction_id
    AND status IN ('pending', 'processing')
  LIMIT 1;

  IF v_existing_retry IS NOT NULL THEN
    -- Mettre à jour la retry existante
    v_next_attempt := v_existing_retry.attempt_number + 1;
    
    -- Vérifier si on a atteint le maximum
    IF v_next_attempt > p_max_attempts THEN
      -- Marquer comme failed
      UPDATE public.transaction_retries
      SET 
        status = 'failed',
        error_message = 'Maximum number of retries reached',
        updated_at = NOW(),
        completed_at = NOW()
      WHERE id = v_existing_retry.id;
      
      RETURN v_existing_retry.id;
    END IF;

    -- Mettre à jour pour le prochain retry
    UPDATE public.transaction_retries
    SET 
      attempt_number = v_next_attempt,
      next_retry_at = calculate_next_retry_date(v_next_attempt, p_strategy),
      status = 'pending',
      updated_at = NOW()
    WHERE id = v_existing_retry.id
    RETURNING id INTO v_retry_id;

    RETURN v_retry_id;
  ELSE
    -- Créer une nouvelle retry
    INSERT INTO public.transaction_retries (
      transaction_id,
      attempt_number,
      max_attempts,
      next_retry_at,
      retry_strategy,
      status
    ) VALUES (
      p_transaction_id,
      1,
      p_max_attempts,
      calculate_next_retry_date(1, p_strategy),
      p_strategy,
      'pending'
    ) RETURNING id INTO v_retry_id;

    RETURN v_retry_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les retries à traiter
CREATE OR REPLACE FUNCTION public.get_pending_transaction_retries()
RETURNS TABLE (
  retry_id UUID,
  transaction_id UUID,
  attempt_number INTEGER,
  max_attempts INTEGER,
  payment_provider TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.transaction_id,
    tr.attempt_number,
    tr.max_attempts,
    t.payment_provider
  FROM public.transaction_retries tr
  JOIN public.transactions t ON t.id = tr.transaction_id
  WHERE tr.status = 'pending'
    AND tr.next_retry_at <= NOW()
    AND t.status IN ('processing', 'pending')
  ORDER BY tr.next_retry_at ASC
  LIMIT 100; -- Limite pour éviter de surcharger
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement une retry en cas d'échec
CREATE OR REPLACE FUNCTION public.auto_create_transaction_retry()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'failed' et qu'il n'y a pas encore de retry
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    -- Vérifier que ce n'est pas un échec définitif (trop d'erreurs)
    IF NEW.retry_count < 5 THEN
      PERFORM create_or_update_transaction_retry(
        NEW.id,
        3, -- max attempts
        'exponential' -- strategy
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_create_transaction_retry ON public.transactions;
CREATE TRIGGER trigger_auto_create_transaction_retry
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION public.auto_create_transaction_retry();

-- RLS Policies
ALTER TABLE public.transaction_retries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their transaction retries"
  ON public.transaction_retries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      JOIN public.stores s ON s.id = t.store_id
      WHERE t.id = transaction_retries.transaction_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transaction retries"
  ON public.transaction_retries FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Commentaires
COMMENT ON TABLE public.transaction_retries IS 'Système de retry automatique pour les transactions échouées';
COMMENT ON FUNCTION public.calculate_next_retry_date(INTEGER, TEXT) IS 'Calcule la prochaine date de retry selon la stratégie';
COMMENT ON FUNCTION public.create_or_update_transaction_retry(UUID, INTEGER, TEXT) IS 'Crée ou met à jour une retry pour une transaction';
COMMENT ON FUNCTION public.get_pending_transaction_retries() IS 'Récupère les retries en attente de traitement';

