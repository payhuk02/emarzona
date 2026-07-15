-- 1. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.accept_store_invitation(text);

-- 2. Créer la nouvelle fonction
CREATE OR REPLACE FUNCTION public.accept_store_invitation(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member_id UUID;
  _store_id UUID;
BEGIN
  -- Vérifier que le token existe et n'est pas expiré
  SELECT id, store_id INTO _member_id, _store_id
  FROM public.store_members
  WHERE invitation_token = _token
  AND status = 'pending'
  AND invitation_expires_at > now()
  AND user_id = auth.uid()
  LIMIT 1;

  IF _member_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Mettre à jour le statut
  UPDATE public.store_members
  SET 
    status = 'active',
    joined_at = now(),
    invitation_token = NULL
  WHERE id = _member_id;

  RETURN _store_id;
END;
$$;

COMMENT ON FUNCTION public.accept_store_invitation IS 'Accepte une invitation à rejoindre une boutique et retourne le store_id rejoint';
