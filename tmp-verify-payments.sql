SELECT
  (SELECT min_withdrawal_amount FROM platform_settings ORDER BY updated_at DESC NULLS LAST LIMIT 1) AS min_withdrawal,
  (SELECT pg_get_functiondef('public.request_store_withdrawal(uuid,numeric,text,jsonb,text)'::regprocedure)
     LIKE '%p_amount <= 0%' AND
   pg_get_functiondef('public.request_store_withdrawal(uuid,numeric,text,jsonb,text)'::regprocedure)
     NOT LIKE '%10000%'
  ) AS withdrawal_rpc_no_10k,
  (SELECT pg_get_functiondef('public.calculate_affiliate_commission()'::regprocedure)
     NOT LIKE '%total_amount * 0.90%'
  ) AS affiliate_not_total_times_090,
  (SELECT jsonb_build_object(
     'revenue', se.total_revenue,
     'commission', se.total_platform_commission,
     'available', se.available_balance
   )
   FROM store_earnings se
   WHERE se.store_id = '667f45e0-1402-47a8-976b-8114f517a967') AS wallet,
  (SELECT jsonb_build_object(
     'tx', t.status, 'order_pay', o.payment_status, 'order_st', o.status,
     'licenses', (SELECT count(*) FROM digital_licenses dl WHERE dl.order_id = o.id)
   )
   FROM transactions t
   JOIN orders o ON o.id = t.order_id
   WHERE t.id = 'edd8ffee-86d5-41d6-a496-5736b0f8bc5a') AS ord12;
