-- Digital Product Bundles System - Clean Version for Supabase Dashboard
-- Date: 2025-10-29

-- Drop existing types
DROP TYPE IF EXISTS bundle_discount_type CASCADE;
DROP TYPE IF EXISTS bundle_status CASCADE;

-- Create ENUMS
CREATE TYPE bundle_discount_type AS ENUM ('percentage', 'fixed', 'custom');
CREATE TYPE bundle_status AS ENUM ('draft', 'active', 'inactive', 'scheduled', 'expired');

-- Drop existing tables
DROP TABLE IF EXISTS public.digital_bundle_items CASCADE;
DROP TABLE IF EXISTS public.digital_bundles CASCADE;

-- Create digital_bundles table
CREATE TABLE public.digital_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  image_url TEXT,
  banner_url TEXT,
  
  status bundle_status NOT NULL DEFAULT 'draft',
  
  original_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bundle_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_type bundle_discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  savings NUMERIC(10, 2) GENERATED ALWAYS AS (original_price - bundle_price) STORED,
  savings_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN original_price > 0 THEN ((original_price - bundle_price) / original_price * 100)
      ELSE 0
    END
  ) STORED,
  
  is_available BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  max_purchases INTEGER,
  current_purchases INTEGER DEFAULT 0,
  
  auto_generate_licenses BOOLEAN DEFAULT true,
  license_duration_days INTEGER,
  
  download_limit INTEGER DEFAULT 10,
  download_expiry_days INTEGER DEFAULT 60,
  
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5, 2) DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  features JSONB DEFAULT '[]'::jsonb,
  includes JSONB DEFAULT '[]'::jsonb,
  
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  highlight_text TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  
  CONSTRAINT unique_store_bundle_slug UNIQUE (store_id, slug),
  CONSTRAINT valid_prices CHECK (bundle_price >= 0 AND original_price >= 0),
  CONSTRAINT valid_discount CHECK (discount_value >= 0),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date),
  CONSTRAINT valid_max_purchases CHECK (max_purchases IS NULL OR max_purchases > 0)
);

-- Create digital_bundle_items table
CREATE TABLE public.digital_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.digital_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  order_index INTEGER NOT NULL DEFAULT 0,
  product_price NUMERIC(10, 2) NOT NULL,
  
  is_visible BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  highlight_text TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_bundle_product UNIQUE (bundle_id, product_id),
  CONSTRAINT valid_order_index CHECK (order_index >= 0)
);

-- Create indexes
CREATE INDEX idx_bundles_store_id ON public.digital_bundles(store_id);
CREATE INDEX idx_bundles_status ON public.digital_bundles(status);
CREATE INDEX idx_bundles_slug ON public.digital_bundles(store_id, slug);
CREATE INDEX idx_bundles_is_available ON public.digital_bundles(is_available);
CREATE INDEX idx_bundles_start_date ON public.digital_bundles(start_date);
CREATE INDEX idx_bundles_end_date ON public.digital_bundles(end_date);
CREATE INDEX idx_bundles_total_sales ON public.digital_bundles(total_sales DESC);
CREATE INDEX idx_bundles_conversion_rate ON public.digital_bundles(conversion_rate DESC);
CREATE INDEX idx_bundles_is_featured ON public.digital_bundles(is_featured);

CREATE INDEX idx_bundle_items_bundle_id ON public.digital_bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_product_id ON public.digital_bundle_items(product_id);
CREATE INDEX idx_bundle_items_order ON public.digital_bundle_items(bundle_id, order_index);

-- Create functions
CREATE OR REPLACE FUNCTION update_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_digital_bundles_updated_at
  BEFORE UPDATE ON public.digital_bundles
  FOR EACH ROW EXECUTE FUNCTION update_bundles_updated_at();

CREATE OR REPLACE FUNCTION calculate_bundle_original_price(p_bundle_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(product_price), 0)
  INTO v_total
  FROM public.digital_bundle_items
  WHERE bundle_id = p_bundle_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_bundle_pricing()
RETURNS TRIGGER AS $$
DECLARE
  v_bundle RECORD;
  v_original_price NUMERIC;
  v_new_bundle_price NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO v_bundle FROM public.digital_bundles WHERE id = OLD.bundle_id;
  ELSE
    SELECT * INTO v_bundle FROM public.digital_bundles WHERE id = NEW.bundle_id;
  END IF;
  
  v_original_price := calculate_bundle_original_price(v_bundle.id);
  
  CASE v_bundle.discount_type
    WHEN 'percentage' THEN
      v_new_bundle_price := v_original_price * (1 - v_bundle.discount_value / 100);
    WHEN 'fixed' THEN
      v_new_bundle_price := GREATEST(v_original_price - v_bundle.discount_value, 0);
    WHEN 'custom' THEN
      v_new_bundle_price := v_bundle.bundle_price;
    ELSE
      v_new_bundle_price := v_original_price;
  END CASE;
  
  IF v_bundle.discount_type != 'custom' THEN
    UPDATE public.digital_bundles
    SET 
      original_price = v_original_price,
      bundle_price = v_new_bundle_price,
      updated_at = now()
    WHERE id = v_bundle.id;
  ELSE
    UPDATE public.digital_bundles
    SET 
      original_price = v_original_price,
      updated_at = now()
    WHERE id = v_bundle.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bundle_pricing_on_items_change
  AFTER INSERT OR UPDATE OR DELETE ON public.digital_bundle_items
  FOR EACH ROW EXECUTE FUNCTION update_bundle_pricing();

CREATE OR REPLACE FUNCTION generate_bundle_slug(
  p_store_id UUID,
  p_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_counter INTEGER := 0;
  v_final_slug TEXT;
BEGIN
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  v_final_slug := v_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM public.digital_bundles 
    WHERE store_id = p_store_id AND slug = v_final_slug
  ) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_final_slug;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.digital_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Store owners can manage their bundles" ON public.digital_bundles;
CREATE POLICY "Store owners can manage their bundles"
  ON public.digital_bundles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_bundles.store_id
      AND stores.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view available bundles" ON public.digital_bundles;
CREATE POLICY "Anyone can view available bundles"
  ON public.digital_bundles
  FOR SELECT
  USING (
    status = 'active' 
    AND is_available = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

DROP POLICY IF EXISTS "Store owners can manage bundle items" ON public.digital_bundle_items;
CREATE POLICY "Store owners can manage bundle items"
  ON public.digital_bundle_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_bundles b
      INNER JOIN public.stores s ON b.store_id = s.id
      WHERE b.id = digital_bundle_items.bundle_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view items of available bundles" ON public.digital_bundle_items;
CREATE POLICY "Anyone can view items of available bundles"
  ON public.digital_bundle_items
  FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.digital_bundles b
      WHERE b.id = digital_bundle_items.bundle_id
      AND b.status = 'active'
      AND b.is_available = true
    )
  );

-- Create view
CREATE OR REPLACE VIEW digital_bundles_with_stats AS
SELECT 
  b.*,
  COUNT(DISTINCT bi.product_id) as products_count,
  ARRAY_AGG(p.name ORDER BY bi.order_index) FILTER (WHERE p.id IS NOT NULL) as product_names,
  ARRAY_AGG(p.id ORDER BY bi.order_index) FILTER (WHERE p.id IS NOT NULL) as product_ids
FROM public.digital_bundles b
LEFT JOIN public.digital_bundle_items bi ON b.id = bi.bundle_id
LEFT JOIN public.products p ON bi.product_id = p.id
GROUP BY b.id;

-- Comments
COMMENT ON TABLE public.digital_bundles IS 'Bundles de produits digitaux avec pricing configurables';
COMMENT ON TABLE public.digital_bundle_items IS 'Produits individuels inclus dans les bundles';
COMMENT ON FUNCTION calculate_bundle_original_price(UUID) IS 'Calcule le prix original total d un bundle';
COMMENT ON FUNCTION generate_bundle_slug(UUID, TEXT) IS 'Génère un slug unique pour un bundle';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration digital_bundles_clean completed successfully!';
END $$;

