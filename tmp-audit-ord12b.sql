SELECT o.id, o.order_number, o.payment_status, o.status, o.total_amount,
  o.metadata->>'platform_fee' AS fee,
  o.metadata->>'subtotal' AS subtotal,
  public.order_net_revenue_amount(o) AS net_revenue,
  public.order_platform_fee_amount(o.id) AS seller_commission
FROM orders o
WHERE o.id = '6f36a592-1a04-4832-a4c6-ca3234016eb9';
