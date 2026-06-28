-- Migration: Système de TTL (Time To Live) pour les réservations d'inventaire physique
-- Date: 2026-06-28
-- Objectif: Empêcher le verrouillage permanent du stock par des paiements abandonnés.

-- 1. Création de la fonction de nettoyage
CREATE OR REPLACE FUNCTION public.cleanup_expired_physical_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Trouver les commandes 'pending' (non COD) de plus de 15 minutes 
  -- contenant des articles physiques avec stock réservé
  FOR v_order IN
    SELECT DISTINCT o.id
    FROM public.orders o
    INNER JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.payment_status = 'pending'
      AND o.created_at < now() - interval '15 minutes'
      AND oi.product_type = 'physical'
      AND COALESCE((oi.item_metadata->>'inventory_reserved')::boolean, false) = true
  LOOP
    -- Mettre à jour la commande pour annuler le paiement
    -- Le trigger existant 'release_physical_inventory_on_order_unpaid' (créé dans 20260531170000)
    -- va automatiquement s'exécuter sur cet UPDATE et libérer le stock réservé.
    UPDATE public.orders
    SET 
      payment_status = 'cancelled',
      status = 'cancelled',
      notes = COALESCE(notes || e'\n', '') || 'Commande annulée automatiquement : expiration du délai de paiement (15 min).',
      updated_at = now()
    WHERE id = v_order.id;
  END LOOP;
END;
$$;

-- 2. Configuration du Cron Job via pg_cron
-- Exécution toutes les 5 minutes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Supprimer le job s'il existe déjà pour éviter les doublons
    IF EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-physical-reservations'
    ) THEN
      PERFORM cron.unschedule('cleanup-expired-physical-reservations');
    END IF;
    
    -- Planifier le job
    PERFORM cron.schedule(
      'cleanup-expired-physical-reservations',
      '*/5 * * * *',
      'SELECT public.cleanup_expired_physical_reservations();'
    );
  ELSE
    RAISE NOTICE 'Extension pg_cron non disponible, le job n''a pas été planifié.';
  END IF;
END $$;
