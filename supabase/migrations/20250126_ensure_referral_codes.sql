-- Migration pour s'assurer que tous les profils ont un code de parrainage
-- Cette migration garantit qu'aucun utilisateur n'a un referral_code NULL

-- Mettre à jour tous les profils sans code de parrainage
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL OR referral_code = '';

-- Ajouter une contrainte pour empêcher les codes vides (si pas déjà fait)
DO $$
BEGIN
  -- Vérifier et ajouter la contrainte CHECK si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_referral_code_not_empty'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referral_code_not_empty
    CHECK (referral_code IS NOT NULL AND referral_code != '');
  END IF;
END $$;

-- Ajouter un trigger de sécurité pour garantir qu'un code est toujours généré
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le code est NULL ou vide, en générer un
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Créer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON public.profiles;
CREATE TRIGGER ensure_referral_code_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_referral_code();

-- Commentaires
COMMENT ON FUNCTION public.ensure_referral_code() IS 'Garantit qu''un code de parrainage est toujours présent lors de l''insertion ou mise à jour d''un profil';
COMMENT ON TRIGGER ensure_referral_code_trigger ON public.profiles IS 'Garantit qu''un code de parrainage est toujours généré si manquant';

