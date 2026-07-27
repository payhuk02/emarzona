SELECT id, amount, status, payment_method, created_at
FROM store_withdrawals
WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967'
ORDER BY created_at DESC LIMIT 15;
