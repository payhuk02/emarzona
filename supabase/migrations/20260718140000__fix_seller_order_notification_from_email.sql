-- Aligner l'expéditeur vendeur sur le domaine Resend vérifié (mail.emarzona.com)

BEGIN;

UPDATE public.email_templates
SET
  from_email = 'noreply@mail.emarzona.com',
  updated_at = NOW()
WHERE slug = 'seller-order-notification'
  AND from_email IS DISTINCT FROM 'noreply@mail.emarzona.com';

COMMIT;
