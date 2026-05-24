-- Align email_templates sender with verified Resend domain: mail.emarzona.com
-- Replaces legacy noreply@emarzona.com (root domain not verified in Resend).

UPDATE public.email_templates
SET
  from_email = 'noreply@mail.emarzona.com',
  updated_at = NOW()
WHERE from_email = 'noreply@emarzona.com'
   OR from_email IS NULL;

ALTER TABLE public.email_templates
  ALTER COLUMN from_email SET DEFAULT 'noreply@mail.emarzona.com';

COMMENT ON COLUMN public.email_templates.from_email IS
  'Expéditeur par défaut (@mail.emarzona.com — domaine vérifié Resend)';
