-- =========================================================
-- MIGRATION : Historique des changements de statut des retraits
-- Date : 2025-02-03
-- Description : Crée une table pour tracer tous les changements de statut des retraits
-- =========================================================

-- Table pour l'historique des changements de statut
CREATE TABLE IF NOT EXISTS public.store_withdrawal_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES public.store_withdrawals(id) ON DELETE CASCADE,
  
  -- Statut
  old_status TEXT,
  new_status TEXT NOT NULL CHECK (new_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Métadonnées
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_status_history_withdrawal_id ON public.store_withdrawal_status_history(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status_history_created_at ON public.store_withdrawal_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status_history_new_status ON public.store_withdrawal_status_history(new_status);

-- RLS Policies
ALTER TABLE public.store_withdrawal_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view their withdrawal history" ON public.store_withdrawal_status_history;
CREATE POLICY "Store owners can view their withdrawal history"
  ON public.store_withdrawal_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_withdrawals sw
      INNER JOIN public.stores s ON s.id = sw.store_id
      WHERE sw.id = store_withdrawal_status_history.withdrawal_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all withdrawal history" ON public.store_withdrawal_status_history;
CREATE POLICY "Admins can view all withdrawal history"
  ON public.store_withdrawal_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function pour créer automatiquement un historique lors d'un changement de statut
CREATE OR REPLACE FUNCTION public.log_withdrawal_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ne créer un historique que si le statut a changé
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.store_withdrawal_status_history (
      withdrawal_id,
      old_status,
      new_status,
      changed_by,
      change_reason,
      notes
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'failed' THEN NEW.rejection_reason
        WHEN NEW.status = 'processing' THEN 'Approuvé par l''administrateur'
        WHEN NEW.status = 'completed' THEN 'Retrait complété'
        WHEN NEW.status = 'cancelled' THEN 'Annulé par le vendeur'
        ELSE NULL
      END,
      NEW.admin_notes
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour appeler la fonction automatiquement
DROP TRIGGER IF EXISTS trigger_log_withdrawal_status_change ON public.store_withdrawals;
CREATE TRIGGER trigger_log_withdrawal_status_change
  AFTER UPDATE OF status ON public.store_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_withdrawal_status_change();

COMMENT ON TABLE public.store_withdrawal_status_history IS 'Historique des changements de statut des retraits pour traçabilité complète';
COMMENT ON COLUMN public.store_withdrawal_status_history.change_reason IS 'Raison du changement (ex: raison du rejet, référence transaction, etc.)';
COMMENT ON FUNCTION public.log_withdrawal_status_change() IS 'Fonction trigger pour créer automatiquement un historique lors d''un changement de statut';

