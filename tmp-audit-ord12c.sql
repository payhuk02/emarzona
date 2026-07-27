SELECT t.id, t.status, t.completed_at, o.order_number, o.payment_status, o.status AS order_status,
  (SELECT count(*) FROM payments p WHERE p.order_id = o.id) AS payments_n,
  (SELECT count(*) FROM digital_licenses dl WHERE dl.order_id = o.id) AS licenses_n,
  (SELECT count(*) FROM invoices i WHERE i.order_id = o.id) AS invoices_n
FROM transactions t
JOIN orders o ON o.id = t.order_id
WHERE t.id = 'edd8ffee-86d5-41d6-a496-5736b0f8bc5a';
