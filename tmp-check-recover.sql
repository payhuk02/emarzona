SELECT jsonb_build_object(
  'tx', (SELECT jsonb_build_object('status', status, 'completed_at', completed_at) FROM transactions WHERE id = '99dfe92c-abbd-4676-ac78-36ead1eddfdc'),
  'order', (SELECT jsonb_build_object('payment_status', payment_status, 'status', status, 'store_id', store_id) FROM orders WHERE id = '6bda23ac-0809-4600-b6d7-fc0e582c776a'),
  'payments', (SELECT count(*) FROM payments WHERE order_id = '6bda23ac-0809-4600-b6d7-fc0e582c776a')
) AS state;
