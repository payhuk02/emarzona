-- Phase 2: durcissement sécurité email (RPC métriques, policy campagnes dupliquée)

BEGIN;

-- Révoquer increment_campaign_metric pour les clients — réservé service_role / webhooks
REVOKE EXECUTE ON FUNCTION public.increment_campaign_metric(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_campaign_metric(UUID, TEXT, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_campaign_metric(UUID, TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_campaign_metric(UUID, TEXT, INTEGER) TO service_role;

-- Ancienne policy sans plan gate (contournait emails.manage)
DROP POLICY IF EXISTS "email_campaigns_store_owner_all" ON public.email_campaigns;

COMMENT ON FUNCTION public.increment_campaign_metric IS
  'Incrémente atomiquement une métrique campagne. Réservé service_role (webhooks Resend).';

COMMIT;
