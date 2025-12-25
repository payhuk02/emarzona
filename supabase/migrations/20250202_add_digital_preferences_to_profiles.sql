-- Migration: Ajout de la colonne digital_preferences à profiles
-- Date: 2 Février 2025
-- Description: Ajoute la colonne digital_preferences (JSONB) pour stocker les préférences des produits digitaux

-- Ajouter la colonne digital_preferences si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'digital_preferences'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN digital_preferences JSONB DEFAULT '{}'::jsonb;
    
    COMMENT ON COLUMN public.profiles.digital_preferences IS 'Préférences utilisateur pour les produits digitaux (notifications, téléchargements automatiques, etc.)';
  END IF;
END $$;

-- Créer un index GIN pour les recherches dans digital_preferences
CREATE INDEX IF NOT EXISTS idx_profiles_digital_preferences 
ON public.profiles USING GIN(digital_preferences) 
WHERE digital_preferences IS NOT NULL;

