-- =========================================================
-- Migration : Activation Realtime pour la table notifications
-- Date : 2 Février 2025
-- Description : Ajoute la table notifications à la publication supabase_realtime
-- =========================================================

-- Vérifier si la publication existe et ajouter la table notifications
DO $$
BEGIN
  -- Vérifier si la table notifications existe dans la publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    -- Ajouter la table à la publication Realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    
    RAISE NOTICE 'Table notifications ajoutée à la publication supabase_realtime';
  ELSE
    RAISE NOTICE 'Table notifications déjà présente dans la publication supabase_realtime';
  END IF;
END $$;

-- Configurer REPLICA IDENTITY pour Realtime
-- REPLICA IDENTITY FULL permet de répliquer toutes les colonnes lors des changements
-- Nécessaire pour certaines versions de Supabase/PostgreSQL
DO $$
BEGIN
  -- Vérifier la REPLICA IDENTITY actuelle
  IF EXISTS (
    SELECT 1 
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = 'notifications'
  ) THEN
    -- Définir REPLICA IDENTITY FULL si ce n'est pas déjà le cas
    -- Cela garantit que toutes les colonnes sont disponibles dans les événements Realtime
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;
    
    RAISE NOTICE 'REPLICA IDENTITY FULL configurée pour la table notifications';
  END IF;
END $$;

-- Commentaires
COMMENT ON TABLE public.notifications IS 
'Table de notifications avec Realtime activé pour les mises à jour en temps réel';

-- Vérification : Afficher les tables dans la publication Realtime
-- (Pour debug, peut être commenté en production)
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' 
-- AND tablename = 'notifications';

