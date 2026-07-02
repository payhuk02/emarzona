-- Migration: Création de la table user_comparisons pour le Cloud-Sync du comparateur
-- Permet aux utilisateurs authentifiés de sauvegarder leurs comparaisons entre sessions.

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS public.user_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte d'unicité pour n'avoir qu'une seule liste de comparaison par utilisateur
    CONSTRAINT user_comparisons_user_id_key UNIQUE (user_id)
);

-- 2. Index pour la performance
CREATE INDEX IF NOT EXISTS idx_user_comparisons_user_id ON public.user_comparisons(user_id);

-- 3. Trigger pour mettre à jour automatiquement le updated_at
-- S'assure que le trigger moddatetime existe
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_comparisons;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.user_comparisons
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- 4. Row Level Security (RLS)
ALTER TABLE public.user_comparisons ENABLE ROW LEVEL SECURITY;

-- Politique de LECTURE : L'utilisateur peut lire uniquement ses propres comparaisons
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres comparaisons" ON public.user_comparisons;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres comparaisons" 
ON public.user_comparisons FOR SELECT 
USING (auth.uid() = user_id);

-- Politique d'INSERTION : L'utilisateur peut créer sa propre liste
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs comparaisons" ON public.user_comparisons;
CREATE POLICY "Les utilisateurs peuvent créer leurs comparaisons" 
ON public.user_comparisons FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique de MISE À JOUR : L'utilisateur peut mettre à jour sa liste
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs comparaisons" ON public.user_comparisons;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs comparaisons" 
ON public.user_comparisons FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Politique de SUPPRESSION : L'utilisateur peut supprimer sa liste
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs comparaisons" ON public.user_comparisons;
CREATE POLICY "Les utilisateurs peuvent supprimer leurs comparaisons" 
ON public.user_comparisons FOR DELETE 
USING (auth.uid() = user_id);
