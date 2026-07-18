-- Verify appearance draft/publish migration (prod smoke check)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stores'
  AND column_name IN ('appearance_draft', 'appearance_published_at')
ORDER BY column_name;

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'publish_store_appearance';

SELECT COUNT(*) AS stores_with_published_at
FROM public.stores
WHERE appearance_published_at IS NOT NULL;
