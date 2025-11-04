-- =====================================================
-- PAYHUK DIGITAL PRODUCT SUBSCRIPTIONS SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système complet pour produits digitaux avec abonnements récurrents
-- =====================================================

-- =====================================================
-- 1. Ajouter colonnes subscription à digital_products
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_products'
  ) THEN
    -- Ajouter subscription_interval
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'digital_products'
      AND column_name = 'subscription_interval'
    ) THEN
      ALTER TABLE public.digital_products
      ADD COLUMN subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly', 'quarterly', 'weekly', 'daily')) DEFAULT NULL;
      
      COMMENT ON COLUMN public.digital_products.subscription_interval IS 'Intervalle de facturation pour abonnements (monthly, yearly, etc.)';
    END IF;
    
    -- Ajouter subscription_price
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'digital_products'
      AND column_name = 'subscription_price'
    ) THEN
      ALTER TABLE public.digital_products
      ADD COLUMN subscription_price NUMERIC(10, 2) DEFAULT NULL;
      
      COMMENT ON COLUMN public.digital_products.subscription_price IS 'Prix de l''abonnement récurrent';
    END IF;
    
    -- Ajouter trial_period_days
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'digital_products'
      AND column_name = 'trial_period_days'
    ) THEN
      ALTER TABLE public.digital_products
      ADD COLUMN trial_period_days INTEGER DEFAULT 0 CHECK (trial_period_days >= 0);
      
      COMMENT ON COLUMN public.digital_products.trial_period_days IS 'Période d''essai gratuite en jours';
    END IF;
    
    -- Ajouter auto_renew
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'digital_products'
      AND column_name = 'auto_renew'
    ) THEN
      ALTER TABLE public.digital_products
      ADD COLUMN auto_renew BOOLEAN DEFAULT TRUE;
      
      COMMENT ON COLUMN public.digital_products.auto_renew IS 'Renouvellement automatique activé';
    END IF;
    
    -- Ajouter subscription_grace_period_days
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'digital_products'
      AND column_name = 'subscription_grace_period_days'
    ) THEN
      ALTER TABLE public.digital_products
      ADD COLUMN subscription_grace_period_days INTEGER DEFAULT 0 CHECK (subscription_grace_period_days >= 0);
      
      COMMENT ON COLUMN public.digital_products.subscription_grace_period_days IS 'Période de grâce après expiration avant suspension';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: digital_product_subscriptions
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_subscriptions'
  ) THEN
    CREATE TABLE public.digital_product_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Subscription info
      subscription_interval TEXT NOT NULL CHECK (subscription_interval IN ('monthly', 'yearly', 'quarterly', 'weekly', 'daily')),
      subscription_price NUMERIC(10, 2) NOT NULL CHECK (subscription_price >= 0),
      currency TEXT NOT NULL DEFAULT 'XOF',
      
      -- Status
      status TEXT NOT NULL CHECK (status IN (
        'active',
        'cancelled',
        'expired',
        'past_due',
        'trialing',
        'paused',
        'suspended'
      )) DEFAULT 'trialing',
      
      -- Billing periods
      current_period_start TIMESTAMPTZ NOT NULL,
      current_period_end TIMESTAMPTZ NOT NULL,
      trial_start TIMESTAMPTZ,
      trial_end TIMESTAMPTZ,
      
      -- Cancellation
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      cancelled_at TIMESTAMPTZ,
      cancellation_reason TEXT,
      
      -- Renewal
      next_billing_date TIMESTAMPTZ,
      last_payment_date TIMESTAMPTZ,
      last_payment_amount NUMERIC(10, 2),
      
      -- Payment info
      payment_method_id TEXT,
      payment_provider TEXT, -- 'moneroo', 'paydunya', etc.
      
      -- License link (si applicable)
      license_id UUID REFERENCES public.digital_licenses(id) ON DELETE SET NULL,
      
      -- Statistics
      total_payments INTEGER DEFAULT 0,
      total_amount_paid NUMERIC(10, 2) DEFAULT 0,
      failed_payment_attempts INTEGER DEFAULT 0,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      CONSTRAINT valid_period CHECK (current_period_end > current_period_start),
      CONSTRAINT valid_trial CHECK (
        trial_end IS NULL OR trial_start IS NULL OR trial_end > trial_start
      )
    );
    
    COMMENT ON TABLE public.digital_product_subscriptions IS 'Abonnements pour produits digitaux avec paiements récurrents';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_subscriptions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_digital_product_id ON public.digital_product_subscriptions(digital_product_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id ON public.digital_product_subscriptions(product_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.digital_product_subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON public.digital_product_subscriptions(store_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.digital_product_subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.digital_product_subscriptions(current_period_end);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON public.digital_product_subscriptions(next_billing_date);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_license_id ON public.digital_product_subscriptions(license_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_subscriptions'
  ) THEN
    DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.digital_product_subscriptions;
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON public.digital_product_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: subscription_payments (Historique paiements)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'subscription_payments'
  ) THEN
    CREATE TABLE public.subscription_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscription_id UUID NOT NULL REFERENCES public.digital_product_subscriptions(id) ON DELETE CASCADE,
      order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
      
      -- Payment info
      amount NUMERIC(10, 2) NOT NULL,
      currency TEXT NOT NULL,
      payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      payment_method TEXT,
      payment_provider TEXT,
      
      -- Billing period
      billing_period_start TIMESTAMPTZ NOT NULL,
      billing_period_end TIMESTAMPTZ NOT NULL,
      
      -- Dates
      paid_at TIMESTAMPTZ,
      failed_at TIMESTAMPTZ,
      failure_reason TEXT,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    COMMENT ON TABLE public.subscription_payments IS 'Historique des paiements d''abonnements';
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'subscription_payments'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON public.subscription_payments(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_order_id ON public.subscription_payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_status ON public.subscription_payments(payment_status);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_paid_at ON public.subscription_payments(paid_at DESC);
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTION: Calculate next billing date
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_next_billing_date(
  p_current_period_end TIMESTAMPTZ,
  p_interval TEXT
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_interval
    WHEN 'daily' THEN
      RETURN p_current_period_end + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_period_end + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN p_current_period_end + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN p_current_period_end + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN p_current_period_end + INTERVAL '1 year';
    ELSE
      RETURN p_current_period_end;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 5. FUNCTION: Create subscription
-- =====================================================

CREATE OR REPLACE FUNCTION create_digital_subscription(
  p_digital_product_id UUID,
  p_customer_id UUID,
  p_store_id UUID,
  p_trial_days INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_digital_product RECORD;
  v_subscription_id UUID;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_trial_start TIMESTAMPTZ;
  v_trial_end TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  -- Récupérer le produit digital
  SELECT dp.*, p.* INTO v_digital_product
  FROM public.digital_products dp
  INNER JOIN public.products p ON dp.product_id = p.id
  WHERE dp.id = p_digital_product_id
    AND dp.license_type = 'subscription'
    AND dp.subscription_interval IS NOT NULL
    AND dp.subscription_price IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'product_not_found',
      'message', 'Produit digital non trouvé ou ne supporte pas les abonnements'
    );
  END IF;
  
  -- Calculer les dates
  v_period_start := now();
  
  IF p_trial_days > 0 OR v_digital_product.trial_period_days > 0 THEN
    v_trial_start := now();
    v_trial_end := now() + (COALESCE(p_trial_days, v_digital_product.trial_period_days) || ' days')::INTERVAL;
    v_period_start := v_trial_end;
    v_status := 'trialing';
  ELSE
    v_status := 'active';
  END IF;
  
  v_period_end := calculate_next_billing_date(v_period_start, v_digital_product.subscription_interval);
  
  -- Créer l'abonnement
  INSERT INTO public.digital_product_subscriptions (
    digital_product_id,
    product_id,
    customer_id,
    store_id,
    subscription_interval,
    subscription_price,
    currency,
    status,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end,
    next_billing_date,
    auto_renew
  ) VALUES (
    p_digital_product_id,
    v_digital_product.product_id,
    p_customer_id,
    p_store_id,
    v_digital_product.subscription_interval,
    v_digital_product.subscription_price,
    v_digital_product.currency,
    v_status,
    v_period_start,
    v_period_end,
    v_trial_start,
    v_trial_end,
    v_period_end,
    COALESCE(v_digital_product.auto_renew, TRUE)
  ) RETURNING id INTO v_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'status', v_status,
    'current_period_start', v_period_start,
    'current_period_end', v_period_end,
    'trial_end', v_trial_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCTION: Renew subscription
-- =====================================================

CREATE OR REPLACE FUNCTION renew_digital_subscription(
  p_subscription_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_new_period_start TIMESTAMPTZ;
  v_new_period_end TIMESTAMPTZ;
BEGIN
  -- Récupérer l'abonnement
  SELECT * INTO v_subscription
  FROM public.digital_product_subscriptions
  WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_not_found');
  END IF;
  
  IF v_subscription.status NOT IN ('active', 'past_due') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'L''abonnement ne peut pas être renouvelé dans son état actuel'
    );
  END IF;
  
  -- Calculer la nouvelle période
  v_new_period_start := v_subscription.current_period_end;
  v_new_period_end := calculate_next_billing_date(v_new_period_start, v_subscription.subscription_interval);
  
  -- Mettre à jour l'abonnement
  UPDATE public.digital_product_subscriptions
  SET
    current_period_start = v_new_period_start,
    current_period_end = v_new_period_end,
    next_billing_date = v_new_period_end,
    status = 'active',
    total_payments = total_payments + 1,
    updated_at = now()
  WHERE id = p_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_period_start', v_new_period_start,
    'new_period_end', v_new_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'digital_product_subscriptions'
  ) THEN
    ALTER TABLE public.digital_product_subscriptions ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can manage subscriptions
    DROP POLICY IF EXISTS "Store owners manage subscriptions" ON public.digital_product_subscriptions;
    CREATE POLICY "Store owners manage subscriptions"
      ON public.digital_product_subscriptions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = digital_product_subscriptions.store_id
          AND stores.user_id = auth.uid()
        )
      );
    
    -- Customers can view their own subscriptions
    DROP POLICY IF EXISTS "Customers view own subscriptions" ON public.digital_product_subscriptions;
    CREATE POLICY "Customers view own subscriptions"
      ON public.digital_product_subscriptions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND email = (
            SELECT email FROM public.customers
            WHERE id = digital_product_subscriptions.customer_id
          )
        )
      );
  END IF;
END $$;

-- RLS pour subscription_payments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'subscription_payments'
  ) THEN
    ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
    
    -- Store owners can view payments
    DROP POLICY IF EXISTS "Store owners view subscription payments" ON public.subscription_payments;
    CREATE POLICY "Store owners view subscription payments"
      ON public.subscription_payments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.digital_product_subscriptions s
          INNER JOIN public.stores st ON s.store_id = st.id
          WHERE s.id = subscription_payments.subscription_id
          AND st.user_id = auth.uid()
        )
      );
    
    -- Customers can view their own payments
    DROP POLICY IF EXISTS "Customers view own subscription payments" ON public.subscription_payments;
    CREATE POLICY "Customers view own subscription payments"
      ON public.subscription_payments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.digital_product_subscriptions s
          INNER JOIN public.customers c ON s.customer_id = c.id
          INNER JOIN auth.users u ON u.email = c.email
          WHERE s.id = subscription_payments.subscription_id
          AND u.id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 8. VÉRIFICATION
-- =====================================================

SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE '%subscription%'
  AND schemaname = 'public'
ORDER BY tablename;

