-- =========================================================
-- Migration : Restauration du système multi-stores (3 boutiques max)
-- Date : 2 Février 2025
-- Description : Restaure la limite de 3 boutiques par utilisateur
--               pour permettre le système multi-stores complet
-- =========================================================

-- Modifier la fonction pour limiter à 3 boutiques par utilisateur
CREATE OR REPLACE FUNCTION check_store_limit()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  store_count INTEGER;
BEGIN
  -- Count existing stores for this user
  SELECT COUNT(*) INTO store_count
  FROM public.stores
  WHERE user_id = NEW.user_id;
  
  -- Enforce limit of 3 stores per user
  IF store_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d''en créer une nouvelle.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS enforce_store_limit ON public.stores;

-- Create trigger to enforce limit on INSERT
CREATE TRIGGER enforce_store_limit
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION check_store_limit();

-- Add comment for documentation
COMMENT ON FUNCTION check_store_limit() IS 'Enforces the maximum limit of 3 stores per user before allowing a new store to be created';
COMMENT ON TRIGGER enforce_store_limit ON public.stores IS 'Prevents users from creating more than 3 stores by checking the count before insert';

