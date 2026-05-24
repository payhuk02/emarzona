-- À exécuter une fois dans Supabase Dashboard → SQL Editor
-- Remplacez les valeurs entre <...> par vos secrets réels (ne commitez pas ce fichier modifié).

-- Option A (recommandée) — table private.welcome_email_hook_config
SELECT public.setup_welcome_email_hook(
  p_service_role_key := '<JWT service_role eyJ...>',
  p_edge_internal_secret := '<EDGE_INTERNAL_SECRET>',
  p_supabase_url := 'https://hbdnzajbyjakdhuavrvb.supabase.co'
);

-- Vérification (ne doit pas afficher la clé en prod si vous loggez les résultats)
SELECT
  supabase_url,
  length(service_role_key) AS service_role_key_len,
  edge_internal_secret IS NOT NULL AS has_internal_secret,
  updated_at
FROM private.welcome_email_hook_config
WHERE id = 1;

-- Option B (si votre rôle a les droits ALTER DATABASE)
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = '<JWT service_role eyJ...>';
-- ALTER DATABASE postgres SET app.settings.edge_internal_secret = '<EDGE_INTERNAL_SECRET>';
