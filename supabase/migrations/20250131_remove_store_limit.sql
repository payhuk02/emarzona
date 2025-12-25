-- =========================================================
-- Migration : Suppression de la limite de 3 boutiques
-- Date : 31 Janvier 2025
-- Description : Supprime le trigger qui limite à 3 boutiques par utilisateur
--               et modifie la fonction pour limiter à 1 boutique par utilisateur
-- =========================================================

-- Supprimer le trigger existant
DROP TRIGGER IF EXISTS enforce_store_limit ON public.stores;

-- Modifier la fonction pour limiter à 1 boutique par utilisateur
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
  
  -- Enforce limit of 1 store per user
  IF store_count >= 1 THEN
    RAISE EXCEPTION 'Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur. Supprimez votre boutique existante si vous souhaitez en créer une nouvelle.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger avec la nouvelle limite
CREATE TRIGGER enforce_store_limit
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION check_store_limit();

-- Mettre à jour les commentaires
COMMENT ON FUNCTION check_store_limit() IS 'Enforces the limit of 1 store per user before allowing a new store to be created';
COMMENT ON TRIGGER enforce_store_limit ON public.stores IS 'Prevents users from creating more than 1 store by checking the count before insert';


