-- =========================================================
-- Migration : Ajouter tracking d'affiliation dans orders
-- Date : 24/11/2025
-- Description : Ajoute la colonne affiliate_tracking_cookie dans orders
--               pour permettre l'attribution précise des commissions
-- =========================================================

-- Ajouter colonne affiliate_tracking_cookie dans orders si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'affiliate_tracking_cookie'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN affiliate_tracking_cookie TEXT;
    
    RAISE NOTICE 'Colonne affiliate_tracking_cookie ajoutée à orders';
  ELSE
    RAISE NOTICE 'Colonne affiliate_tracking_cookie existe déjà';
  END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_tracking_cookie 
ON public.orders(affiliate_tracking_cookie) 
WHERE affiliate_tracking_cookie IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN public.orders.affiliate_tracking_cookie IS 'Cookie de tracking d''affiliation pour attribuer la commission au bon affilié';

