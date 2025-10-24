-- =========================================================
-- Fonction RPC pour récupérer les emails des utilisateurs
-- Utilisée par la page Admin Users pour afficher les emails
-- =========================================================

-- Fonction pour récupérer l'email d'un utilisateur via son user_id
CREATE OR REPLACE FUNCTION get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id;
$$;

-- Fonction pour récupérer les emails de plusieurs utilisateurs
-- Retourne une table avec user_id et email
CREATE OR REPLACE FUNCTION get_users_emails(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE id = ANY(p_user_ids);
$$;

-- Grant access à authenticated users
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_emails(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_user_email IS 'Récupère l''email d''un utilisateur depuis auth.users';
COMMENT ON FUNCTION get_users_emails IS 'Récupère les emails de plusieurs utilisateurs depuis auth.users';

-- =========================================================
-- FIN MIGRATION
-- =========================================================

