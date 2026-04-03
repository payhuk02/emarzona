-- =====================================================
-- EMARZONA MULTI-CURRENCY SYSTEM
-- Date: 28 Janvier 2025
-- Description: Système de gestion multi-devises avec taux de change et prix régionaux
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: currencies
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'currencies'
  ) THEN
    CREATE TABLE public.currencies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Currency info
      code TEXT NOT NULL UNIQUE, -- ISO 4217 code (USD, EUR, XOF, etc.)
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      decimal_places INTEGER DEFAULT 2,
      
      -- Display settings
      symbol_position TEXT DEFAULT 'before' CHECK (symbol_position IN ('before', 'after')),
      thousands_separator TEXT DEFAULT ',',
      decimal_separator TEXT DEFAULT '.',
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      is_base_currency BOOLEAN DEFAULT FALSE, -- XOF est la devise de base
      
      -- Country/Region
      country_code TEXT,
      region TEXT,
      
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_currencies_code ON public.currencies(code);
    CREATE INDEX idx_currencies_active ON public.currencies(is_active);
    CREATE INDEX idx_currencies_base ON public.currencies(is_base_currency);
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: exchange_rates
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exchange_rates'
  ) THEN
    CREATE TABLE public.exchange_rates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      from_currency TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE CASCADE,
      to_currency TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE CASCADE,
      
      rate NUMERIC(20, 10) NOT NULL CHECK (rate > 0),
      
      -- Source of the rate
      source TEXT DEFAULT 'manual', -- manual, api_openexchangerates, api_exchangerate_api, etc.
      
      -- Auto-update settings
      auto_update BOOLEAN DEFAULT FALSE,
      last_updated TIMESTAMPTZ DEFAULT NOW(),
      
      -- Validity
      valid_from TIMESTAMPTZ DEFAULT NOW(),
      valid_to TIMESTAMPTZ,
      
      is_active BOOLEAN DEFAULT TRUE,
      
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      UNIQUE(from_currency, to_currency)
    );

    CREATE INDEX idx_exchange_rates_from ON public.exchange_rates(from_currency);
    CREATE INDEX idx_exchange_rates_to ON public.exchange_rates(to_currency);
    CREATE INDEX idx_exchange_rates_active ON public.exchange_rates(is_active);
    CREATE INDEX idx_exchange_rates_last_updated ON public.exchange_rates(last_updated DESC);
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: regional_prices
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'regional_prices'
  ) THEN
    CREATE TABLE public.regional_prices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      currency_code TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE CASCADE,
      
      -- Pricing
      price NUMERIC NOT NULL CHECK (price >= 0),
      promotional_price NUMERIC CHECK (promotional_price IS NULL OR promotional_price >= 0),
      
      -- Regions where this pricing applies
      country_codes TEXT[], -- Array of ISO country codes
      region TEXT, -- 'europe', 'asia', 'africa', etc.
      
      -- Priority (higher = more specific, used for matching)
      priority INTEGER DEFAULT 0,
      
      is_active BOOLEAN DEFAULT TRUE,
      
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      UNIQUE(product_id, currency_code)
    );

    CREATE INDEX idx_regional_prices_product ON public.regional_prices(product_id);
    CREATE INDEX idx_regional_prices_currency ON public.regional_prices(currency_code);
    CREATE INDEX idx_regional_prices_active ON public.regional_prices(is_active);
  END IF;
END $$;

-- =====================================================
-- 4. TABLE: currency_conversion_logs
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'currency_conversion_logs'
  ) THEN
    CREATE TABLE public.currency_conversion_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      from_amount NUMERIC NOT NULL,
      to_amount NUMERIC NOT NULL,
      rate_used NUMERIC(20, 10) NOT NULL,
      
      -- Context
      context TEXT, -- 'product_display', 'checkout', 'order', etc.
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_conversion_logs_from ON public.currency_conversion_logs(from_currency);
    CREATE INDEX idx_conversion_logs_to ON public.currency_conversion_logs(to_currency);
    CREATE INDEX idx_conversion_logs_created ON public.currency_conversion_logs(created_at DESC);
  END IF;
END $$;

-- =====================================================
-- 5. FONCTIONS: Conversion de devises
-- =====================================================

-- Fonction pour convertir un montant d'une devise à une autre
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT
) RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
  v_converted_amount NUMERIC;
BEGIN
  -- Si même devise, retourner le montant tel quel
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;

  -- Récupérer le taux de change
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND is_active = TRUE
  ORDER BY last_updated DESC
  LIMIT 1;

  -- Si pas de taux direct, essayer la conversion inverse
  IF v_rate IS NULL THEN
    SELECT (1.0 / rate) INTO v_rate
    FROM public.exchange_rates
    WHERE from_currency = p_to_currency
      AND to_currency = p_from_currency
      AND is_active = TRUE
    ORDER BY last_updated DESC
    LIMIT 1;
  END IF;

  -- Si toujours pas de taux, lever une erreur
  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'Aucun taux de change trouvé pour % -> %', p_from_currency, p_to_currency;
  END IF;

  -- Calculer le montant converti
  v_converted_amount := p_amount * v_rate;

  -- Logger la conversion
  INSERT INTO public.currency_conversion_logs (
    from_currency,
    to_currency,
    from_amount,
    to_amount,
    rate_used,
    context
  ) VALUES (
    p_from_currency,
    p_to_currency,
    p_amount,
    v_converted_amount,
    v_rate,
    'function_call'
  );

  RETURN v_converted_amount;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le prix d'un produit dans une devise spécifique
CREATE OR REPLACE FUNCTION get_product_price_in_currency(
  p_product_id UUID,
  p_currency_code TEXT,
  p_country_code TEXT DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  v_regional_price NUMERIC;
  v_base_price NUMERIC;
  v_base_currency TEXT;
  v_converted_price NUMERIC;
BEGIN
  -- D'abord, chercher un prix régional spécifique
  SELECT price INTO v_regional_price
  FROM public.regional_prices
  WHERE product_id = p_product_id
    AND currency_code = p_currency_code
    AND is_active = TRUE
    AND (
      p_country_code IS NULL 
      OR p_country_code = ANY(country_codes)
    )
  ORDER BY priority DESC
  LIMIT 1;

  -- Si prix régional trouvé, le retourner
  IF v_regional_price IS NOT NULL THEN
    RETURN v_regional_price;
  END IF;

  -- Sinon, convertir depuis le prix de base
  SELECT p.price, p.currency INTO v_base_price, v_base_currency
  FROM public.products p
  WHERE p.id = p_product_id;

  IF v_base_price IS NULL THEN
    RETURN NULL;
  END IF;

  -- Si même devise que la devise de base, retourner tel quel
  IF v_base_currency = p_currency_code THEN
    RETURN v_base_price;
  END IF;

  -- Convertir
  v_converted_price := convert_currency(v_base_price, v_base_currency, p_currency_code);

  RETURN v_converted_price;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger pour updated_at sur currencies
DROP TRIGGER IF EXISTS update_currencies_updated_at ON public.currencies;
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur exchange_rates
DROP TRIGGER IF EXISTS update_exchange_rates_updated_at ON public.exchange_rates;
CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur regional_prices
DROP TRIGGER IF EXISTS update_regional_prices_updated_at ON public.regional_prices;
CREATE TRIGGER update_regional_prices_updated_at
  BEFORE UPDATE ON public.regional_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. DONNÉES INITIALES: Devises courantes
-- =====================================================

-- Insérer les devises de base si elles n'existent pas
INSERT INTO public.currencies (code, name, symbol, decimal_places, is_base_currency, country_code, region)
VALUES 
  ('XOF', 'Franc CFA (BCEAO)', 'FCFA', 0, TRUE, 'BF', 'West Africa'),
  ('USD', 'US Dollar', '$', 2, FALSE, 'US', 'North America'),
  ('EUR', 'Euro', '€', 2, FALSE, 'EU', 'Europe'),
  ('GBP', 'British Pound', '£', 2, FALSE, 'GB', 'Europe'),
  ('CAD', 'Canadian Dollar', 'CA$', 2, FALSE, 'CA', 'North America'),
  ('NGN', 'Nigerian Naira', '₦', 2, FALSE, 'NG', 'West Africa'),
  ('GHS', 'Ghanaian Cedi', 'GH₵', 2, FALSE, 'GH', 'West Africa'),
  ('XAF', 'Franc CFA (BEAC)', 'FCFA', 0, FALSE, 'CM', 'Central Africa')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 8. DONNÉES INITIALES: Taux de change de base
-- =====================================================

-- Taux de change approximatifs (à mettre à jour via API)
INSERT INTO public.exchange_rates (from_currency, to_currency, rate, source, auto_update)
VALUES 
  -- XOF vers autres devises
  ('XOF', 'USD', 0.0017, 'manual', TRUE),
  ('XOF', 'EUR', 0.0015, 'manual', TRUE),
  ('XOF', 'GBP', 0.0013, 'manual', TRUE),
  ('XOF', 'CAD', 0.0023, 'manual', TRUE),
  ('XOF', 'NGN', 1.30, 'manual', TRUE),
  ('XOF', 'GHS', 0.020, 'manual', TRUE),
  ('XOF', 'XAF', 1.0, 'manual', FALSE),
  
  -- USD vers autres devises
  ('USD', 'XOF', 600.0, 'manual', TRUE),
  ('USD', 'EUR', 0.92, 'manual', TRUE),
  ('USD', 'GBP', 0.79, 'manual', TRUE),
  ('USD', 'CAD', 1.35, 'manual', TRUE),
  ('USD', 'NGN', 780.0, 'manual', TRUE),
  
  -- EUR vers autres devises
  ('EUR', 'XOF', 655.96, 'manual', TRUE),
  ('EUR', 'USD', 1.09, 'manual', TRUE),
  ('EUR', 'GBP', 0.86, 'manual', TRUE),
  ('EUR', 'CAD', 1.47, 'manual', TRUE)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_conversion_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour currencies (tous peuvent voir, seuls propriétaires de stores peuvent modifier)
DROP POLICY IF EXISTS "Anyone can view currencies" ON public.currencies;
CREATE POLICY "Anyone can view currencies"
  ON public.currencies FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Store owners can manage currencies" ON public.currencies;
CREATE POLICY "Store owners can manage currencies"
  ON public.currencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Policies pour exchange_rates (tous peuvent voir, seuls propriétaires de stores peuvent modifier)
DROP POLICY IF EXISTS "Anyone can view exchange rates" ON public.exchange_rates;
CREATE POLICY "Anyone can view exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Store owners can manage exchange rates" ON public.exchange_rates;
CREATE POLICY "Store owners can manage exchange rates"
  ON public.exchange_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE user_id = auth.uid()
    )
  );

-- Policies pour regional_prices
DROP POLICY IF EXISTS "Store owners can manage regional prices" ON public.regional_prices;
CREATE POLICY "Store owners can manage regional prices"
  ON public.regional_prices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = regional_prices.product_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view regional prices" ON public.regional_prices;
CREATE POLICY "Anyone can view regional prices"
  ON public.regional_prices FOR SELECT
  USING (TRUE);

-- Policies pour conversion_logs (propriétaires peuvent voir leurs logs)
DROP POLICY IF EXISTS "Users can view their conversion logs" ON public.currency_conversion_logs;
CREATE POLICY "Users can view their conversion logs"
  ON public.currency_conversion_logs FOR SELECT
  USING (TRUE);

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE public.currencies IS 'Devises supportées par la plateforme';
COMMENT ON TABLE public.exchange_rates IS 'Taux de change entre devises avec mise à jour automatique';
COMMENT ON TABLE public.regional_prices IS 'Prix régionaux par produit et devise';
COMMENT ON TABLE public.currency_conversion_logs IS 'Logs des conversions de devises pour audit';

COMMENT ON FUNCTION convert_currency IS 'Convertir un montant d''une devise à une autre';
COMMENT ON FUNCTION get_product_price_in_currency IS 'Obtenir le prix d''un produit dans une devise spécifique (avec prix régionaux)';

