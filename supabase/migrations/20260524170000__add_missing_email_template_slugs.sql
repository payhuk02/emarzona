-- Slugs attendus par le code (digital / physical / welcome-user) — copie depuis templates existants

INSERT INTO public.email_templates (
  slug,
  name,
  category,
  product_type,
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  is_active,
  is_default
)
SELECT
  'order-confirmation-digital',
  'Confirmation commande - Digital',
  category,
  'digital',
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  true,
  false
FROM public.email_templates
WHERE slug = 'order-confirmation' AND product_type IS NULL
ON CONFLICT (slug) DO UPDATE SET
  product_type = EXCLUDED.product_type,
  from_email = EXCLUDED.from_email,
  is_active = true,
  updated_at = NOW();

INSERT INTO public.email_templates (
  slug,
  name,
  category,
  product_type,
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  is_active,
  is_default
)
SELECT
  'order-confirmation-physical',
  'Confirmation commande - Physique',
  category,
  'physical',
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  true,
  false
FROM public.email_templates
WHERE slug = 'order-confirmation' AND product_type IS NULL
ON CONFLICT (slug) DO UPDATE SET
  product_type = EXCLUDED.product_type,
  from_email = EXCLUDED.from_email,
  is_active = true,
  updated_at = NOW();

INSERT INTO public.email_templates (
  slug,
  name,
  category,
  product_type,
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  is_active,
  is_default
)
SELECT
  'welcome-user',
  'Bienvenue utilisateur',
  category,
  NULL,
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  true,
  false
FROM public.email_templates
WHERE slug = 'welcome' AND product_type IS NULL
ON CONFLICT (slug) DO UPDATE SET
  from_email = EXCLUDED.from_email,
  is_active = true,
  updated_at = NOW();
