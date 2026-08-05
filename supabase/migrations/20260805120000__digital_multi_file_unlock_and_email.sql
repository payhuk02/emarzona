-- Multi-file digital delivery: unlock all purchased files + email template listing all links

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
  v_digital_product_id UUID;
  v_customer_id UUID;
  v_license_id UUID;
  v_license_status TEXT;
  v_token TEXT;
  v_file RECORD;
BEGIN
  SELECT id INTO v_store_id FROM stores WHERE slug = p_store_slug LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Boutique introuvable.';
  END IF;

  SELECT id, digital_product_id, customer_id, status
  INTO v_license_id, v_digital_product_id, v_customer_id, v_license_status
  FROM digital_licenses
  WHERE license_key = p_license_key AND store_id = v_store_id
  LIMIT 1;

  IF v_license_id IS NULL THEN
    RAISE EXCEPTION 'Clé de licence invalide.';
  END IF;

  IF v_license_status != 'active' THEN
    RAISE EXCEPTION 'La licence n''est plus active.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM digital_product_files t
    WHERE t.digital_product_id = v_digital_product_id
      AND COALESCE(t.requires_purchase, true) = true
      AND COALESCE(t.is_preview, false) = false
  ) THEN
    RAISE EXCEPTION 'Aucun fichier principal trouvé pour ce produit.';
  END IF;

  FOR v_file IN
    SELECT t.file_url, t.name
    FROM digital_product_files t
    WHERE t.digital_product_id = v_digital_product_id
      AND COALESCE(t.requires_purchase, true) = true
      AND COALESCE(t.is_preview, false) = false
    ORDER BY t.is_main DESC NULLS LAST, COALESCE(t.order_index, 0) ASC, t.id ASC
  LOOP
    SELECT public.generate_download_token(
      v_digital_product_id,
      v_file.file_url,
      v_customer_id,
      v_license_id,
      24
    )
    INTO v_token;

    RETURN QUERY SELECT v_token, v_file.file_url, v_file.name;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.unlock_digital_product_direct_access(TEXT, TEXT, TEXT) TO anon, authenticated;

UPDATE public.email_templates
SET
  html_content = '{
    "fr": "<h1>Merci {{user_name}} !</h1><p>Votre commande #{{order_number}} sur <strong>{{store_name}}</strong> a bien été confirmée.</p><p>Produit : {{product_name}}</p><p>Prix : {{price}}</p>{{#if download_links_html}}<p>Vos fichiers :</p>{{download_links_html}}{{/if}}<p style=\"margin-top:20px;\"><a href=\"{{download_link}}\" style=\"display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Accéder à mes achats digitaux</a></p>{{#if whatsapp_link}}<p style=\"margin-top:20px;\">Besoin d''aide ? <a href=\"{{whatsapp_link}}\">Contacter le vendeur sur WhatsApp</a></p>{{/if}}",
    "en": "<h1>Thank you {{user_name}}!</h1><p>Your order #{{order_number}} on <strong>{{store_name}}</strong> is confirmed.</p><p>Product: {{product_name}}</p><p>Price: {{price}}</p>{{#if download_links_html}}<p>Your files:</p>{{download_links_html}}{{/if}}<p style=\"margin-top:20px;\"><a href=\"{{download_link}}\" style=\"display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Access my digital downloads</a></p>{{#if whatsapp_link}}<p style=\"margin-top:20px;\">Need help? <a href=\"{{whatsapp_link}}\">Contact seller on WhatsApp</a></p>{{/if}}"
  }'::jsonb,
  variables = '["{{user_name}}", "{{order_number}}", "{{product_name}}", "{{download_link}}", "{{download_links_html}}", "{{store_name}}", "{{price}}", "{{whatsapp_link}}"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'order-confirmation-digital';
