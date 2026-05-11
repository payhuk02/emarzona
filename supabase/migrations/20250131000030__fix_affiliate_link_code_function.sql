-- =========================================================
-- Migration : Correction de la fonction generate_affiliate_link_code
-- Date : 31/01/2025
-- Description : Active l'extension pgcrypto et corrige la fonction
-- =========================================================

-- Activer l'extension pgcrypto pour utiliser digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Corriger la fonction generate_affiliate_link_code
CREATE OR REPLACE FUNCTION public.generate_affiliate_link_code(
  p_affiliate_code TEXT,
  p_product_slug TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_hash TEXT;
  v_input TEXT;
BEGIN
  -- Construire la chaîne d'entrée pour le hash
  v_input := p_affiliate_code || '-' || p_product_slug || '-' || gen_random_uuid()::text;
  
  -- Créer un hash SHA256 et l'encoder en hexadécimal
  -- digest() nécessite pgcrypto qui est maintenant activé
  v_hash := encode(digest(v_input, 'sha256'), 'hex');
  
  -- Prendre les 12 premiers caractères et les mettre en majuscules
  v_code := upper(substring(v_hash, 1, 12));
  
  RETURN v_code;
END;
$$;

COMMENT ON FUNCTION public.generate_affiliate_link_code IS 'Génère un code de lien d''affiliation unique (12 caractères) en utilisant pgcrypto';

