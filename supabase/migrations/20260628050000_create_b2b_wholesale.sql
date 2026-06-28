-- ==============================================================================
-- 🏢 Phase 5 - Sprint 4: B2B Wholesale & Volume Pricing
-- ==============================================================================
-- Ajoute les capacités Enterprise B2B à Emarzona :
-- - Qualification des clients B2B (Grossistes)
-- - Tarification dégressive par paliers (Volume Pricing)
-- ==============================================================================

-- 1. Ajout du flag B2B sur la table clients existante
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS is_b2b_customer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS tax_id text, -- NIF / VAT Number
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'due_on_receipt'; -- ex: 'net_30', 'net_60'

-- 2. Table de tarification au volume (Volume Pricing Rules)
CREATE TABLE IF NOT EXISTS public.product_volume_pricing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    min_quantity integer NOT NULL CHECK (min_quantity >= 2),
    discount_percentage numeric CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    fixed_price numeric CHECK (fixed_price >= 0),
    -- Une règle de volume s'applique soit à tout le monde (null), soit uniquement aux B2B
    requires_b2b boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    -- Contrainte d'exclusivité mutuelle : soit on a un pourcentage de réduction, soit un prix fixe
    CONSTRAINT check_pricing_type CHECK (
        (discount_percentage IS NOT NULL AND fixed_price IS NULL) OR 
        (discount_percentage IS NULL AND fixed_price IS NOT NULL)
    )
);

-- Index pour accélérer la résolution des prix dans le tunnel d'achat
CREATE INDEX IF NOT EXISTS idx_volume_pricing_product ON public.product_volume_pricing(product_id);

-- RLS
ALTER TABLE public.product_volume_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Volume pricing is viewable by everyone" ON public.product_volume_pricing;
CREATE POLICY "Volume pricing is viewable by everyone" ON public.product_volume_pricing FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage volume pricing" ON public.product_volume_pricing;
CREATE POLICY "Store owners can manage volume pricing" ON public.product_volume_pricing 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON s.id = p.store_id
            WHERE p.id = product_id AND s.user_id = auth.uid()
        )
    );
