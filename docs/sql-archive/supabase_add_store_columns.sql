-- ============================================================
-- Ajout des colonnes manquantes à la table stores
-- Payhuk - Informations de contact et réseaux sociaux
-- ============================================================

-- Ajouter la colonne "about" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'about'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN about TEXT;
    RAISE NOTICE 'Colonne "about" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "about" existe déjà';
  END IF;
END $$;

-- Ajouter la colonne "contact_email" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'Colonne "contact_email" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "contact_email" existe déjà';
  END IF;
END $$;

-- Ajouter la colonne "contact_phone" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN contact_phone TEXT;
    RAISE NOTICE 'Colonne "contact_phone" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "contact_phone" existe déjà';
  END IF;
END $$;

-- Ajouter la colonne "facebook_url" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN facebook_url TEXT;
    RAISE NOTICE 'Colonne "facebook_url" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "facebook_url" existe déjà';
  END IF;
END $$;

-- Ajouter la colonne "instagram_url" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN instagram_url TEXT;
    RAISE NOTICE 'Colonne "instagram_url" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "instagram_url" existe déjà';
  END IF;
END $$;

-- Ajouter la colonne "twitter_url" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN twitter_url TEXT;
    RAISE NOTICE 'Colonne "twitter_url" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "twitter_url" existe déjà';
  END IF;
END $$;

-- Ajouter la colonne "linkedin_url" si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN linkedin_url TEXT;
    RAISE NOTICE 'Colonne "linkedin_url" ajoutée';
  ELSE
    RAISE NOTICE 'Colonne "linkedin_url" existe déjà';
  END IF;
END $$;

-- Vérifier toutes les colonnes de la table stores
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'stores'
ORDER BY ordinal_position;

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colonnes ajoutées avec succès à la table stores !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Nouvelles colonnes :';
  RAISE NOTICE '  - about: Texte long pour "À propos de la boutique"';
  RAISE NOTICE '  - contact_email: Email de contact';
  RAISE NOTICE '  - contact_phone: Numéro de téléphone';
  RAISE NOTICE '  - facebook_url: Lien Facebook';
  RAISE NOTICE '  - instagram_url: Lien Instagram';
  RAISE NOTICE '  - twitter_url: Lien Twitter/X';
  RAISE NOTICE '  - linkedin_url: Lien LinkedIn';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Vous pouvez maintenant mettre à jour toutes les informations de votre boutique !';
  RAISE NOTICE '';
END $$;

