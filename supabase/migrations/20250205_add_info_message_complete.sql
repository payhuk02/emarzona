-- Migration complète pour le message informatif de la boutique
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne info_message
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message TEXT;

COMMENT ON COLUMN public.stores.info_message IS 'Message informatif optionnel à afficher au-dessus de la bannière de la boutique (promotions, alertes, annonces, etc.)';

-- 2. Ajouter les colonnes de style (couleur et police)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message_color TEXT DEFAULT '#3b82f6';

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message_font TEXT DEFAULT 'Inter';

COMMENT ON COLUMN public.stores.info_message_color IS 'Couleur du message informatif (format hex: #RRGGBB)';
COMMENT ON COLUMN public.stores.info_message_font IS 'Police du message informatif (nom de la police CSS)';

-- Vérification : Afficher les colonnes créées
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'stores'
  AND column_name IN ('info_message', 'info_message_color', 'info_message_font');

