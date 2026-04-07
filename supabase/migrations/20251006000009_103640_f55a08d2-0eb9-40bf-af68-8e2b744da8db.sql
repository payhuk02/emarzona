-- Add pricing model enum
CREATE TYPE pricing_model AS ENUM (
  'one-time',
  'subscription',
  'pay-what-you-want',
  'free'
);

-- Add new columns to products table for advanced features
ALTER TABLE products
ADD COLUMN IF NOT EXISTS pricing_model pricing_model DEFAULT 'one-time',
ADD COLUMN IF NOT EXISTS promotional_price numeric,
ADD COLUMN IF NOT EXISTS automatic_discount_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_trigger text,
ADD COLUMN IF NOT EXISTS sale_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS sale_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS post_purchase_guide_url text,
ADD COLUMN IF NOT EXISTS password_protected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS product_password text,
ADD COLUMN IF NOT EXISTS watermark_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS purchase_limit integer,
ADD COLUMN IF NOT EXISTS hide_from_store boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_purchase_count boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_shipping_address boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS downloadable_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS og_image text,
ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN products.pricing_model IS 'Type de tarification: paiement unique, abonnement, prix libre, gratuit';
COMMENT ON COLUMN products.custom_fields IS 'Champs personnalisés définis par l''utilisateur';
COMMENT ON COLUMN products.faqs IS 'Questions fréquentes liées au produit';
COMMENT ON COLUMN products.images IS 'URLs des images du produit';
COMMENT ON COLUMN products.downloadable_files IS 'Fichiers téléchargeables (PDF, ZIP, vidéos, etc.)';
COMMENT ON COLUMN products.is_draft IS 'Si true, le produit est en brouillon et non publié';