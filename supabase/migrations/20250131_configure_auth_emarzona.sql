-- =========================================================
-- Migration : Configuration Auth Supabase pour emarzona.com
-- Date : 31/01/2025
-- Description : Configure les paramètres d'authentification Supabase
--               pour le domaine emarzona.com
-- =========================================================

-- Cette migration ne contient pas de commandes SQL directes
-- car les paramètres d'authentification Supabase sont configurés
-- via l'interface web du dashboard Supabase.

-- =========================================================
-- INSTRUCTIONS POUR LA CONFIGURATION VIA DASHBOARD
-- =========================================================

/*
=== CONFIGURATION AUTH SUPABASE POUR emarzona.com ===

1. Aller dans Supabase Dashboard → Authentication → Settings

2. **Site URL**
   - Valeur : https://emarzona.com

3. **Redirect URLs (après authentification)**
   - https://emarzona.com/auth/callback
   - https://emarzona.com
   - https://emarzona.com/dashboard

4. **JWT Expiry**
   - Access Token : 3600 secondes (1 heure)
   - Refresh Token : 604800 secondes (7 jours)

5. **Email Templates (optionnel)**
   - Site URL : https://emarzona.com
   - From Email : noreply@emarzona.com

6. **Social Providers (si utilisés)**
   - Google OAuth : Authorized redirect URIs
     * https://emarzona.com/auth/callback
   - GitHub OAuth : Authorization callback URL
     * https://emarzona.com/auth/callback

=== VÉRIFICATION ===

Après configuration, tester :
- Connexion utilisateur : https://emarzona.com/auth/login
- Inscription : https://emarzona.com/auth/register
- Callback OAuth : https://emarzona.com/auth/callback

=== VARIABLES D'ENVIRONNEMENT ===

Dans Supabase → Edge Functions → Secrets :
- SITE_URL=https://emarzona.com

*/

-- =========================================================
-- LOG DE MIGRATION
-- =========================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 20250131_configure_auth_emarzona.sql exécutée';
    RAISE NOTICE 'Vérifiez que les paramètres d''authentification Supabase sont configurés pour https://emarzona.com';
    RAISE NOTICE 'Consultez les instructions dans les commentaires de cette migration';
END $$;
