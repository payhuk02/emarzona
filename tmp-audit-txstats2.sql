SELECT status, count(*)::int AS n, coalesce(sum(amount),0) AS sum_amount
FROM transactions
WHERE store_id = '667f45e0-1402-47a8-976b-8114f517a967' AND created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY n DESC;
