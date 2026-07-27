SELECT pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%payment_status%';
