-- =========================================================
-- Migration : Correction trigger transaction_retries
-- Date : 1 Février 2025
-- Description : Ajoute le trigger manquant pour updated_at sur transaction_retries
-- =========================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_transaction_retries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS update_transaction_retries_updated_at ON public.transaction_retries;
CREATE TRIGGER update_transaction_retries_updated_at
  BEFORE UPDATE ON public.transaction_retries
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_retries_updated_at();

-- Commentaire
COMMENT ON FUNCTION update_transaction_retries_updated_at() IS 'Met à jour automatiquement updated_at lors de la modification d''un enregistrement transaction_retries';

