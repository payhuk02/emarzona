-- ============================================================
-- Migration : Table user_drafts pour sauvegarde brouillons
-- Date : 31 Janvier 2025
-- Description : Permet de sauvegarder les brouillons de produits sur le serveur
-- ============================================================

-- Créer la table user_drafts
CREATE TABLE IF NOT EXISTS public.user_drafts (
  id TEXT PRIMARY KEY, -- ID composite: user_id_store_id_draft_type
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL, -- 'artist_product', 'digital_product', 'physical_product', etc.
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  step INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON public.user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_store_id ON public.user_drafts(store_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_draft_type ON public.user_drafts(draft_type);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_store_type ON public.user_drafts(user_id, store_id, draft_type);
CREATE INDEX IF NOT EXISTS idx_user_drafts_updated_at ON public.user_drafts(updated_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger de manière idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'user_drafts_updated_at'
    AND tgrelid = 'public.user_drafts'::regclass
  ) THEN
    CREATE TRIGGER user_drafts_updated_at
      BEFORE UPDATE ON public.user_drafts
      FOR EACH ROW
      EXECUTE FUNCTION update_user_drafts_updated_at();
  END IF;
END $$;

-- RLS (Row Level Security)
ALTER TABLE public.user_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres brouillons
DROP POLICY IF EXISTS "Users can view their own drafts" ON public.user_drafts;
CREATE POLICY "Users can view their own drafts"
  ON public.user_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres brouillons
DROP POLICY IF EXISTS "Users can create their own drafts" ON public.user_drafts;
CREATE POLICY "Users can create their own drafts"
  ON public.user_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leurs propres brouillons
DROP POLICY IF EXISTS "Users can update their own drafts" ON public.user_drafts;
CREATE POLICY "Users can update their own drafts"
  ON public.user_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres brouillons
DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.user_drafts;
CREATE POLICY "Users can delete their own drafts"
  ON public.user_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Fonction pour nettoyer les anciens brouillons (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_drafts
  WHERE updated_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Commentaires
COMMENT ON TABLE public.user_drafts IS 'Table pour sauvegarder les brouillons de produits des utilisateurs';
COMMENT ON COLUMN public.user_drafts.id IS 'ID composite: user_id_store_id_draft_type';
COMMENT ON COLUMN public.user_drafts.draft_type IS 'Type de brouillon: artist_product, digital_product, physical_product, etc.';
COMMENT ON COLUMN public.user_drafts.draft_data IS 'Données du brouillon au format JSONB';
COMMENT ON COLUMN public.user_drafts.step IS 'Étape actuelle du wizard';

