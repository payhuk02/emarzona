-- Verify multi-file digital unlock + email template update
SELECT
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'unlock_digital_product_direct_access'
      AND pg_get_function_result(p.oid) LIKE '%download_token%file_url%file_name%'
  ) AS unlock_returns_multiple_files,
  EXISTS (
    SELECT 1
    FROM public.email_templates
    WHERE slug = 'order-confirmation-digital'
      AND variables::text LIKE '%download_links_html%'
  ) AS email_template_has_download_links_html;
