-- =========================================================
-- Migration : Ajout photo artiste et lien œuvre
-- Date : 28 Février 2025
-- Description : Ajoute la possibilité d'ajouter une photo de l'artiste
--               et un lien vers l'œuvre si elle n'est pas physique
-- =========================================================

-- Ajouter la colonne pour la photo de l'artiste
ALTER TABLE public.artist_products
ADD COLUMN IF NOT EXISTS artist_photo_url TEXT;

COMMENT ON COLUMN public.artist_products.artist_photo_url IS 'URL de la photo de l''artiste (optionnel)';

-- Ajouter la colonne pour le lien de l'œuvre (si non physique)
ALTER TABLE public.artist_products
ADD COLUMN IF NOT EXISTS artwork_link_url TEXT;

COMMENT ON COLUMN public.artist_products.artwork_link_url IS 'URL vers l''œuvre si elle n''est pas physique (ex: lien vers une vidéo, un livre numérique, une musique en streaming, etc.)';

-- Ajouter un index pour les recherches par lien
CREATE INDEX IF NOT EXISTS idx_artist_products_artwork_link_url 
ON public.artist_products(artwork_link_url) 
WHERE artwork_link_url IS NOT NULL;


