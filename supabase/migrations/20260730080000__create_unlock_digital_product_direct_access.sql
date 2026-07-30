-- MIGRATION: 20260730080000__create_unlock_digital_product_direct_access.sql
-- Description: RPC to unlock main digital file via license key directly (Premium Link feature)

CREATE OR REPLACE FUNCTION public.unlock_digital_product_direct_access(
  p_store_slug TEXT,
  p_license_type TEXT,
  p_license_key TEXT
)
RETURNS TABLE (
  download_token TEXT,
  file_url TEXT,
  file_name TEXT
) AS $$
DECLARE
  v_store_id UUID;
  v_product_id UUID;
  v_customer_id UUID;
  v_license_id UUID;
  v_license_status TEXT;
  v_file_url TEXT;
  v_file_name TEXT;
  v_token TEXT;
BEGIN
  -- 1. Find store
  SELECT id INTO v_store_id FROM stores WHERE slug = p_store_slug LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Boutique introuvable.';
  END IF;

  -- 2. Find license
  SELECT id, digital_product_id, customer_id, status
  INTO v_license_id, v_product_id, v_customer_id, v_license_status
  FROM digital_licenses 
  WHERE license_key = p_license_key AND store_id = v_store_id LIMIT 1;

  IF v_license_id IS NULL THEN
    RAISE EXCEPTION 'Clé de licence invalide.';
  END IF;

  IF v_license_status != 'active' THEN
    RAISE EXCEPTION 'La licence n''est plus active.';
  END IF;

  -- 3. Find the MAIN file for the product
  -- First try to order by order_index if it exists, otherwise fallback to id
  SELECT t.file_url, t.name 
  INTO v_file_url, v_file_name
  FROM digital_product_files t
  WHERE t.digital_product_id = v_product_id 
  ORDER BY 
    CASE WHEN current_setting('server_version_num')::int > 0 THEN 
       id 
    END ASC
  LIMIT 1;

  IF v_file_url IS NULL THEN
    RAISE EXCEPTION 'Aucun fichier principal trouvé pour ce produit.';
  END IF;

  -- 4. Mint token
  SELECT public.generate_download_token(v_product_id, v_file_url, v_customer_id, v_license_id, 24) INTO v_token;

  -- Return results
  RETURN QUERY SELECT v_token, v_file_url, v_file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.unlock_digital_product_direct_access(TEXT, TEXT, TEXT) TO anon, authenticated;
