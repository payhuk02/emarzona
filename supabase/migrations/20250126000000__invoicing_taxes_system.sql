-- ================================================================
-- Système de Facturation (Invoicing) et Gestion des Taxes
-- Date: 26 Janvier 2025
-- 
-- Fonctionnalités:
-- - Génération automatique factures PDF
-- - Templates factures configurables
-- - Envoi automatique par email
-- - Gestion taxes par pays/région
-- - Calcul automatique TVA
-- ================================================================

-- ================================================================
-- 1. TABLE INVOICES (Factures)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Relations
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations facture
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Montants
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  shipping_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Taxes détaillées (JSON pour support multi-taxes)
  tax_breakdown JSONB DEFAULT '[]'::jsonb, -- [{type: 'TVA', rate: 18, amount: 1000}, ...]
  
  -- Informations client (snapshot au moment de la facture)
  billing_address JSONB, -- {name, email, phone, address, city, postal_code, country, tax_id}
  
  -- Informations store (snapshot)
  store_info JSONB, -- {name, address, city, postal_code, country, tax_id, logo_url}
  
  -- Métadonnées
  notes TEXT,
  terms TEXT,
  payment_terms TEXT,
  
  -- Fichier PDF
  pdf_url TEXT, -- URL vers le PDF généré dans Supabase Storage
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Email
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_recipient TEXT,
  
  -- Suivi
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON public.invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date DESC);

-- ================================================================
-- 2. TABLE INVOICE ITEMS (Lignes de facture)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Produit
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_type TEXT, -- digital, physical, service, course
  product_name TEXT NOT NULL,
  product_description TEXT,
  
  -- Quantité et prix
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb, -- SKU, variant, etc.
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);

-- ================================================================
-- 3. TABLE TAX CONFIGURATIONS (Configuration Taxes)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.tax_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Portée
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- NULL = platform-wide
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 (BF, FR, CI, etc.)
  state_province TEXT, -- NULL = s'applique à tout le pays
  
  -- Type de taxe
  tax_type TEXT NOT NULL DEFAULT 'VAT' CHECK (tax_type IN ('VAT', 'GST', 'SALES_TAX', 'CUSTOM')),
  tax_name TEXT NOT NULL, -- "TVA", "GST", "Taxe sur les ventes"
  
  -- Taux
  rate NUMERIC(5, 2) NOT NULL, -- 18.00 pour 18%
  
  -- Règles
  applies_to_product_types TEXT[] DEFAULT NULL, -- NULL = tous les types, ['digital', 'physical']
  applies_to_shipping BOOLEAN DEFAULT false,
  tax_inclusive BOOLEAN DEFAULT false, -- Si true, le prix inclut déjà la taxe
  
  -- Priorité (pour règles multiples)
  priority INTEGER DEFAULT 0, -- Plus élevé = appliqué en premier
  
  -- Dates
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL = toujours actif
  
  -- Statut
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte: une seule config active par store/country/state à la fois
  CONSTRAINT unique_active_tax_config UNIQUE (store_id, country_code, state_province, tax_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tax_config_store_id ON public.tax_configurations(store_id);
CREATE INDEX IF NOT EXISTS idx_tax_config_country ON public.tax_configurations(country_code);
CREATE INDEX IF NOT EXISTS idx_tax_config_active ON public.tax_configurations(is_active) WHERE is_active = true;

-- ================================================================
-- 4. RLS POLICIES
-- ================================================================

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their invoices"
ON public.invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = invoices.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can view their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Store owners can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = invoices.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their invoices"
ON public.invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = invoices.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Invoice Items (hérite des permissions de la facture)
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items of accessible invoices"
ON public.invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND (
      invoices.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = invoices.store_id
        AND stores.user_id = auth.uid()
      )
    )
  )
);

-- Tax Configurations
ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active tax configurations"
ON public.tax_configurations FOR SELECT
USING (is_active = true);

CREATE POLICY "Store owners can manage their tax configurations"
ON public.tax_configurations FOR ALL
USING (
  store_id IS NULL -- Platform admin only
  OR EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = tax_configurations.store_id
    AND stores.user_id = auth.uid()
  )
);

-- ================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ================================================================

-- Fonction pour générer numéro de facture unique
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Trouver le dernier numéro de l'année
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0)
  INTO last_number
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_prefix || '%';
  
  -- Générer nouveau numéro
  new_number := 'INV-' || year_prefix || '-' || LPAD((last_number + 1)::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;

-- Fonction pour calculer les taxes d'une commande
CREATE OR REPLACE FUNCTION public.calculate_order_taxes(
  p_order_id UUID,
  p_country_code TEXT,
  p_state_province TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  tax_config RECORD;
  tax_breakdown JSONB := '[]'::jsonb;
  total_tax NUMERIC(10, 2) := 0;
  subtotal NUMERIC(10, 2);
  shipping_amount NUMERIC(10, 2);
  tax_entry JSONB;
BEGIN
  -- Récupérer la commande
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  subtotal := order_record.total_amount - COALESCE((order_record.metadata->>'shipping_amount')::NUMERIC, 0);
  shipping_amount := COALESCE((order_record.metadata->>'shipping_amount')::NUMERIC, 0);

  -- Trouver les configurations de taxes applicables
  FOR tax_config IN
    SELECT *
    FROM public.tax_configurations
    WHERE is_active = true
      AND country_code = p_country_code
      AND (state_province IS NULL OR state_province = p_state_province)
      AND (store_id = p_store_id OR store_id IS NULL)
      AND (effective_from <= CURRENT_DATE)
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY priority DESC, created_at DESC
  LOOP
    -- Calculer le montant de la taxe
    DECLARE
      taxable_amount NUMERIC(10, 2);
      calculated_tax NUMERIC(10, 2);
    BEGIN
      -- Déterminer le montant imposable
      IF tax_config.applies_to_shipping THEN
        taxable_amount := subtotal + shipping_amount;
      ELSE
        taxable_amount := subtotal;
      END IF;

      -- Calculer la taxe
      IF tax_config.tax_inclusive THEN
        -- Taxe incluse: extraire la taxe du montant
        calculated_tax := taxable_amount - (taxable_amount / (1 + tax_config.rate / 100));
      ELSE
        -- Taxe ajoutée: ajouter la taxe au montant
        calculated_tax := taxable_amount * (tax_config.rate / 100);
      END IF;

      total_tax := total_tax + calculated_tax;

      -- Ajouter à la breakdown
      tax_entry := jsonb_build_object(
        'type', tax_config.tax_type,
        'name', tax_config.tax_name,
        'rate', tax_config.rate,
        'amount', calculated_tax,
        'applies_to_shipping', tax_config.applies_to_shipping
      );

      tax_breakdown := tax_breakdown || tax_entry;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'tax_amount', total_tax,
    'tax_breakdown', tax_breakdown,
    'subtotal', subtotal,
    'shipping_amount', shipping_amount,
    'total_with_tax', subtotal + shipping_amount + total_tax
  );
END;
$$;

-- Fonction pour créer une facture depuis une commande
CREATE OR REPLACE FUNCTION public.create_invoice_from_order(
  p_order_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  invoice_id UUID;
  invoice_number TEXT;
  billing_info JSONB;
  store_info JSONB;
  tax_calculation JSONB;
BEGIN
  -- Récupérer la commande
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Vérifier qu'il n'existe pas déjà une facture
  IF EXISTS (SELECT 1 FROM public.invoices WHERE order_id = p_order_id) THEN
    SELECT id INTO invoice_id FROM public.invoices WHERE order_id = p_order_id LIMIT 1;
    RETURN invoice_id;
  END IF;

  -- Générer numéro de facture
  invoice_number := generate_invoice_number();

  -- Préparer billing address (depuis shipping_address de la commande)
  billing_info := COALESCE(order_record.shipping_address, '{}'::jsonb);

  -- Récupérer store info
  SELECT jsonb_build_object(
    'name', name,
    'address', address,
    'city', city,
    'postal_code', postal_code,
    'country', country,
    'tax_id', tax_id,
    'logo_url', logo_url
  )
  INTO store_info
  FROM public.stores
  WHERE id = order_record.store_id;

  -- Calculer les taxes
  SELECT calculate_order_taxes(
    p_order_id,
    COALESCE(billing_info->>'country', 'BF'),
    billing_info->>'state',
    order_record.store_id
  ) INTO tax_calculation;

  -- Créer la facture
  INSERT INTO public.invoices (
    invoice_number,
    order_id,
    store_id,
    customer_id,
    subtotal,
    discount_amount,
    tax_amount,
    shipping_amount,
    total_amount,
    currency,
    tax_breakdown,
    billing_address,
    store_info,
    status
  ) VALUES (
    invoice_number,
    p_order_id,
    order_record.store_id,
    order_record.customer_id,
    COALESCE((tax_calculation->>'subtotal')::NUMERIC, order_record.total_amount),
    COALESCE((order_record.metadata->>'discount_amount')::NUMERIC, 0),
    COALESCE((tax_calculation->>'tax_amount')::NUMERIC, 0),
    COALESCE((tax_calculation->>'shipping_amount')::NUMERIC, 0),
    COALESCE((tax_calculation->>'total_with_tax')::NUMERIC, order_record.total_amount),
    order_record.currency,
    tax_calculation->'tax_breakdown',
    billing_info,
    store_info,
    'draft'
  ) RETURNING id INTO invoice_id;

  -- Créer les lignes de facture depuis order_items
  INSERT INTO public.invoice_items (
    invoice_id,
    product_id,
    product_type,
    product_name,
    quantity,
    unit_price,
    total_price
  )
  SELECT
    invoice_id,
    product_id,
    product_type,
    product_name,
    quantity,
    unit_price,
    total_price
  FROM public.order_items
  WHERE order_id = p_order_id;

  RETURN invoice_id;
END;
$$;

-- Trigger pour updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_configurations_updated_at
BEFORE UPDATE ON public.tax_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- 6. DONNÉES INITIALES (Taxes pour Burkina Faso)
-- ================================================================

INSERT INTO public.tax_configurations (country_code, tax_type, tax_name, rate, is_active)
VALUES 
  ('BF', 'VAT', 'TVA', 18.00, true),
  ('CI', 'VAT', 'TVA', 18.00, true),
  ('SN', 'VAT', 'TVA', 18.00, true),
  ('ML', 'VAT', 'TVA', 18.00, true),
  ('NE', 'VAT', 'TVA', 19.00, true),
  ('TG', 'VAT', 'TVA', 18.00, true),
  ('BJ', 'VAT', 'TVA', 18.00, true)
ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE public.invoices IS 'Factures générées automatiquement depuis les commandes';
COMMENT ON TABLE public.invoice_items IS 'Lignes détaillées des factures';
COMMENT ON TABLE public.tax_configurations IS 'Configuration des taxes par pays/région';
COMMENT ON FUNCTION public.generate_invoice_number IS 'Génère un numéro de facture unique au format INV-YYYY-NNNNNN';
COMMENT ON FUNCTION public.calculate_order_taxes IS 'Calcule les taxes applicables à une commande selon le pays/région';
COMMENT ON FUNCTION public.create_invoice_from_order IS 'Crée automatiquement une facture depuis une commande avec calcul des taxes';

