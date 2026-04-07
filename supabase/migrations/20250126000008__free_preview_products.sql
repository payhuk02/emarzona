-- Migration pour ajouter le système de produits gratuits preview
-- Permet de créer un produit gratuit qui présente un aperçu du contenu payant
-- Date: 2025-01-26

-- Ajouter colonnes pour lier produits preview et payants
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS free_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS paid_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preview_content_description TEXT;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_free_product_id ON public.products(free_product_id);
CREATE INDEX IF NOT EXISTS idx_products_paid_product_id ON public.products(paid_product_id);
CREATE INDEX IF NOT EXISTS idx_products_is_free_preview ON public.products(is_free_preview) WHERE is_free_preview = true;

-- Commentaires
COMMENT ON COLUMN public.products.free_product_id IS 'Référence vers le produit gratuit preview (si ce produit est payant et a un preview)';
COMMENT ON COLUMN public.products.paid_product_id IS 'Référence vers le produit payant complet (si ce produit est un preview gratuit)';
COMMENT ON COLUMN public.products.is_free_preview IS 'Indique si ce produit est une version gratuite preview d''un produit payant';
COMMENT ON COLUMN public.products.preview_content_description IS 'Description du contenu inclus dans la version preview (ex: "Chapitres 1-3 sur 10")';

-- Constrainte pour s'assurer qu'un produit ne peut pas être à la fois preview et payant avec preview
ALTER TABLE public.products
ADD CONSTRAINT products_preview_logic CHECK (
  (is_free_preview = FALSE) OR 
  (is_free_preview = TRUE AND paid_product_id IS NOT NULL AND pricing_model = 'free')
);

-- Fonction pour créer automatiquement un produit preview
CREATE OR REPLACE FUNCTION public.create_free_preview_product(
  p_paid_product_id UUID,
  p_preview_content_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_product RECORD;
  v_preview_product_id UUID;
BEGIN
  -- Récupérer les données du produit payant
  SELECT * INTO v_paid_product
  FROM products
  WHERE id = p_paid_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit payant non trouvé';
  END IF;

  -- Créer le produit preview gratuit
  INSERT INTO products (
    store_id,
    name,
    slug,
    description,
    short_description,
    price,
    pricing_model,
    currency,
    product_type,
    category,
    image_url,
    images,
    downloadable_files,
    is_active,
    is_draft,
    is_free_preview,
    paid_product_id,
    preview_content_description,
    licensing_type,
    license_terms
  )
  SELECT 
    store_id,
    name || ' - Version Preview Gratuite',
    slug || '-preview-free',
    COALESCE(
      p_preview_content_description,
      'Version preview gratuite de "' || name || '". Contient un aperçu du contenu complet disponible dans la version payante.'
    ),
    short_description || ' (Version Preview)',
    0,
    'free',
    currency,
    product_type,
    category,
    image_url,
    images,
    -- Utiliser seulement les fichiers marqués comme preview
    (
      SELECT jsonb_agg(f)
      FROM jsonb_array_elements(downloadable_files) f
      WHERE f->>'is_preview' = 'true' OR f->>'requires_purchase' = 'false'
    ),
    is_active,
    false, -- Preview n'est pas un draft
    true,
    p_paid_product_id,
    p_preview_content_description,
    licensing_type,
    license_terms
  FROM products
  WHERE id = p_paid_product_id
  RETURNING id INTO v_preview_product_id;

  -- Lier le produit payant au preview
  UPDATE products
  SET free_product_id = v_preview_product_id
  WHERE id = p_paid_product_id;

  RETURN v_preview_product_id;
END;
$$;

COMMENT ON FUNCTION public.create_free_preview_product IS 'Crée automatiquement un produit gratuit preview à partir d''un produit payant';

