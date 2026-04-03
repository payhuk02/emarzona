-- =========================================================
-- Migration : Indexes Composites pour Performance Service
-- Date : 1 Février 2025
-- Description : Ajout d'indexes composites pour améliorer les performances
-- des requêtes complexes sur les tables de services
-- =========================================================

-- ============================================================
-- 1. INDEXES COMPOSITES service_bookings
-- ============================================================

-- Index pour requêtes filtrées par date et statut
-- Utilisé pour: Vérifier disponibilité, compter bookings par jour
CREATE INDEX IF NOT EXISTS idx_service_bookings_date_status 
ON public.service_bookings(scheduled_date, status) 
WHERE status IN ('pending', 'confirmed', 'rescheduled');

-- Index pour requêtes filtrées par staff et date
-- Utilisé pour: Vérifier disponibilité staff, planning staff
CREATE INDEX IF NOT EXISTS idx_service_bookings_staff_date 
ON public.service_bookings(staff_member_id, scheduled_date) 
WHERE staff_member_id IS NOT NULL;

-- Index pour requêtes filtrées par produit, date et statut
-- Utilisé pour: max_bookings_per_day, statistiques
CREATE INDEX IF NOT EXISTS idx_service_bookings_product_date_status 
ON public.service_bookings(product_id, scheduled_date, status);

-- Index pour requêtes de recherche par utilisateur et date
-- Utilisé pour: Mes réservations, historique client
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_date 
ON public.service_bookings(user_id, scheduled_date DESC);

-- Index pour requêtes filtrées par produit et staff
-- Utilisé pour: Disponibilité staff par service
CREATE INDEX IF NOT EXISTS idx_service_bookings_product_staff 
ON public.service_bookings(product_id, staff_member_id) 
WHERE staff_member_id IS NOT NULL;

-- ============================================================
-- 2. INDEXES COMPOSITES service_availability_slots
-- ============================================================

-- Index pour requêtes filtrées par jour et statut actif
-- Utilisé pour: Obtenir créneaux disponibles par jour
CREATE INDEX IF NOT EXISTS idx_service_availability_day_active 
ON public.service_availability_slots(day_of_week, is_active) 
WHERE is_active = TRUE;

-- Index pour requêtes filtrées par service et jour
-- Utilisé pour: Disponibilité par service et jour
CREATE INDEX IF NOT EXISTS idx_service_availability_service_day 
ON public.service_availability_slots(service_product_id, day_of_week, is_active);

-- Index pour requêtes filtrées par staff et jour
-- Utilisé pour: Disponibilité staff spécifique
CREATE INDEX IF NOT EXISTS idx_service_availability_staff_day 
ON public.service_availability_slots(staff_member_id, day_of_week, is_active) 
WHERE staff_member_id IS NOT NULL;

-- ============================================================
-- 3. INDEXES COMPOSITES service_staff_members
-- ============================================================

-- Index pour requêtes filtrées par service et statut actif
-- Utilisé pour: Liste staff actifs par service
CREATE INDEX IF NOT EXISTS idx_service_staff_active 
ON public.service_staff_members(service_product_id, is_active) 
WHERE is_active = TRUE;

-- Index pour requêtes filtrées par store et statut
-- Utilisé pour: Gestion staff par boutique
CREATE INDEX IF NOT EXISTS idx_service_staff_store_active 
ON public.service_staff_members(store_id, is_active);

-- ============================================================
-- 4. INDEXES COMPOSITES service_products
-- ============================================================

-- Index pour requêtes filtrées par type de service et statut
-- Utilisé pour: Recherche services par type
CREATE INDEX IF NOT EXISTS idx_service_products_type_active 
ON public.service_products(service_type)
INCLUDE (product_id, max_participants, pricing_type);

-- ============================================================
-- 5. COMMENTAIRES POUR DOCUMENTATION
-- ============================================================

COMMENT ON INDEX idx_service_bookings_date_status IS 
  'Index composite pour filtrer les bookings par date et statut. Utilisé pour vérifier disponibilité et compter réservations quotidiennes.';

COMMENT ON INDEX idx_service_bookings_staff_date IS 
  'Index composite pour filtrer les bookings par staff et date. Utilisé pour vérifier disponibilité staff et générer planning.';

COMMENT ON INDEX idx_service_bookings_product_date_status IS 
  'Index composite pour filtrer les bookings par produit, date et statut. Utilisé pour max_bookings_per_day et statistiques.';

COMMENT ON INDEX idx_service_availability_day_active IS 
  'Index composite pour obtenir rapidement les créneaux disponibles par jour de la semaine.';

COMMENT ON INDEX idx_service_staff_active IS 
  'Index composite pour obtenir rapidement la liste des staff membres actifs par service.';



