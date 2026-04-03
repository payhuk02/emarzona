-- Ajouter la colonne is_featured à la table products
-- Cette colonne permet de marquer des produits comme étant en vedette

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Créer un index pour améliorer les performances des requêtes filtrées par is_featured
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN public.products.is_featured IS 'Indique si le produit est mis en vedette sur le marketplace';








