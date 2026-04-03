-- Migration corrigée: Tables pour le système offline-first
-- Date: 2025-01-20
-- Description: Ajout des tables nécessaires pour la synchronisation offline-first

-- =================================================
-- TABLE: idempotency_keys
-- =================================================

-- Supprimer la table si elle existe déjà (pour éviter les conflits)
DROP TABLE IF EXISTS idempotency_keys CASCADE;

-- Créer la table idempotency_keys
CREATE TABLE idempotency_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commentaire sur la table
COMMENT ON TABLE idempotency_keys IS 'Clés d''idempotency pour éviter les doublons dans les actions synchronisées';

-- =================================================
-- INDEX: Optimisations de performance
-- =================================================

-- Index sur la clé (recherche rapide)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);

-- Index sur user_id (filtrage par utilisateur)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);

-- Index sur created_at (nettoyage des anciennes clés)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Index composite (recherche par utilisateur + date)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_created ON idempotency_keys(user_id, created_at);

-- =================================================
-- INDEX: Optimisations de performance
-- =================================================

-- Index sur la clé (recherche rapide)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);

-- Index sur user_id (filtrage par utilisateur)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);

-- Index sur created_at (nettoyage des anciennes clés)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Index composite (recherche par utilisateur + date)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_created ON idempotency_keys(user_id, created_at);

-- =================================================
-- RLS: Row Level Security
-- =================================================

-- Activer RLS
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs ne peuvent voir que leurs propres clés
CREATE POLICY "Users can view their own idempotency keys" ON idempotency_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent créer leurs propres clés
CREATE POLICY "Users can create their own idempotency keys" ON idempotency_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique: les utilisateurs ne peuvent voir que leurs propres clés
CREATE POLICY "Users can view their own idempotency keys" ON idempotency_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent créer leurs propres clés
CREATE POLICY "Users can create their own idempotency keys" ON idempotency_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =================================================
-- FONCTIONS UTILITAIRES
-- =================================================

-- Fonction pour nettoyer les clés expirées
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les clés de plus de 24 heures (selon la logique métier)
  DELETE FROM idempotency_keys
  WHERE created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION cleanup_expired_idempotency_keys() IS 'Nettoie les clés d''idempotency expirées (plus de 24h)';

-- =================================================
-- VÉRIFICATIONS ET EXTENSIONS
-- =================================================

-- Vérifier que les extensions nécessaires sont disponibles
DO $$
BEGIN
  -- Vérifier l'extension uuid-ossp (devrait être disponible par défaut dans Supabase)
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
  ) THEN
    RAISE NOTICE 'Extension uuid-ossp may be needed for gen_random_uuid()';
  END IF;
END $$;

-- =================================================
-- TESTS ET VALIDATION
-- =================================================

-- Insérer une clé de test pour valider le fonctionnement
-- (Ceci sera supprimé en production)
/*
INSERT INTO idempotency_keys (key, action_type, user_id)
VALUES ('test_key_123', 'test_action', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (key) DO NOTHING;
*/