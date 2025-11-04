-- =====================================================
-- PAYHUK DIGITAL PRODUCT BUNDLES SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système complet pour produits digitaux groupés (bundles)
-- =====================================================

-- =====================================================
-- 1. TABLE: digital_product_bundles
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_bundles'
  ) THEN
    CREATE TABLE public.digital_product_bundles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
      
      -- Bundle info
      name TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      slug TEXT NOT NULL,
      
      -- Pricing
      bundle_price NUMERIC(10, 2) NOT NULL CHECK (bundle_price >= 0),
      currency TEXT NOT NULL DEFAULT 'XOF',
      promotional_price NUMERIC(10, 2),
      discount_percentage NUMERIC(5, 2), -- Calculé automatiquement
      
      -- Products in bundle
      digital_product_ids UUID[] NOT NULL CHECK (array_length(digital_product_ids, 1) > 1),
      
      -- Display
      image_url TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      display_order INTEGER DEFAULT 0,
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      is_draft BOOLEAN DEFAULT FALSE,
      
      -- Statistics
      total_sales INTEGER DEFAULT 0,
      total_revenue NUMERIC(10, 2) DEFAULT 0,
      total_downloads INTEGER DEFAULT 0,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      CONSTRAINT valid_discount CHECK (
        promotional_price IS NULL OR promotional_price <= bundle_price
      ),
      CONSTRAINT min_products_in_bundle CHECK (
        array_length(digital_product_ids, 1) >= 2
      )
    );
    
    COMMENT ON TABLE public.digital_product_bundles IS 'Produits digitaux groupés (bundles) avec prix réduit';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_bundles'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bundles_store_id ON public.digital_product_bundles(store_id);
    CREATE INDEX IF NOT EXISTS idx_bundles_product_id ON public.digital_product_bundles(product_id);
    CREATE INDEX IF NOT EXISTS idx_bundles_slug ON public.digital_product_bundles(slug);
    CREATE INDEX IF NOT EXISTS idx_bundles_is_active ON public.digital_product_bundles(is_active);
    CREATE INDEX IF NOT EXISTS idx_bundles_is_featured ON public.digital_product_bundles(is_featured);
    CREATE INDEX IF NOT EXISTS idx_bundles_display_order ON public.digital_product_bundles(display_order);
    CREATE INDEX IF NOT EXISTS idx_bundles_total_sales ON public.digital_product_bundles(total_sales DESC);
    
    -- Index GIN pour recherche dans array
    CREATE INDEX IF NOT EXISTS idx_bundles_product_ids_gin ON public.digital_product_bundles USING GIN(digital_product_ids);
  END IF;
END $$;

-- Trigger updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_bundles'
  ) THEN
    DROP TRIGGER IF EXISTS update_bundles_updated_at ON public.digital_product_bundles;
    CREATE TRIGGER update_bundles_updated_at
      BEFORE UPDATE ON public.digital_product_bundles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: bundle_order_items (Tracking)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'bundle_order_items'
  ) THEN
    CREATE TABLE public.bundle_order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bundle_id UUID NOT NULL REFERENCES public.digital_product_bundles(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
      
      -- Bundle purchase info
      bundle_price NUMERIC(10, 2) NOT NULL,
      discount_amount NUMERIC(10, 2) NOT NULL,
      individual_products_total NUMERIC(10, 2) NOT NULL,
      
      -- Customer info
      customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
      
      -- Products delivered
      digital_product_ids UUID[] NOT NULL,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    COMMENT ON TABLE public.bundle_order_items IS 'Tracking des commandes de bundles';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'bundle_order_items'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bundle_order_items_bundle_id ON public.bundle_order_items(bundle_id);
    CREATE INDEX IF NOT EXISTS idx_bundle_order_items_order_id ON public.bundle_order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_bundle_order_items_customer_id ON public.bundle_order_items(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bundle_order_items_created_at ON public.bundle_order_items(created_at DESC);
  END IF;
END $$;

-- =====================================================
-- 3. FUNCTION: Calculate bundle discount
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_bundle_discount(
  p_bundle_id UUID
) RETURNS NUMERIC(5, 2) AS $$
DECLARE
  v_bundle RECORD;
  v_individual_total NUMERIC(10, 2) := 0;
  v_product RECORD;
BEGIN
  -- Récupérer le bundle
  SELECT * INTO v_bundle
  FROM public.digital_product_bundles
  WHERE id = p_bundle_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculer le total des produits individuels
  SELECT COALESCE(SUM(price), 0) INTO v_individual_total
  FROM public.products
  WHERE id = ANY(v_bundle.digital_product_ids);
  
  -- Calculer le pourcentage de réduction
  IF v_individual_total > 0 AND v_bundle.bundle_price > 0 THEN
    RETURN ROUND(
      ((v_individual_total - v_bundle.bundle_price) / v_individual_total) * 100,
      2
    );
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION: Update bundle discount percentage
-- =====================================================

CREATE OR REPLACE FUNCTION update_bundle_discount_percentage()
RETURNS TRIGGER AS $$
BEGIN
  NEW.discount_percentage := calculate_bundle_discount(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le discount
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_bundles'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_bundle_discount ON public.digital_product_bundles;
    CREATE TRIGGER trigger_update_bundle_discount
      BEFORE INSERT OR UPDATE OF bundle_price, digital_product_ids ON public.digital_product_bundles
      FOR EACH ROW
      EXECUTE FUNCTION update_bundle_discount_percentage();
  END IF;
END $$;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_bundles'
  ) THEN
    ALTER TABLE public.digital_product_bundles ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can manage their bundles
    DROP POLICY IF EXISTS "Store owners manage bundles" ON public.digital_product_bundles;
    CREATE POLICY "Store owners manage bundles"
      ON public.digital_product_bundles
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = digital_product_bundles.store_id
          AND stores.user_id = auth.uid()
        )
      );
    
    -- Anyone can view active bundles
    DROP POLICY IF EXISTS "Anyone can view active bundles" ON public.digital_product_bundles;
    CREATE POLICY "Anyone can view active bundles"
      ON public.digital_product_bundles
      FOR SELECT
      USING (is_active = TRUE AND is_draft = FALSE);
  END IF;
END $$;

-- RLS pour bundle_order_items
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'bundle_order_items'
  ) THEN
    ALTER TABLE public.bundle_order_items ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can view bundle orders
    DROP POLICY IF EXISTS "Store owners view bundle orders" ON public.bundle_order_items;
    CREATE POLICY "Store owners view bundle orders"
      ON public.bundle_order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.digital_product_bundles b
          INNER JOIN public.stores s ON b.store_id = s.id
          WHERE b.id = bundle_order_items.bundle_id
          AND s.user_id = auth.uid()
        )
      );
    
    -- Customers can view their own bundle orders
    DROP POLICY IF EXISTS "Customers view own bundle orders" ON public.bundle_order_items;
    CREATE POLICY "Customers view own bundle orders"
      ON public.bundle_order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND email = (
            SELECT email FROM public.customers
            WHERE id = bundle_order_items.customer_id
          )
        )
      );
  END IF;
END $$;

-- =====================================================
-- 6. FUNCTION: Create bundle order
-- =====================================================

CREATE OR REPLACE FUNCTION create_bundle_order(
  p_bundle_id UUID,
  p_customer_id UUID,
  p_store_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_bundle RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_order_item_id UUID;
  v_bundle_order_item_id UUID;
  v_individual_total NUMERIC(10, 2) := 0;
  v_discount_amount NUMERIC(10, 2) := 0;
BEGIN
  -- Récupérer le bundle
  SELECT * INTO v_bundle
  FROM public.digital_product_bundles
  WHERE id = p_bundle_id
    AND is_active = TRUE
    AND is_draft = FALSE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'bundle_not_found',
      'message', 'Bundle non trouvé ou inactif'
    );
  END IF;
  
  -- Calculer le total individuel
  SELECT COALESCE(SUM(price), 0) INTO v_individual_total
  FROM public.products
  WHERE id = ANY(v_bundle.digital_product_ids);
  
  v_discount_amount := v_individual_total - v_bundle.bundle_price;
  
  -- Générer numéro de commande
  SELECT generate_order_number() INTO v_order_number;
  
  -- Créer la commande
  INSERT INTO public.orders (
    store_id,
    customer_id,
    order_number,
    total_amount,
    currency,
    payment_status,
    status
  ) VALUES (
    p_store_id,
    p_customer_id,
    v_order_number,
    v_bundle.bundle_price,
    v_bundle.currency,
    'pending',
    'pending'
  ) RETURNING id INTO v_order_id;
  
  -- Créer l'order_item
  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_type,
    product_name,
    quantity,
    unit_price,
    total_price,
    item_metadata
  ) VALUES (
    v_order_id,
    v_bundle.product_id,
    'bundle',
    v_bundle.name,
    1,
    v_bundle.bundle_price,
    v_bundle.bundle_price,
    jsonb_build_object(
      'bundle_id', p_bundle_id,
      'digital_product_ids', v_bundle.digital_product_ids,
      'discount_amount', v_discount_amount,
      'individual_total', v_individual_total
    )
  ) RETURNING id INTO v_order_item_id;
  
  -- Créer le bundle_order_item
  INSERT INTO public.bundle_order_items (
    bundle_id,
    order_id,
    order_item_id,
    customer_id,
    bundle_price,
    discount_amount,
    individual_products_total,
    digital_product_ids
  ) VALUES (
    p_bundle_id,
    v_order_id,
    v_order_item_id,
    p_customer_id,
    v_bundle.bundle_price,
    v_discount_amount,
    v_individual_total,
    v_bundle.digital_product_ids
  ) RETURNING id INTO v_bundle_order_item_id;
  
  -- Mettre à jour les statistiques du bundle
  UPDATE public.digital_product_bundles
  SET total_sales = total_sales + 1
  WHERE id = p_bundle_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'order_item_id', v_order_item_id,
    'bundle_order_item_id', v_bundle_order_item_id,
    'total_amount', v_bundle.bundle_price,
    'discount_amount', v_discount_amount,
    'savings_percentage', v_bundle.discount_percentage
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VÉRIFICATION
-- =====================================================

SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE '%bundle%'
  AND schemaname = 'public'
ORDER BY tablename;

