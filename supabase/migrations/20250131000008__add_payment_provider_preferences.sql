-- Migration: Ajout des préférences de provider de paiement
-- Date: 31 Janvier 2025
-- Description: Ajoute les colonnes pour les préférences de provider de paiement

-- Ajouter la préférence de provider dans profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'payment_provider_preference'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN payment_provider_preference TEXT DEFAULT 'moneroo'
    CHECK (payment_provider_preference IN ('moneroo'));
    
    COMMENT ON COLUMN public.profiles.payment_provider_preference IS 'Préférence de provider de paiement de l''utilisateur (moneroo)';
  END IF;
END $$;

-- Ajouter les providers activés dans stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'enabled_payment_providers'
  ) THEN
    ALTER TABLE public.stores
    ADD COLUMN enabled_payment_providers TEXT[] DEFAULT ARRAY['moneroo']::TEXT[];
    
    COMMENT ON COLUMN public.stores.enabled_payment_providers IS 'Liste des providers de paiement activés pour cette boutique (moneroo)';
  END IF;
END $$;

-- Créer un index pour les recherches par préférence
CREATE INDEX IF NOT EXISTS idx_profiles_payment_provider_preference 
ON public.profiles(payment_provider_preference) 
WHERE payment_provider_preference IS NOT NULL;

-- Créer un index pour les recherches par providers activés
CREATE INDEX IF NOT EXISTS idx_stores_enabled_payment_providers 
ON public.stores USING GIN(enabled_payment_providers);







