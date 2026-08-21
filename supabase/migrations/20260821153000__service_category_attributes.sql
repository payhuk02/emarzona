-- Store per-category wizard attributes on the service product.

ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS category_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.service_products.category_attributes IS
  'Champs métier du profil catégorie / sous-catégorie (wizard Services).';
