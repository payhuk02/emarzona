-- ================================================================
-- Table Upsell Tracking - Suivi des conversions upsell
-- Date: 26 Janvier 2025
-- ================================================================

CREATE TABLE IF NOT EXISTS public.upsell_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  original_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  upsell_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action tracking
  action TEXT NOT NULL CHECK (action IN ('shown', 'clicked', 'added_to_cart', 'purchased', 'dismissed')),
  
  -- Métadonnées
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_upsell_tracking_original_product ON public.upsell_tracking(original_product_id);
CREATE INDEX IF NOT EXISTS idx_upsell_tracking_upsell_product ON public.upsell_tracking(upsell_product_id);
CREATE INDEX IF NOT EXISTS idx_upsell_tracking_user_id ON public.upsell_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_upsell_tracking_created_at ON public.upsell_tracking(created_at DESC);

-- RLS
ALTER TABLE public.upsell_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own upsell tracking"
ON public.upsell_tracking FOR SELECT
USING (auth.uid() = user_id);

-- Store owners can view upsell stats for their products
CREATE POLICY "Store owners can view upsell tracking for their products"
ON public.upsell_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = upsell_tracking.original_product_id
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  )
);

-- Public can insert upsell tracking (for analytics)
CREATE POLICY "Public can insert upsell tracking"
ON public.upsell_tracking FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.upsell_tracking IS 'Tracking des interactions avec les offres upsell pour analytics';

