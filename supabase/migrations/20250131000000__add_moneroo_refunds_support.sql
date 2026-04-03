-- Migration: Support pour remboursements Moneroo
-- Date: 31 Janvier 2025
-- Description: Ajoute les colonnes nécessaires pour tracker les remboursements Moneroo

-- Ajouter les colonnes de remboursement à la table transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS moneroo_refund_id TEXT,
ADD COLUMN IF NOT EXISTS moneroo_refund_amount NUMERIC,
ADD COLUMN IF NOT EXISTS moneroo_refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Créer un index sur moneroo_refund_id pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_transactions_moneroo_refund_id 
ON public.transactions(moneroo_refund_id) 
WHERE moneroo_refund_id IS NOT NULL;

-- Créer un index sur refunded_at pour les requêtes de remboursements récents
CREATE INDEX IF NOT EXISTS idx_transactions_refunded_at 
ON public.transactions(refunded_at) 
WHERE refunded_at IS NOT NULL;

-- Ajouter un statut 'refunded' aux valeurs possibles (si ce n'est pas déjà fait)
-- Note: Cette modification peut nécessiter une migration séparée si le type CHECK existe
DO $$
BEGIN
  -- Vérifier si le statut 'refunded' peut être utilisé
  -- Si une contrainte CHECK existe, elle devra être modifiée manuellement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_status_check'
  ) THEN
    -- Pas de contrainte CHECK, on peut continuer
    NULL;
  ELSE
    -- Une contrainte CHECK existe, on doit la modifier
    -- Pour l'instant, on laisse PostgreSQL gérer cela via ALTER TABLE si nécessaire
    RAISE NOTICE 'A CHECK constraint on status may need to be updated to include refunded status';
  END IF;
END $$;

-- Ajouter un commentaire pour documenter les nouvelles colonnes
COMMENT ON COLUMN public.transactions.moneroo_refund_id IS 'ID du remboursement Moneroo';
COMMENT ON COLUMN public.transactions.moneroo_refund_amount IS 'Montant remboursé (peut être partiel)';
COMMENT ON COLUMN public.transactions.moneroo_refund_reason IS 'Raison du remboursement';
COMMENT ON COLUMN public.transactions.refunded_at IS 'Date et heure du remboursement';







