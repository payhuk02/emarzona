-- Verify customer invoices: visibility + zero default VAT
-- Run after 20260806120000 + 20260806130000 on prod

\echo '=== Paid orders sample (last 10) ==='
SELECT
  o.id,
  o.order_number,
  o.payment_status,
  o.total_amount,
  o.customer_id,
  c.email AS customer_email,
  COALESCE((o.metadata->>'tax_amount')::numeric, 0) AS order_meta_tax
FROM public.orders o
LEFT JOIN public.customers c ON c.id = o.customer_id
WHERE o.payment_status = 'paid'
ORDER BY o.created_at DESC
LIMIT 10;

\echo '=== Invoices linked to paid orders ==='
SELECT
  i.invoice_number,
  i.status,
  i.subtotal,
  i.tax_amount,
  i.total_amount,
  i.tax_breakdown,
  o.order_number,
  c.email AS customer_email
FROM public.invoices i
JOIN public.orders o ON o.id = i.order_id
LEFT JOIN public.customers c ON c.id = i.customer_id
WHERE o.payment_status = 'paid'
ORDER BY i.created_at DESC
LIMIT 15;

\echo '=== Invoices with tax_amount > 0 (should only be explicit checkout tax) ==='
SELECT COUNT(*) AS invoices_with_tax
FROM public.invoices
WHERE tax_amount > 0;

\echo '=== RLS policies on invoices ==='
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'invoices'
ORDER BY policyname;
