-- Migration: Amélioration de l'idempotence des webhooks
-- Date: 31 Janvier 2025
-- Description: Ajoute une protection contre les webhooks dupliqués et améliore la validation

-- Ajouter une colonne pour tracker les webhooks traités
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS webhook_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_webhook_payload JSONB;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_transactions_webhook_processed 
ON public.transactions(webhook_processed_at) 
WHERE webhook_processed_at IS NOT NULL;

-- Fonction pour vérifier si un webhook a déjà été traité
CREATE OR REPLACE FUNCTION public.is_webhook_already_processed(
  p_transaction_id UUID,
  p_status TEXT,
  p_provider TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_webhook_processed TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer le statut actuel et la date de traitement
  SELECT status, webhook_processed_at
  INTO v_current_status, v_webhook_processed
  FROM transactions
  WHERE id = p_transaction_id;

  -- Si la transaction n'existe pas, retourner false (peut être traitée)
  IF v_current_status IS NULL THEN
    RETURN false;
  END IF;

  -- Si le statut est déjà 'completed' et qu'on reçoit un webhook 'completed', ignorer
  IF v_current_status = 'completed' AND p_status = 'completed' THEN
    -- Vérifier si le webhook a déjà été traité récemment (dans les 5 dernières minutes)
    IF v_webhook_processed IS NOT NULL AND v_webhook_processed > NOW() - INTERVAL '5 minutes' THEN
      RETURN true;
    END IF;
  END IF;

  -- Si le statut est déjà 'failed' et qu'on reçoit un webhook 'failed', ignorer
  IF v_current_status = 'failed' AND p_status = 'failed' THEN
    IF v_webhook_processed IS NOT NULL AND v_webhook_processed > NOW() - INTERVAL '5 minutes' THEN
      RETURN true;
    END IF;
  END IF;

  -- Sinon, le webhook peut être traité
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider la cohérence des montants
CREATE OR REPLACE FUNCTION public.validate_transaction_amount(
  p_transaction_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_total NUMERIC;
  v_transaction_amount NUMERIC;
  v_difference NUMERIC;
BEGIN
  -- Récupérer le montant de la transaction et de la commande
  SELECT t.amount, o.total_amount
  INTO v_transaction_amount, v_order_total
  FROM transactions t
  LEFT JOIN orders o ON o.id = t.order_id
  WHERE t.id = p_transaction_id;

  -- Si pas de commande associée, validation OK
  IF v_order_total IS NULL THEN
    RETURN true;
  END IF;

  -- Calculer la différence
  v_difference := ABS(v_transaction_amount - v_order_total);

  -- Tolérer une différence de 0.01 (arrondis)
  IF v_difference > 0.01 THEN
    -- Logger l'alerte
    INSERT INTO transaction_logs (
      transaction_id,
      event_type,
      status,
      error_data
    ) VALUES (
      p_transaction_id,
      'amount_mismatch',
      'warning',
      jsonb_build_object(
        'transaction_amount', v_transaction_amount,
        'order_total', v_order_total,
        'difference', v_difference,
        'webhook_amount', p_amount
      )
    );

    -- Retourner false pour signaler l'incohérence
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON FUNCTION public.is_webhook_already_processed IS 'Vérifie si un webhook a déjà été traité pour éviter les doublons';
COMMENT ON FUNCTION public.validate_transaction_amount IS 'Valide que le montant de la transaction correspond au montant de la commande';

-- Ajouter des index pour améliorer les performances
-- Vérifier d'abord si les colonnes existent avant de créer les index

DO $$
BEGIN
  -- Vérifier si order_id existe et créer l'index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'order_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_order_id_status 
    ON public.transactions(order_id, status) 
    WHERE order_id IS NOT NULL;
  END IF;

  -- Vérifier si customer_id existe et créer l'index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_customer_id_status 
    ON public.transactions(customer_id, status) 
    WHERE customer_id IS NOT NULL;
  END IF;

  -- Vérifier si store_id existe et créer l'index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'store_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_store_id_created_at 
    ON public.transactions(store_id, created_at DESC);
  END IF;

  -- Vérifier si status existe et créer l'index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_status_created_at 
    ON public.transactions(status, created_at DESC);
  END IF;
END $$;
