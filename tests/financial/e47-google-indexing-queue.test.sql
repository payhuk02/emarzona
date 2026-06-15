-- E47 — Google Indexing queue
BEGIN;

SELECT plan(4);

SELECT has_function('public', 'enqueue_google_indexing', ARRAY['text', 'text', 'uuid']);
SELECT has_function('public', 'claim_google_indexing_batch', ARRAY['integer']);
SELECT has_function('public', 'complete_google_indexing', ARRAY['uuid', 'boolean', 'text', 'jsonb']);

SELECT ok(
  (SELECT public.enqueue_google_indexing('https://example.com/sitemap.xml') IS NOT NULL),
  'enqueue returns id'
);

SELECT * FROM finish();
ROLLBACK;
