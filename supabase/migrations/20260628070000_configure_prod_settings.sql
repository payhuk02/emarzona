-- ==============================================================================
-- 🌐 Phase Finale: Configuration Production (Settings & Cache)
-- ==============================================================================
-- Configure les variables personnalisées PostgreSQL nécessaires au bon fonctionnement
-- des triggers de cache et du cron DLQ en production.
--
-- ⚠️ IMPORTANT: Remplacez <YOUR_SERVICE_ROLE_KEY> par votre vraie clé avant d'appliquer.
-- ==============================================================================

-- 1. URL Supabase pour les appels HTTP internes (pg_net)
ALTER DATABASE postgres SET custom.supabase_url = 'https://hbdnzajbyjakdhuavrvb.supabase.co';

-- 2. Clé Service Role pour l'authentification des appels internes
-- ⚠️ SÉCURITÉ: Cette clé donne un accès ADMIN complet à la base de données.
-- En production, considérez l'utilisation de Supabase Vault pour la stocker.
-- Décommentez et remplacez la valeur ci-dessous :
-- ALTER DATABASE postgres SET custom.service_role_key = '<YOUR_SERVICE_ROLE_KEY>';

-- 3. Recharger la configuration pour que les changements prennent effet immédiatement
SELECT pg_reload_conf();
