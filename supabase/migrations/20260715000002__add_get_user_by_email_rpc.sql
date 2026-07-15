-- Fonction pour récupérer le user_id par email pour l'invitation de membre
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_address TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  found_user_id UUID;
BEGIN
  SELECT id INTO found_user_id FROM auth.users WHERE email = email_address;
  RETURN found_user_id;
END;
$$;
