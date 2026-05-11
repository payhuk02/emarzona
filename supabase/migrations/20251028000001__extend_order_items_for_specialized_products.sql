/**
 * Migration: Extend order_items for Specialized Products
 * Date: 28 octobre 2025
 * 
 * Objectif: Permettre aux order_items de référencer des produits spécialisés
 * (Digital, Physical, Service) en plus du produit générique
 * 
 * Architecture:
 * - Conserve product_id (backward compatibility)
 * - Ajoute product_type pour identifier le type
 * - Ajoute foreign keys vers tables spécialisées
 * - Ajoute références aux entités liées (licences, variants, bookings)
 */

-- ===========================================
-- 1. AJOUTER COLONNES À order_items
-- ===========================================

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_type TEXT CHECK (product_type IN (
  'digital', 
  'physical', 
  'service', 
  'course', 
  'generic'
)) DEFAULT 'generic',

-- Références vers produits spécialisés (foreign keys optionnelles)
ADD COLUMN IF NOT EXISTS digital_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS service_product_id UUID REFERENCES public.service_products(id) ON DELETE SET NULL,

-- Références vers entités liées
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.physical_product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES public.digital_licenses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,

-- Métadonnées spécifiques au type
ADD COLUMN IF NOT EXISTS item_metadata JSONB DEFAULT '{}'::jsonb;

-- ===========================================
-- 2. COMMENTAIRES POUR DOCUMENTATION
-- ===========================================

COMMENT ON COLUMN public.order_items.product_type IS 
  'Type de produit: digital, physical, service, course, ou generic';

COMMENT ON COLUMN public.order_items.digital_product_id IS 
  'Référence vers digital_products si product_type=digital';

COMMENT ON COLUMN public.order_items.physical_product_id IS 
  'Référence vers physical_products si product_type=physical';

COMMENT ON COLUMN public.order_items.service_product_id IS 
  'Référence vers service_products si product_type=service';

COMMENT ON COLUMN public.order_items.variant_id IS 
  'Variante sélectionnée pour produits physiques (optionnel)';

COMMENT ON COLUMN public.order_items.license_id IS 
  'Licence générée pour produits digitaux (optionnel)';

COMMENT ON COLUMN public.order_items.booking_id IS 
  'Réservation créée pour services (optionnel)';

COMMENT ON COLUMN public.order_items.item_metadata IS 
  'Métadonnées additionnelles selon le type de produit';

-- ===========================================
-- 3. CRÉER INDEXES POUR PERFORMANCE
-- ===========================================

-- Index sur product_type pour requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_order_items_product_type 
  ON public.order_items(product_type);

-- Indexes sur foreign keys spécialisées
CREATE INDEX IF NOT EXISTS idx_order_items_digital_product 
  ON public.order_items(digital_product_id) 
  WHERE digital_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_physical_product 
  ON public.order_items(physical_product_id) 
  WHERE physical_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_service_product 
  ON public.order_items(service_product_id) 
  WHERE service_product_id IS NOT NULL;

-- Indexes sur entités liées
CREATE INDEX IF NOT EXISTS idx_order_items_variant 
  ON public.order_items(variant_id) 
  WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_license 
  ON public.order_items(license_id) 
  WHERE license_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_booking 
  ON public.order_items(booking_id) 
  WHERE booking_id IS NOT NULL;

-- Index composite pour requêtes complexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_product_type 
  ON public.order_items(order_id, product_type);

-- ===========================================
-- 4. FONCTION HELPER POUR RÉCUPÉRER DÉTAILS PRODUIT
-- ===========================================

/**
 * Fonction pour récupérer les détails complets d'un order_item
 * selon son type de produit
 */
CREATE OR REPLACE FUNCTION public.get_order_item_product_details(
  item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
  result JSONB;
BEGIN
  -- Récupérer l'order_item
  SELECT * INTO item 
  FROM public.order_items 
  WHERE id = item_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Construire résultat selon le type
  CASE item.product_type
    WHEN 'digital' THEN
      SELECT jsonb_build_object(
        'type', 'digital',
        'product', row_to_json(p.*),
        'digital_product', row_to_json(dp.*),
        'license', row_to_json(l.*)
      ) INTO result
      FROM public.products p
      LEFT JOIN public.digital_products dp ON dp.product_id = p.id
      LEFT JOIN public.digital_licenses l ON l.id = item.license_id
      WHERE p.id = item.product_id;

    WHEN 'physical' THEN
      SELECT jsonb_build_object(
        'type', 'physical',
        'product', row_to_json(p.*),
        'physical_product', row_to_json(pp.*),
        'variant', row_to_json(v.*)
      ) INTO result
      FROM public.products p
      LEFT JOIN public.physical_products pp ON pp.product_id = p.id
      LEFT JOIN public.physical_product_variants v ON v.id = item.variant_id
      WHERE p.id = item.product_id;

    WHEN 'service' THEN
      SELECT jsonb_build_object(
        'type', 'service',
        'product', row_to_json(p.*),
        'service_product', row_to_json(sp.*),
        'booking', row_to_json(b.*)
      ) INTO result
      FROM public.products p
      LEFT JOIN public.service_products sp ON sp.product_id = p.id
      LEFT JOIN public.service_bookings b ON b.id = item.booking_id
      WHERE p.id = item.product_id;

    ELSE
      -- Produit générique ou course
      SELECT jsonb_build_object(
        'type', item.product_type,
        'product', row_to_json(p.*)
      ) INTO result
      FROM public.products p
      WHERE p.id = item.product_id;
  END CASE;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_order_item_product_details IS 
  'Récupère les détails complets d''un order_item selon son type';

-- ===========================================
-- 5. TRIGGER POUR VALIDATION COHÉRENCE
-- ===========================================

/**
 * Fonction de validation pour s'assurer que les foreign keys
 * correspondent au product_type
 */
CREATE OR REPLACE FUNCTION public.validate_order_item_product_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validation selon le type
  CASE NEW.product_type
    WHEN 'digital' THEN
      IF NEW.digital_product_id IS NULL THEN
        RAISE EXCEPTION 'digital_product_id requis pour product_type=digital';
      END IF;
      -- Nettoyer autres références
      NEW.physical_product_id := NULL;
      NEW.service_product_id := NULL;

    WHEN 'physical' THEN
      IF NEW.physical_product_id IS NULL THEN
        RAISE EXCEPTION 'physical_product_id requis pour product_type=physical';
      END IF;
      -- Nettoyer autres références
      NEW.digital_product_id := NULL;
      NEW.service_product_id := NULL;
      NEW.license_id := NULL;
      NEW.booking_id := NULL;

    WHEN 'service' THEN
      IF NEW.service_product_id IS NULL THEN
        RAISE EXCEPTION 'service_product_id requis pour product_type=service';
      END IF;
      -- Nettoyer autres références
      NEW.digital_product_id := NULL;
      NEW.physical_product_id := NULL;
      NEW.license_id := NULL;
      NEW.variant_id := NULL;

    WHEN 'generic', 'course' THEN
      -- Pas de validation spéciale
      NULL;

    ELSE
      RAISE EXCEPTION 'product_type invalide: %', NEW.product_type;
  END CASE;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS validate_order_item_type ON public.order_items;
CREATE TRIGGER validate_order_item_type
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_item_product_type();

-- ===========================================
-- 6. MIGRATION DES DONNÉES EXISTANTES
-- ===========================================

/**
 * Mettre à jour les order_items existants pour définir le product_type
 * basé sur le product.product_type
 */
UPDATE public.order_items oi
SET product_type = COALESCE(p.product_type, 'generic')
FROM public.products p
WHERE oi.product_id = p.id
  AND oi.product_type = 'generic';

-- ===========================================
-- 7. GRANTS (PERMISSIONS)
-- ===========================================

-- Permettre l'utilisation de la fonction helper
GRANT EXECUTE ON FUNCTION public.get_order_item_product_details TO authenticated;

-- ===========================================
-- FIN DE MIGRATION
-- ===========================================

-- Log de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration order_items pour produits spécialisés terminée avec succès';
END $$;

