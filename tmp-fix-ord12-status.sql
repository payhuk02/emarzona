-- Align digital paid order stuck on confirmed (manual recover used wrong status)
UPDATE public.orders o
SET
  status = 'completed',
  updated_at = now()
WHERE o.id = '6f36a592-1a04-4832-a4c6-ca3234016eb9'::uuid
  AND o.payment_status = 'paid'
  AND o.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1 FROM public.order_items oi
    WHERE oi.order_id = o.id AND oi.product_type = 'physical'
  );

SELECT public.update_store_earnings('667f45e0-1402-47a8-976b-8114f517a967'::uuid);
