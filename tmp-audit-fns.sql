SELECT pg_get_function_identity_arguments(p.oid) AS args, p.proname
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
  'order_checkout_buyer_fee_amount','order_net_revenue_amount','order_platform_fee_amount','order_commissionable_amount','update_store_earnings','request_store_withdrawal'
);
