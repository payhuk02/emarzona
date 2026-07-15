CREATE OR REPLACE FUNCTION public.accept_store_invitation(_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member RECORD;
BEGIN
  -- Trouver l'invitation par token (sans filtrer par utilisateur pour l'instant)
  SELECT * INTO _member
  FROM public.store_members
  WHERE invitation_token = _token
  LIMIT 1;

  IF _member IS NULL THEN
    RETURN 'ERROR: Ce jeton n''existe pas dans la base de données.';
  END IF;

  IF _member.status != 'pending' THEN
    RETURN 'ERROR: Cette invitation a déjà été acceptée ou annulée (statut: ' || _member.status || ').';
  END IF;

  IF _member.invitation_expires_at <= now() THEN
    RETURN 'ERROR: L''invitation a expiré.';
  END IF;

  IF _member.user_id != auth.uid() THEN
    RETURN 'ERROR: L''invitation a été envoyée à un autre compte. Vous êtes connecté avec un identifiant différent de celui de l''invité.';
  END IF;

  -- Mettre à jour le statut
  UPDATE public.store_members
  SET 
    status = 'active',
    joined_at = now(),
    invitation_token = NULL
  WHERE id = _member.id;

  RETURN _member.store_id::TEXT;
END;
$$;
