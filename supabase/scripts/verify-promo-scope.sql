SELECT code, applies_to, product_ids, cardinality(product_ids) AS n_products
FROM public.product_promotions
WHERE code IN ('GF100', 'GF1000');
