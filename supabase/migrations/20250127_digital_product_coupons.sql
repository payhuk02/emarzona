-- =====================================================
-- PAYHUK DIGITAL PRODUCT COUPONS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système complet de codes promo pour produits digitaux
-- =====================================================

-- =====================================================
-- 1. TABLE: digital_product_coupons
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_coupons'
  ) THEN
    CREATE TABLE public.digital_product_coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Coupon code
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL, -- Nom du coupon (pour référence interne)
      description TEXT,
      
      -- Discount type
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
      discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
      
      -- Limits
      min_purchase_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_purchase_amount >= 0),
      max_discount_amount NUMERIC(10, 2), -- Pour percentage, limite le montant max
      
      -- Applicability
      applicable_product_ids UUID[], -- NULL = tous les produits
      applicable_product_types TEXT[], -- ['digital', 'physical', 'service', 'course']
      applicable_store_ids UUID[], -- NULL = tous les stores
      
      -- Usage limits
      usage_limit INTEGER, -- NULL = unlimited
      usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
      usage_limit_per_customer INTEGER DEFAULT 1, -- Limite par client
      
      -- Validity
      valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
      valid_until TIMESTAMPTZ,
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      is_archived BOOLEAN DEFAULT FALSE,
      
      -- Restrictions
      first_time_buyers_only BOOLEAN DEFAULT FALSE,
      exclude_sale_items BOOLEAN DEFAULT FALSE,
      exclude_bundles BOOLEAN DEFAULT FALSE,
      
      -- Statistics
      total_discount_given NUMERIC(10, 2) DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      CONSTRAINT valid_discount CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type = 'fixed')
      ),
      CONSTRAINT valid_usage_limit CHECK (
        usage_limit IS NULL OR usage_limit > 0
      ),
      CONSTRAINT valid_validity CHECK (
        valid_until IS NULL OR valid_until > valid_from
      )
    );
    
    COMMENT ON TABLE public.digital_product_coupons IS 'Codes promo pour produits digitaux avec restrictions et limites';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_coupons'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON public.digital_product_coupons(store_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.digital_product_coupons(code);
    CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.digital_product_coupons(is_active);
    CREATE INDEX IF NOT EXISTS idx_coupons_valid_from ON public.digital_product_coupons(valid_from);
    CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.digital_product_coupons(valid_until);
    CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.digital_product_coupons(created_by);
    
    -- Index GIN pour recherche dans arrays
    CREATE INDEX IF NOT EXISTS idx_coupons_product_ids_gin ON public.digital_product_coupons USING GIN(applicable_product_ids);
    CREATE INDEX IF NOT EXISTS idx_coupons_product_types_gin ON public.digital_product_coupons USING GIN(applicable_product_types);
  END IF;
END $$;

-- Trigger updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_coupons'
  ) THEN
    DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.digital_product_coupons;
    CREATE TRIGGER update_coupons_updated_at
      BEFORE UPDATE ON public.digital_product_coupons
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: coupon_usages (Tracking)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'coupon_usages'
  ) THEN
    -- Vérifier que digital_product_coupons existe avant de créer la table
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'digital_product_coupons'
    ) THEN
      CREATE TABLE public.coupon_usages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coupon_id UUID NOT NULL REFERENCES public.digital_product_coupons(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
        
        -- Usage info
        discount_amount NUMERIC(10, 2) NOT NULL,
        order_total_before_discount NUMERIC(10, 2) NOT NULL,
        order_total_after_discount NUMERIC(10, 2) NOT NULL,
        
        -- Customer info
        customer_email TEXT,
        customer_name TEXT,
        
        -- Product info
        product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
        product_type TEXT,
        
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      
      COMMENT ON TABLE public.coupon_usages IS 'Historique des utilisations de codes promo';
    END IF;
  ELSE
    -- Si la table existe déjà, vérifier et ajouter les colonnes manquantes
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'coupon_id'
    ) THEN
      -- Vérifier que digital_product_coupons existe
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'digital_product_coupons'
      ) THEN
        ALTER TABLE public.coupon_usages
        ADD COLUMN coupon_id UUID REFERENCES public.digital_product_coupons(id) ON DELETE CASCADE;
      END IF;
    END IF;
    
    -- Ajouter les autres colonnes si elles n'existent pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'order_id'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      ) THEN
        ALTER TABLE public.coupon_usages
        ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
      END IF;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'discount_amount'
    ) THEN
      ALTER TABLE public.coupon_usages
      ADD COLUMN discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'order_total_before_discount'
    ) THEN
      ALTER TABLE public.coupon_usages
      ADD COLUMN order_total_before_discount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'order_total_after_discount'
    ) THEN
      ALTER TABLE public.coupon_usages
      ADD COLUMN order_total_after_discount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'customer_email'
    ) THEN
      ALTER TABLE public.coupon_usages
      ADD COLUMN customer_email TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'customer_name'
    ) THEN
      ALTER TABLE public.coupon_usages
      ADD COLUMN customer_name TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'product_id'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'products'
      ) THEN
        ALTER TABLE public.coupon_usages
        ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
      END IF;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'product_type'
    ) THEN
      ALTER TABLE public.coupon_usages
      ADD COLUMN product_type TEXT;
    END IF;
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'coupon_usages'
  ) THEN
    -- Vérifier que les colonnes existent avant de créer les index
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'coupon_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'order_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id ON public.coupon_usages(order_id);
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'customer_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_coupon_usages_customer_id ON public.coupon_usages(customer_id);
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'coupon_usages'
      AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_coupon_usages_created_at ON public.coupon_usages(created_at DESC);
    END IF;
  END IF;
END $$;

-- =====================================================
-- 3. FUNCTION: Validate coupon
-- =====================================================

CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_product_id UUID DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_order_amount NUMERIC(10, 2) DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_customer_usage_count INTEGER;
  v_discount_amount NUMERIC(10, 2);
  v_result JSONB;
BEGIN
  -- Récupérer le coupon
  SELECT * INTO v_coupon
  FROM public.digital_product_coupons
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = TRUE
    AND is_archived = FALSE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'coupon_not_found',
      'message', 'Code promo invalide'
    );
  END IF;
  
  -- Vérifier la validité temporelle
  IF v_coupon.valid_from > now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'coupon_not_yet_valid',
      'message', 'Ce code promo n''est pas encore valide'
    );
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'coupon_expired',
      'message', 'Ce code promo a expiré'
    );
  END IF;
  
  -- Vérifier la limite d'utilisation globale
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'coupon_limit_reached',
      'message', 'Ce code promo a atteint sa limite d''utilisation'
    );
  END IF;
  
  -- Vérifier la limite par client
  IF p_customer_id IS NOT NULL AND v_coupon.usage_limit_per_customer > 0 THEN
    SELECT COUNT(*) INTO v_customer_usage_count
    FROM public.coupon_usages
    WHERE coupon_id = v_coupon.id
      AND customer_id = p_customer_id;
    
    IF v_customer_usage_count >= v_coupon.usage_limit_per_customer THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'coupon_customer_limit_reached',
        'message', 'Vous avez déjà utilisé ce code promo le maximum de fois'
      );
    END IF;
  END IF;
  
  -- Vérifier le montant minimum d'achat
  IF p_order_amount < v_coupon.min_purchase_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'min_purchase_not_met',
      'message', format('Montant minimum requis: %s XOF', v_coupon.min_purchase_amount),
      'min_amount', v_coupon.min_purchase_amount
    );
  END IF;
  
  -- Vérifier l'applicabilité au produit
  IF p_product_id IS NOT NULL THEN
    IF v_coupon.applicable_product_ids IS NOT NULL AND 
       array_length(v_coupon.applicable_product_ids, 1) > 0 AND
       NOT (p_product_id = ANY(v_coupon.applicable_product_ids)) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'coupon_not_applicable',
        'message', 'Ce code promo n''est pas applicable à ce produit'
      );
    END IF;
  END IF;
  
  -- Vérifier l'applicabilité au type de produit
  IF p_product_type IS NOT NULL THEN
    IF v_coupon.applicable_product_types IS NOT NULL AND 
       array_length(v_coupon.applicable_product_types, 1) > 0 AND
       NOT (p_product_type = ANY(v_coupon.applicable_product_types)) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'coupon_not_applicable_type',
        'message', 'Ce code promo n''est pas applicable à ce type de produit'
      );
    END IF;
  END IF;
  
  -- Vérifier l'applicabilité au store
  IF p_store_id IS NOT NULL THEN
    IF v_coupon.applicable_store_ids IS NOT NULL AND 
       array_length(v_coupon.applicable_store_ids, 1) > 0 AND
       NOT (p_store_id = ANY(v_coupon.applicable_store_ids)) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'coupon_not_applicable_store',
        'message', 'Ce code promo n''est pas applicable à ce store'
      );
    END IF;
  END IF;
  
  -- Calculer le montant de réduction
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := (p_order_amount * v_coupon.discount_value) / 100;
    -- Appliquer la limite max si définie
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.max_discount_amount THEN
      v_discount_amount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount_amount := v_coupon.discount_value;
  END IF;
  
  -- S'assurer que le discount ne dépasse pas le montant de la commande
  IF v_discount_amount > p_order_amount THEN
    v_discount_amount := p_order_amount;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'name', v_coupon.name,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount_amount,
    'order_total_before', p_order_amount,
    'order_total_after', p_order_amount - v_discount_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNCTION: Apply coupon to order
-- =====================================================

CREATE OR REPLACE FUNCTION apply_coupon_to_order(
  p_coupon_id UUID,
  p_order_id UUID,
  p_customer_id UUID,
  p_discount_amount NUMERIC(10, 2)
) RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_order RECORD;
  v_customer RECORD;
  v_usage_id UUID;
BEGIN
  -- Récupérer le coupon
  SELECT * INTO v_coupon
  FROM public.digital_product_coupons
  WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'coupon_not_found');
  END IF;
  
  -- Récupérer la commande
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;
  
  -- Récupérer le client
  SELECT * INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id;
  
  -- Enregistrer l'utilisation
  INSERT INTO public.coupon_usages (
    coupon_id,
    order_id,
    customer_id,
    discount_amount,
    order_total_before_discount,
    order_total_after_discount,
    customer_email,
    customer_name,
    product_id,
    product_type
  )
  SELECT
    p_coupon_id,
    p_order_id,
    p_customer_id,
    p_discount_amount,
    v_order.total_amount + p_discount_amount, -- Restaurer le montant avant discount
    v_order.total_amount,
    v_customer.email,
    v_customer.name,
    (SELECT product_id FROM public.order_items WHERE order_id = p_order_id LIMIT 1),
    (SELECT product_type FROM public.order_items WHERE order_id = p_order_id LIMIT 1)
  RETURNING id INTO v_usage_id;
  
  -- Mettre à jour le compteur d'utilisation du coupon
  UPDATE public.digital_product_coupons
  SET
    usage_count = usage_count + 1,
    total_discount_given = total_discount_given + p_discount_amount,
    total_orders = total_orders + 1
  WHERE id = p_coupon_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'usage_id', v_usage_id,
    'discount_amount', p_discount_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_coupons'
  ) THEN
    ALTER TABLE public.digital_product_coupons ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can manage their coupons
    DROP POLICY IF EXISTS "Store owners manage coupons" ON public.digital_product_coupons;
    CREATE POLICY "Store owners manage coupons"
      ON public.digital_product_coupons
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = digital_product_coupons.store_id
          AND stores.user_id = auth.uid()
        )
      );
    
    -- Anyone can view active coupons (for validation)
    DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.digital_product_coupons;
    CREATE POLICY "Anyone can view active coupons"
      ON public.digital_product_coupons
      FOR SELECT
      USING (is_active = TRUE AND is_archived = FALSE);
  END IF;
END $$;

-- RLS pour coupon_usages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'coupon_usages'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'coupon_usages'
    AND column_name = 'coupon_id'
  ) THEN
    ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can view coupon usages
    DROP POLICY IF EXISTS "Store owners view coupon usages" ON public.coupon_usages;
    CREATE POLICY "Store owners view coupon usages"
      ON public.coupon_usages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.digital_product_coupons c
          INNER JOIN public.stores s ON c.store_id = s.id
          WHERE c.id = coupon_usages.coupon_id
          AND s.user_id = auth.uid()
        )
      );
    
    -- Customers can view their own coupon usages
    DROP POLICY IF EXISTS "Customers view own coupon usages" ON public.coupon_usages;
    CREATE POLICY "Customers view own coupon usages"
      ON public.coupon_usages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND email = coupon_usages.customer_email
        )
      );
  END IF;
END $$;

-- =====================================================
-- 6. VÉRIFICATION
-- =====================================================

SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE '%coupon%'
  AND schemaname = 'public'
ORDER BY tablename;

