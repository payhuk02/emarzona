-- Migration: Enforce Store Limit Trigger
-- Date: 2026-01-20
-- Description: Ajoute un trigger pour garantir la limite de 3 boutiques par utilisateur au niveau DB
-- 
-- AMÉLIORATION SÉCURITÉ: Empêche les race conditions et contournements côté client

-- Fonction pour vérifier la limite de boutiques
CREATE OR REPLACE FUNCTION check_store_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_count INTEGER;
BEGIN
  -- Compter les boutiques existantes pour cet utilisateur
  SELECT COUNT(*) INTO store_count
  FROM stores
  WHERE user_id = NEW.user_id;
  
  -- Vérifier la limite (3 boutiques max)
  IF store_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d''en créer une nouvelle.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger avant INSERT
DROP TRIGGER IF EXISTS enforce_store_limit_trigger ON stores;
CREATE TRIGGER enforce_store_limit_trigger
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION check_store_limit();

-- Commentaire pour documentation
COMMENT ON FUNCTION check_store_limit() IS 
'Vérifie que l''utilisateur ne dépasse pas la limite de 3 boutiques avant insertion';

COMMENT ON TRIGGER enforce_store_limit_trigger ON stores IS 
'Garantit la limite de 3 boutiques par utilisateur au niveau base de données';
