-- =========================================================
-- Migration : Table API Keys pour API Publique
-- Date : 28/02/2025
-- Description : Table pour gérer les clés API de l'API publique
-- =========================================================

-- Table pour stocker les clés API
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Clé API (hashée pour sécurité)
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- Premiers 8 caractères pour affichage (ex: "pk_live_ab")
  
  -- Nom et description
  name TEXT NOT NULL,
  description TEXT,
  
  -- Permissions (JSONB pour flexibilité)
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_store_id ON public.api_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active) WHERE is_active = true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_keys_updated_at ON public.api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their API keys" ON public.api_keys;

-- Policy: Les utilisateurs peuvent voir leurs clés API
CREATE POLICY "Users can view their API keys"
  ON public.api_keys
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent créer des clés API
CREATE POLICY "Users can create API keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = api_keys.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent modifier leurs clés API
CREATE POLICY "Users can update their API keys"
  ON public.api_keys
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer leurs clés API
CREATE POLICY "Users can delete their API keys"
  ON public.api_keys
  FOR DELETE
  USING (user_id = auth.uid());

-- Fonction pour générer une clé API
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'pk_live')
RETURNS TEXT AS $$
DECLARE
  random_part TEXT;
  full_key TEXT;
BEGIN
  -- Générer une partie aléatoire (32 caractères)
  random_part := encode(gen_random_bytes(16), 'hex');
  full_key := prefix || '_' || random_part;
  RETURN full_key;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une clé API (avec hash)
CREATE OR REPLACE FUNCTION create_api_key(
  p_user_id UUID,
  p_store_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_permissions JSONB DEFAULT '{}'::jsonb,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  key TEXT,
  key_prefix TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_key TEXT;
  v_key_hash TEXT;
  v_key_prefix TEXT;
  v_id UUID;
BEGIN
  -- Générer la clé
  v_key := generate_api_key();
  v_key_prefix := substring(v_key, 1, 12); -- "pk_live_ab"
  
  -- Hasher la clé (utiliser crypt pour le hash)
  v_key_hash := encode(digest(v_key, 'sha256'), 'hex');
  
  -- Insérer dans la table
  INSERT INTO public.api_keys (
    user_id,
    store_id,
    key_hash,
    key_prefix,
    name,
    description,
    permissions,
    expires_at
  ) VALUES (
    p_user_id,
    p_store_id,
    v_key_hash,
    v_key_prefix,
    p_name,
    p_description,
    p_permissions,
    p_expires_at
  ) RETURNING api_keys.id INTO v_id;
  
  -- Retourner la clé (affichée une seule fois)
  RETURN QUERY
  SELECT
    v_id,
    v_key,
    v_key_prefix,
    p_name,
    now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier une clé API (utilisée par l'Edge Function)
CREATE OR REPLACE FUNCTION verify_api_key(p_key TEXT)
RETURNS TABLE (
  user_id UUID,
  store_id UUID,
  permissions JSONB
) AS $$
DECLARE
  v_key_hash TEXT;
BEGIN
  -- Hasher la clé fournie
  v_key_hash := encode(digest(p_key, 'sha256'), 'hex');
  
  -- Vérifier et retourner les infos
  RETURN QUERY
  SELECT
    api_keys.user_id,
    api_keys.store_id,
    api_keys.permissions
  FROM public.api_keys
  WHERE api_keys.key_hash = v_key_hash
    AND api_keys.is_active = true
    AND (api_keys.expires_at IS NULL OR api_keys.expires_at > now());
  
  -- Mettre à jour last_used_at
  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE key_hash = v_key_hash
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.api_keys IS 'Clés API pour l''API publique Emarzona';
COMMENT ON FUNCTION generate_api_key IS 'Génère une nouvelle clé API';
COMMENT ON FUNCTION create_api_key IS 'Crée une nouvelle clé API et retourne la clé (affichée une seule fois)';
COMMENT ON FUNCTION verify_api_key IS 'Vérifie une clé API et retourne les permissions associées';

