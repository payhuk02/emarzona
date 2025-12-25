-- =========================================================
-- Migration : Validations Serveur pour Produits Artistes
-- Date : 1 Mars 2025
-- Description : Ajoute les fonctions de validation PostgreSQL
--               et les triggers pour valider les données des produits artistes
-- =========================================================

-- =========================================================
-- FONCTION : Valider les dimensions d'œuvre
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artwork_dimensions(
  p_dimensions JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_width NUMERIC;
  v_height NUMERIC;
  v_depth NUMERIC;
  v_unit TEXT;
BEGIN
  -- Si null, c'est valide (optionnel)
  IF p_dimensions IS NULL THEN
    RETURN true;
  END IF;

  -- Extraire les valeurs
  v_width := (p_dimensions->>'width')::NUMERIC;
  v_height := (p_dimensions->>'height')::NUMERIC;
  v_depth := (p_dimensions->>'depth')::NUMERIC;
  v_unit := p_dimensions->>'unit';

  -- Valider l'unité
  IF v_unit IS NOT NULL AND v_unit NOT IN ('cm', 'in') THEN
    RETURN false;
  END IF;

  -- Valider que les valeurs sont positives si fournies
  IF v_width IS NOT NULL AND v_width <= 0 THEN
    RETURN false;
  END IF;

  IF v_height IS NOT NULL AND v_height <= 0 THEN
    RETURN false;
  END IF;

  IF v_depth IS NOT NULL AND v_depth <= 0 THEN
    RETURN false;
  END IF;

  -- Limites raisonnables (max 1000 cm ou 1000 in)
  IF v_width IS NOT NULL AND v_width > 1000 THEN
    RETURN false;
  END IF;

  IF v_height IS NOT NULL AND v_height > 1000 THEN
    RETURN false;
  END IF;

  IF v_depth IS NOT NULL AND v_depth > 1000 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_artwork_dimensions IS 'Valide la structure et les valeurs des dimensions d''œuvre (width, height, depth, unit)';

-- =========================================================
-- FONCTION : Valider l'année de création
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artwork_year(
  p_year INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Si null, c'est valide (optionnel)
  IF p_year IS NULL THEN
    RETURN true;
  END IF;

  -- Année doit être entre 1900 et année actuelle
  IF p_year < 1900 OR p_year > EXTRACT(YEAR FROM CURRENT_DATE) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_artwork_year IS 'Valide que l''année de création est entre 1900 et l''année actuelle';

-- =========================================================
-- FONCTION : Valider les informations d'édition limitée
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_edition_info(
  p_edition_type TEXT,
  p_edition_number INTEGER,
  p_total_editions INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Si ce n'est pas une édition limitée, pas besoin de validation
  IF p_edition_type != 'limited_edition' THEN
    RETURN true;
  END IF;

  -- Pour édition limitée, numéro et total sont requis
  IF p_edition_number IS NULL OR p_total_editions IS NULL THEN
    RETURN false;
  END IF;

  -- Numéro d'édition doit être positif
  IF p_edition_number <= 0 THEN
    RETURN false;
  END IF;

  -- Total d'éditions doit être positif
  IF p_total_editions <= 0 THEN
    RETURN false;
  END IF;

  -- Numéro d'édition ne peut pas être supérieur au total
  IF p_edition_number > p_total_editions THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_edition_info IS 'Valide la cohérence des informations d''édition limitée';

-- =========================================================
-- FONCTION : Valider la cohérence shipping/artwork_link
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_shipping_artwork_link(
  p_requires_shipping BOOLEAN,
  p_artwork_link_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Si expédition requise, pas besoin de lien
  IF p_requires_shipping = true THEN
    RETURN true;
  END IF;

  -- Si pas d'expédition, un lien est requis
  IF p_requires_shipping = false AND (p_artwork_link_url IS NULL OR trim(p_artwork_link_url) = '') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_shipping_artwork_link IS 'Valide que si requires_shipping = false, artwork_link_url est fourni';

-- =========================================================
-- FONCTION : Valider l'URL de l'œuvre
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artwork_link_url(
  p_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Si null, c'est valide (optionnel si shipping requis)
  IF p_url IS NULL THEN
    RETURN true;
  END IF;

  -- Valider que c'est une URL valide (commence par http:// ou https://)
  IF NOT (p_url ~* '^https?://[^\s/$.?#].[^\s]*$') THEN
    RETURN false;
  END IF;

  -- Limiter la longueur (max 2048 caractères)
  IF length(p_url) > 2048 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_artwork_link_url IS 'Valide le format de l''URL de l''œuvre (http/https, longueur max 2048)';

-- =========================================================
-- FONCTION : Valider l'année et les dimensions ensemble
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artwork_basic_info(
  p_year INTEGER,
  p_dimensions JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Valider année
  IF NOT public.validate_artwork_year(p_year) THEN
    RETURN false;
  END IF;

  -- Valider dimensions
  IF NOT public.validate_artwork_dimensions(p_dimensions) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_artwork_basic_info IS 'Valide les informations de base de l''œuvre (année et dimensions)';

-- =========================================================
-- FONCTION : Validation complète d'un produit artiste
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artist_product(
  p_artist_type TEXT,
  p_artist_name TEXT,
  p_artwork_title TEXT,
  p_artwork_year INTEGER,
  p_artwork_dimensions JSONB,
  p_artwork_edition_type TEXT,
  p_edition_number INTEGER,
  p_total_editions INTEGER,
  p_requires_shipping BOOLEAN,
  p_artwork_link_url TEXT,
  p_shipping_handling_time INTEGER,
  p_shipping_insurance_amount NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Validation type d'artiste
  IF p_artist_type IS NULL OR trim(p_artist_type) = '' THEN
    RETURN 'Le type d''artiste est requis';
  END IF;

  IF p_artist_type NOT IN ('writer', 'musician', 'visual_artist', 'designer', 'multimedia', 'other') THEN
    RETURN 'Type d''artiste invalide';
  END IF;

  -- Validation nom d'artiste
  IF p_artist_name IS NULL OR trim(p_artist_name) = '' THEN
    RETURN 'Le nom de l''artiste est requis';
  END IF;

  IF length(trim(p_artist_name)) < 2 THEN
    RETURN 'Le nom de l''artiste doit contenir au moins 2 caractères';
  END IF;

  IF length(trim(p_artist_name)) > 200 THEN
    RETURN 'Le nom de l''artiste ne peut pas dépasser 200 caractères';
  END IF;

  -- Validation titre œuvre
  IF p_artwork_title IS NULL OR trim(p_artwork_title) = '' THEN
    RETURN 'Le titre de l''œuvre est requis';
  END IF;

  IF length(trim(p_artwork_title)) < 2 THEN
    RETURN 'Le titre de l''œuvre doit contenir au moins 2 caractères';
  END IF;

  IF length(trim(p_artwork_title)) > 500 THEN
    RETURN 'Le titre de l''œuvre ne peut pas dépasser 500 caractères';
  END IF;

  -- Validation année
  IF NOT public.validate_artwork_year(p_artwork_year) THEN
    RETURN 'L''année de création doit être entre 1900 et ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  END IF;

  -- Validation dimensions
  IF NOT public.validate_artwork_dimensions(p_artwork_dimensions) THEN
    RETURN 'Les dimensions sont invalides. Largeur, hauteur et profondeur doivent être positives et inférieures à 1000';
  END IF;

  -- Validation édition
  IF NOT public.validate_edition_info(p_artwork_edition_type, p_edition_number, p_total_editions) THEN
    RETURN 'Les informations d''édition sont invalides. Pour une édition limitée, le numéro et le total sont requis et le numéro ne peut pas être supérieur au total';
  END IF;

  -- Validation shipping/artwork_link
  IF NOT public.validate_shipping_artwork_link(p_requires_shipping, p_artwork_link_url) THEN
    RETURN 'Pour une œuvre non physique, un lien vers l''œuvre est requis';
  END IF;

  -- Validation URL
  IF NOT public.validate_artwork_link_url(p_artwork_link_url) THEN
    RETURN 'L''URL de l''œuvre est invalide. Elle doit commencer par http:// ou https:// et ne pas dépasser 2048 caractères';
  END IF;

  -- Validation délai de préparation
  IF p_shipping_handling_time IS NOT NULL THEN
    IF p_shipping_handling_time < 1 THEN
      RETURN 'Le délai de préparation doit être d''au moins 1 jour';
    END IF;

    IF p_shipping_handling_time > 365 THEN
      RETURN 'Le délai de préparation ne peut pas dépasser 365 jours';
    END IF;
  END IF;

  -- Validation montant assurance
  IF p_shipping_insurance_amount IS NOT NULL THEN
    IF p_shipping_insurance_amount < 0 THEN
      RETURN 'Le montant de l''assurance ne peut pas être négatif';
    END IF;

    IF p_shipping_insurance_amount > 100000000 THEN
      RETURN 'Le montant de l''assurance est trop élevé (max 100,000,000)';
    END IF;
  END IF;

  -- Toutes les validations passées
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.validate_artist_product IS 'Valide toutes les données d''un produit artiste et retourne un message d''erreur ou NULL si valide';

-- =========================================================
-- TRIGGER : Validation avant INSERT
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artist_product_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Appeler la fonction de validation complète
  v_error_message := public.validate_artist_product(
    NEW.artist_type,
    NEW.artist_name,
    NEW.artwork_title,
    NEW.artwork_year,
    NEW.artwork_dimensions,
    NEW.artwork_edition_type,
    NEW.edition_number,
    NEW.total_editions,
    NEW.requires_shipping,
    NEW.artwork_link_url,
    NEW.shipping_handling_time,
    NEW.shipping_insurance_amount
  );

  -- Si erreur, lancer une exception
  IF v_error_message IS NOT NULL THEN
    RAISE EXCEPTION '%', v_error_message USING ERRCODE = '23514'; -- check_violation
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_artist_product_on_insert IS 'Trigger de validation avant INSERT d''un produit artiste';

-- Créer le trigger de manière idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_artist_product_insert'
    AND tgrelid = 'public.artist_products'::regclass
  ) THEN
    CREATE TRIGGER validate_artist_product_insert
      BEFORE INSERT ON public.artist_products
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_artist_product_on_insert();
  END IF;
END $$;

-- =========================================================
-- TRIGGER : Validation avant UPDATE
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artist_product_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_message TEXT;
BEGIN
  -- Appeler la fonction de validation complète
  v_error_message := public.validate_artist_product(
    NEW.artist_type,
    NEW.artist_name,
    NEW.artwork_title,
    NEW.artwork_year,
    NEW.artwork_dimensions,
    NEW.artwork_edition_type,
    NEW.edition_number,
    NEW.total_editions,
    NEW.requires_shipping,
    NEW.artwork_link_url,
    NEW.shipping_handling_time,
    NEW.shipping_insurance_amount
  );

  -- Si erreur, lancer une exception
  IF v_error_message IS NOT NULL THEN
    RAISE EXCEPTION '%', v_error_message USING ERRCODE = '23514'; -- check_violation
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_artist_product_on_update IS 'Trigger de validation avant UPDATE d''un produit artiste';

-- Créer le trigger de manière idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_artist_product_update'
    AND tgrelid = 'public.artist_products'::regclass
  ) THEN
    CREATE TRIGGER validate_artist_product_update
      BEFORE UPDATE ON public.artist_products
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_artist_product_on_update();
  END IF;
END $$;

-- =========================================================
-- CONTRAINTES CHECK additionnelles
-- =========================================================

-- Ajouter contrainte sur shipping_handling_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'artist_products_shipping_handling_time_check'
    AND conrelid = 'public.artist_products'::regclass
  ) THEN
    ALTER TABLE public.artist_products
    ADD CONSTRAINT artist_products_shipping_handling_time_check
    CHECK (shipping_handling_time IS NULL OR (shipping_handling_time >= 1 AND shipping_handling_time <= 365));
  END IF;
END $$;

-- Ajouter contrainte sur shipping_insurance_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'artist_products_shipping_insurance_amount_check'
    AND conrelid = 'public.artist_products'::regclass
  ) THEN
    ALTER TABLE public.artist_products
    ADD CONSTRAINT artist_products_shipping_insurance_amount_check
    CHECK (shipping_insurance_amount IS NULL OR (shipping_insurance_amount >= 0 AND shipping_insurance_amount <= 100000000));
  END IF;
END $$;

-- Ajouter contrainte sur longueur artist_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'artist_products_artist_name_length_check'
    AND conrelid = 'public.artist_products'::regclass
  ) THEN
    ALTER TABLE public.artist_products
    ADD CONSTRAINT artist_products_artist_name_length_check
    CHECK (length(trim(artist_name)) >= 2 AND length(artist_name) <= 200);
  END IF;
END $$;

-- Ajouter contrainte sur longueur artwork_title
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'artist_products_artwork_title_length_check'
    AND conrelid = 'public.artist_products'::regclass
  ) THEN
    ALTER TABLE public.artist_products
    ADD CONSTRAINT artist_products_artwork_title_length_check
    CHECK (length(trim(artwork_title)) >= 2 AND length(artwork_title) <= 500);
  END IF;
END $$;

-- Ajouter contrainte sur artwork_link_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'artist_products_artwork_link_url_check'
    AND conrelid = 'public.artist_products'::regclass
  ) THEN
    ALTER TABLE public.artist_products
    ADD CONSTRAINT artist_products_artwork_link_url_check
    CHECK (
      artwork_link_url IS NULL 
      OR (
        artwork_link_url ~* '^https?://[^\s/$.?#].[^\s]*$'
        AND length(artwork_link_url) <= 2048
      )
    );
  END IF;
END $$;

-- =========================================================
-- FONCTION : Valider les données spécifiques par type
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_artist_type_specifics(
  p_artist_type TEXT,
  p_writer_specific JSONB,
  p_musician_specific JSONB,
  p_visual_artist_specific JSONB,
  p_designer_specific JSONB,
  p_multimedia_specific JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_isbn TEXT;
  v_pages INTEGER;
  v_tracks JSONB;
BEGIN
  -- Validation spécifique pour écrivain
  IF p_artist_type = 'writer' AND p_writer_specific IS NOT NULL THEN
    -- Valider ISBN si fourni (format basique: 10 ou 13 chiffres avec ou sans tirets)
    v_isbn := p_writer_specific->>'book_isbn';
    IF v_isbn IS NOT NULL AND trim(v_isbn) != '' THEN
      -- Format ISBN basique (peut être amélioré)
      IF NOT (v_isbn ~ '^[0-9\-]{10,17}$') THEN
        RETURN 'Format ISBN invalide';
      END IF;
    END IF;

    -- Valider nombre de pages
    v_pages := (p_writer_specific->>'book_pages')::INTEGER;
    IF v_pages IS NOT NULL THEN
      IF v_pages < 1 OR v_pages > 50000 THEN
        RETURN 'Le nombre de pages doit être entre 1 et 50000';
      END IF;
    END IF;
  END IF;

  -- Validation spécifique pour musicien
  IF p_artist_type = 'musician' AND p_musician_specific IS NOT NULL THEN
    -- Valider les pistes de l'album
    v_tracks := p_musician_specific->'album_tracks';
    IF v_tracks IS NOT NULL AND jsonb_typeof(v_tracks) = 'array' THEN
      -- Vérifier que chaque piste a un titre
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_tracks) AS track
        WHERE (track->>'title') IS NULL OR trim(track->>'title') = ''
      ) THEN
        RETURN 'Chaque piste de l''album doit avoir un titre';
      END IF;
    END IF;
  END IF;

  -- Les autres validations spécifiques peuvent être ajoutées ici

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.validate_artist_type_specifics IS 'Valide les données spécifiques selon le type d''artiste';

-- Ajouter ce check au trigger principal
CREATE OR REPLACE FUNCTION public.validate_artist_product_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_message TEXT;
  v_specific_error TEXT;
BEGIN
  -- Validation générale
  v_error_message := public.validate_artist_product(
    NEW.artist_type,
    NEW.artist_name,
    NEW.artwork_title,
    NEW.artwork_year,
    NEW.artwork_dimensions,
    NEW.artwork_edition_type,
    NEW.edition_number,
    NEW.total_editions,
    NEW.requires_shipping,
    NEW.artwork_link_url,
    NEW.shipping_handling_time,
    NEW.shipping_insurance_amount
  );

  IF v_error_message IS NOT NULL THEN
    RAISE EXCEPTION '%', v_error_message USING ERRCODE = '23514';
  END IF;

  -- Validation spécifique par type
  v_specific_error := public.validate_artist_type_specifics(
    NEW.artist_type,
    NEW.writer_specific,
    NEW.musician_specific,
    NEW.visual_artist_specific,
    NEW.designer_specific,
    NEW.multimedia_specific
  );

  IF v_specific_error IS NOT NULL THEN
    RAISE EXCEPTION '%', v_specific_error USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_artist_product_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_message TEXT;
  v_specific_error TEXT;
BEGIN
  -- Validation générale
  v_error_message := public.validate_artist_product(
    NEW.artist_type,
    NEW.artist_name,
    NEW.artwork_title,
    NEW.artwork_year,
    NEW.artwork_dimensions,
    NEW.artwork_edition_type,
    NEW.edition_number,
    NEW.total_editions,
    NEW.requires_shipping,
    NEW.artwork_link_url,
    NEW.shipping_handling_time,
    NEW.shipping_insurance_amount
  );

  IF v_error_message IS NOT NULL THEN
    RAISE EXCEPTION '%', v_error_message USING ERRCODE = '23514';
  END IF;

  -- Validation spécifique par type
  v_specific_error := public.validate_artist_type_specifics(
    NEW.artist_type,
    NEW.writer_specific,
    NEW.musician_specific,
    NEW.visual_artist_specific,
    NEW.designer_specific,
    NEW.multimedia_specific
  );

  IF v_specific_error IS NOT NULL THEN
    RAISE EXCEPTION '%', v_specific_error USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;





