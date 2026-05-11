
-- =====================================================
-- MIGRATION 1: PRODUITS DIGITAUX
-- =====================================================

-- Table principale des produits digitaux (extension de products)
CREATE TABLE IF NOT EXISTS public.digital_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  digital_type text DEFAULT 'file',
  license_type text DEFAULT 'single',
  version text DEFAULT '1.0',
  instant_delivery boolean DEFAULT true,
  download_limit integer,
  total_downloads integer DEFAULT 0,
  file_size bigint,
  formats text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fichiers des produits digitaux
CREATE TABLE IF NOT EXISTS public.digital_product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  sort_order integer DEFAULT 0,
  is_preview boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Licences digitales
CREATE TABLE IF NOT EXISTS public.digital_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  license_key text NOT NULL,
  license_type text DEFAULT 'single',
  status text DEFAULT 'active',
  max_activations integer DEFAULT 1,
  current_activations integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Téléchargements
CREATE TABLE IF NOT EXISTS public.customer_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  digital_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  file_id uuid REFERENCES public.digital_product_files(id) ON DELETE SET NULL,
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Versions des produits digitaux
CREATE TABLE IF NOT EXISTS public.digital_product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  changelog text,
  file_url text,
  file_size bigint,
  is_current boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Paramètres d'affiliation par produit
CREATE TABLE IF NOT EXISTS public.product_affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  commission_rate numeric DEFAULT 0,
  affiliate_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_affiliate_settings ENABLE ROW LEVEL SECURITY;

-- Policies digital_products
DROP POLICY IF EXISTS "Digital products viewable by everyone" ON public.digital_products;
CREATE POLICY "Digital products viewable by everyone" ON public.digital_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can insert digital products" ON public.digital_products;
CREATE POLICY "Store owners can insert digital products" ON public.digital_products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_products.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can update digital products" ON public.digital_products;
CREATE POLICY "Store owners can update digital products" ON public.digital_products FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_products.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can delete digital products" ON public.digital_products;
CREATE POLICY "Store owners can delete digital products" ON public.digital_products FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_products.store_id AND stores.user_id = auth.uid()));

-- Policies digital_product_files
DROP POLICY IF EXISTS "Digital files viewable by everyone" ON public.digital_product_files;
CREATE POLICY "Digital files viewable by everyone" ON public.digital_product_files FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can manage digital files" ON public.digital_product_files;
CREATE POLICY "Store owners can manage digital files" ON public.digital_product_files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_files.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can update digital files" ON public.digital_product_files;
CREATE POLICY "Store owners can update digital files" ON public.digital_product_files FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_files.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can delete digital files" ON public.digital_product_files;
CREATE POLICY "Store owners can delete digital files" ON public.digital_product_files FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_files.store_id AND stores.user_id = auth.uid()));

-- Policies digital_licenses
DROP POLICY IF EXISTS "Store owners can view licenses" ON public.digital_licenses;
CREATE POLICY "Store owners can view licenses" ON public.digital_licenses FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_licenses.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can view own licenses" ON public.digital_licenses;
CREATE POLICY "Customers can view own licenses" ON public.digital_licenses FOR SELECT USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = digital_licenses.customer_id AND customers.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can manage licenses" ON public.digital_licenses;
CREATE POLICY "Store owners can manage licenses" ON public.digital_licenses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_licenses.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can update licenses" ON public.digital_licenses;
CREATE POLICY "Store owners can update licenses" ON public.digital_licenses FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_licenses.store_id AND stores.user_id = auth.uid()));

-- Policies customer_downloads
DROP POLICY IF EXISTS "Users can view own downloads" ON public.customer_downloads;
CREATE POLICY "Users can view own downloads" ON public.customer_downloads FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Store owners can view downloads" ON public.customer_downloads;
CREATE POLICY "Store owners can view downloads" ON public.customer_downloads FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customer_downloads.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can insert downloads" ON public.customer_downloads;
CREATE POLICY "Store owners can insert downloads" ON public.customer_downloads FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = customer_downloads.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own downloads" ON public.customer_downloads;
CREATE POLICY "Users can insert own downloads" ON public.customer_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies digital_product_versions
DROP POLICY IF EXISTS "Versions viewable by everyone" ON public.digital_product_versions;
CREATE POLICY "Versions viewable by everyone" ON public.digital_product_versions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can manage versions" ON public.digital_product_versions;
CREATE POLICY "Store owners can manage versions" ON public.digital_product_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_versions.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can update versions" ON public.digital_product_versions;
CREATE POLICY "Store owners can update versions" ON public.digital_product_versions FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_versions.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can delete versions" ON public.digital_product_versions;
CREATE POLICY "Store owners can delete versions" ON public.digital_product_versions FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = digital_product_versions.store_id AND stores.user_id = auth.uid()));

-- Policies product_affiliate_settings
DROP POLICY IF EXISTS "Affiliate settings viewable by everyone" ON public.product_affiliate_settings;
CREATE POLICY "Affiliate settings viewable by everyone" ON public.product_affiliate_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store owners can manage affiliate settings" ON public.product_affiliate_settings;
CREATE POLICY "Store owners can manage affiliate settings" ON public.product_affiliate_settings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products JOIN stores ON stores.id = products.store_id WHERE products.id = product_affiliate_settings.product_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners can update affiliate settings" ON public.product_affiliate_settings;
CREATE POLICY "Store owners can update affiliate settings" ON public.product_affiliate_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM products JOIN stores ON stores.id = products.store_id WHERE products.id = product_affiliate_settings.product_id AND stores.user_id = auth.uid()));

-- Index
CREATE INDEX IF NOT EXISTS idx_digital_products_product_id ON public.digital_products(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_store_id ON public.digital_products(store_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_files_digital_product_id ON public.digital_product_files(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_licenses_digital_product_id ON public.digital_licenses(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_licenses_customer_id ON public.digital_licenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_downloads_user_id ON public.customer_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_downloads_digital_product_id ON public.customer_downloads(digital_product_id);

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_digital_products_updated_at ON public.digital_products;
CREATE TRIGGER update_digital_products_updated_at BEFORE UPDATE ON public.digital_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_digital_product_files_updated_at ON public.digital_product_files;
CREATE TRIGGER update_digital_product_files_updated_at BEFORE UPDATE ON public.digital_product_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_digital_licenses_updated_at ON public.digital_licenses;
CREATE TRIGGER update_digital_licenses_updated_at BEFORE UPDATE ON public.digital_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_affiliate_settings_updated_at ON public.product_affiliate_settings;
CREATE TRIGGER update_product_affiliate_settings_updated_at BEFORE UPDATE ON public.product_affiliate_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
