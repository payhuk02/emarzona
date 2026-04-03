-- Add style columns for info_message (color and font)
-- This allows store owners to customize the appearance of their informational message

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message_color TEXT DEFAULT '#3b82f6';

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message_font TEXT DEFAULT 'Inter';

COMMENT ON COLUMN public.stores.info_message_color IS 'Couleur du message informatif (format hex: #RRGGBB)';
COMMENT ON COLUMN public.stores.info_message_font IS 'Police du message informatif (nom de la police CSS)';

