-- Gate création produits physiques : abonnement plateforme requis (trialing ou active)

BEGIN;

CREATE OR REPLACE FUNCTION public.store_has_physical_ecommerce_access(p_store_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.store_platform_subscriptions sps
      JOIN public.platform_vendor_plans pvp ON pvp.id = sps.plan_id
      WHERE sps.store_id = p_store_id
        AND pvp.applies_to_product_type = 'physical'
        AND (
          sps.status = 'active'
          OR (
            sps.status = 'trialing'
            AND (sps.trial_ends_at IS NULL OR sps.trial_ends_at > now())
          )
        )
    );
$$;

COMMENT ON FUNCTION public.store_has_physical_ecommerce_access(UUID) IS
  'True si la boutique peut créer/vendre des produits physiques (essai actif ou abonnement payant).';

GRANT EXECUTE ON FUNCTION public.store_has_physical_ecommerce_access(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_physical_product_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_type = 'physical'
     AND NOT public.store_has_physical_ecommerce_access(NEW.store_id) THEN
    RAISE EXCEPTION
      'PHYSICAL_SUBSCRIPTION_REQUIRED: Un abonnement produits physiques actif (ou essai en cours) est requis.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_physical_product_subscription ON public.products;
CREATE TRIGGER enforce_physical_product_subscription
  BEFORE INSERT OR UPDATE OF product_type, store_id ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_physical_product_subscription();

-- RLS INSERT : propriétaire + gate physique
DROP POLICY IF EXISTS "Store owners can insert products" ON public.products;
CREATE POLICY "Store owners can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.user_id = auth.uid()
    )
    AND (
      COALESCE(product_type, '') <> 'physical'
      OR public.store_has_physical_ecommerce_access(store_id)
    )
  );

-- RLS UPDATE : empêcher conversion vers physical sans abonnement
DROP POLICY IF EXISTS "Store owners can update products" ON public.products;
CREATE POLICY "Store owners can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.user_id = auth.uid()
    )
    AND (
      COALESCE(product_type, '') <> 'physical'
      OR public.store_has_physical_ecommerce_access(store_id)
    )
  );

COMMIT;
