-- Add info_message column to stores table
-- This field allows store owners to display informational messages above the banner

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message TEXT;

COMMENT ON COLUMN public.stores.info_message IS 'Message informatif optionnel à afficher au-dessus de la bannière de la boutique (promotions, alertes, annonces, etc.)';

