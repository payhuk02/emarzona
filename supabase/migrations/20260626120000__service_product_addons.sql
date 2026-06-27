-- Phase 4 — Produits complémentaires liés à un service (digital / physical, même boutique)

CREATE TABLE IF NOT EXISTS public.service_product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  addon_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_product_id, addon_product_id)
);

CREATE INDEX IF NOT EXISTS idx_service_product_addons_service
  ON public.service_product_addons (service_product_id);

CREATE INDEX IF NOT EXISTS idx_service_product_addons_store
  ON public.service_product_addons (store_id);

CREATE OR REPLACE FUNCTION public.touch_service_product_addons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_product_addons_updated_at ON public.service_product_addons;
CREATE TRIGGER trg_service_product_addons_updated_at
  BEFORE UPDATE ON public.service_product_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_service_product_addons_updated_at();

ALTER TABLE public.service_product_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service addons" ON public.service_product_addons;
CREATE POLICY "Public read service addons"
  ON public.service_product_addons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_products sp
      INNER JOIN public.products ps ON ps.id = sp.product_id
      INNER JOIN public.products pa ON pa.id = service_product_addons.addon_product_id
      WHERE sp.id = service_product_addons.service_product_id
        AND ps.is_active = true
        AND pa.is_active = true
        AND pa.product_type IN ('digital', 'physical')
    )
  );

DROP POLICY IF EXISTS "Store owners manage service addons" ON public.service_product_addons;
CREATE POLICY "Store owners manage service addons"
  ON public.service_product_addons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_product_addons.store_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_product_addons.store_id
        AND s.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.service_products sp
      INNER JOIN public.products ps ON ps.id = sp.product_id
      WHERE sp.id = service_product_addons.service_product_id
        AND ps.store_id = service_product_addons.store_id
    )
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = service_product_addons.addon_product_id
        AND p.store_id = service_product_addons.store_id
        AND p.product_type IN ('digital', 'physical')
    )
  );

GRANT SELECT ON public.service_product_addons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_product_addons TO authenticated;

COMMENT ON TABLE public.service_product_addons IS
  'Produits digital/physical proposés en complément d''une réservation service (Phase 4 audit).';
