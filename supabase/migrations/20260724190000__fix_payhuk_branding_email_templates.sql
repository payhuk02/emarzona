-- Remplace Payhuk → Emarzona dans les templates email.
-- Cause : alias welcome-user → welcome avec subject encore « Bienvenue sur Payhuk ! ».

BEGIN;

UPDATE public.email_templates
SET
  subject = replace(replace(subject::text, 'Payhuk', 'Emarzona'), 'payhuk', 'emarzona'),
  html_content = replace(replace(html_content::text, 'Payhuk', 'Emarzona'), 'payhuk', 'emarzona'),
  text_content = CASE
    WHEN text_content IS NULL THEN NULL
    ELSE replace(replace(text_content, 'Payhuk', 'Emarzona'), 'payhuk', 'emarzona')
  END,
  from_name = CASE
    WHEN from_name IS NULL THEN NULL
    ELSE replace(replace(from_name, 'Payhuk', 'Emarzona'), 'payhuk', 'emarzona')
  END,
  updated_at = now()
WHERE
  subject::text ILIKE '%Payhuk%'
  OR html_content::text ILIKE '%Payhuk%'
  OR coalesce(text_content, '') ILIKE '%Payhuk%'
  OR coalesce(from_name, '') ILIKE '%Payhuk%';

-- Filet de sécurité : sujets welcome explicites
UPDATE public.email_templates
SET
  subject = 'Bienvenue sur Emarzona !',
  updated_at = now()
WHERE slug IN ('welcome', 'welcome-user')
  AND subject::text NOT ILIKE '%Emarzona%';

COMMIT;

NOTIFY pgrst, 'reload schema';
