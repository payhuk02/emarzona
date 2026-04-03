-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Stores policies: users can only manage their own store
CREATE POLICY "Users can view their own store"
  ON public.stores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store"
  ON public.stores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store"
  ON public.stores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store"
  ON public.stores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view stores by slug (for storefront)
CREATE POLICY "Anyone can view stores by slug"
  ON public.stores
  FOR SELECT
  USING (true);

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  slug := lower(trim(input_text));
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(slug, '-');
  
  RETURN slug;
END;
$$;

-- Function to check if store slug is available
CREATE OR REPLACE FUNCTION public.is_store_slug_available(check_slug TEXT, exclude_store_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF exclude_store_id IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.stores WHERE slug = check_slug
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.stores WHERE slug = check_slug AND id != exclude_store_id
    );
  END IF;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  digital_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Store owners can manage their products"
  ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = products.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Public can view active products
CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = true);

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if product slug is available within a store
CREATE OR REPLACE FUNCTION public.is_product_slug_available(
  check_slug TEXT, 
  check_store_id UUID,
  exclude_product_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF exclude_product_id IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.products 
      WHERE slug = check_slug AND store_id = check_store_id
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.products 
      WHERE slug = check_slug 
      AND store_id = check_store_id 
      AND id != exclude_product_id
    );
  END IF;
END;
$$;