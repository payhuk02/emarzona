-- Ajouter une devise par défaut pour les boutiques
ALTER TABLE public.stores 
ADD COLUMN default_currency TEXT NOT NULL DEFAULT 'XOF';

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.stores.default_currency IS 'Devise par défaut utilisée pour les produits de cette boutique';