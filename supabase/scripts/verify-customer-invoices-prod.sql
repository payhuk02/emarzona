-- Verify customer invoices: visibility + zero default VAT

SELECT 'paid_orders_sample' AS section;
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

SELECT 'invoices_paid_orders' AS section;
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

SELECT 'invoices_with_tax' AS section, COUNT(*) AS invoices_with_tax
FROM public.invoices
WHERE tax_amount > 0;

SELECT 'invoice_rls_policies' AS section, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'invoices'
ORDER BY policyname;
