-- E48 — Platform SLA status
BEGIN;

SELECT plan(3);

SELECT has_function('public', 'record_platform_sla_check', ARRAY['text', 'text', 'text', 'integer', 'text']);
SELECT has_function('public', 'get_platform_status_summary', ARRAY[]::text[]);

SELECT ok(
  (SELECT (public.get_platform_status_summary()->>'overall') IS NOT NULL),
  'summary returns overall status'
);

SELECT * FROM finish();
ROLLBACK;
