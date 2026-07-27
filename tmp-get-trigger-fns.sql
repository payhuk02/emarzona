SELECT pg_get_functiondef('public.create_transaction_after_payment()'::regprocedure) AS def;
SELECT pg_get_functiondef('public.fulfill_digital_order_items_on_paid()'::regprocedure) AS digital_def;
