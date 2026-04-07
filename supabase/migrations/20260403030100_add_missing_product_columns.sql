-- ================================================================
-- Ajouter les colonnes manquantes à la table products
-- ================================================================
-- Ce script ajoute les colonnes optionnelles qui améliorent
-- la fonctionnalité du marketplace (rating, reviews, promo)
-- ================================================================

-- Ajouter rating (note moyenne du produit)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0 
CHECK (rating >= 0 AND rating <= 5);

-- Ajouter reviews_count (nombre d'avis)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Ajouter promotional_price (prix promotionnel)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promotional_price NUMERIC;

-- Ajouter short_description (description courte)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Ajouter tags (étiquettes pour filtrage)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);

-- Commentaires
COMMENT ON COLUMN public.products.rating IS 'Note moyenne du produit (0-5 étoiles)';
COMMENT ON COLUMN public.products.reviews_count IS 'Nombre total d''avis sur le produit';
COMMENT ON COLUMN public.products.promotional_price IS 'Prix promotionnel actif (si inférieur au prix normal)';
COMMENT ON COLUMN public.products.short_description IS 'Description courte affichée dans les cartes produit';
COMMENT ON COLUMN public.products.tags IS 'Tags pour filtrage et recherche (ex: ["Nouveau", "Populaire"])';

