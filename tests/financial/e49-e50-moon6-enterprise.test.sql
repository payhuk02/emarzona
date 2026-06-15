-- E49/E50 — Moon 6 enterprise
BEGIN;

SELECT plan(6);

SELECT has_function('public', 'setup_platform_health_cron_job', ARRAY['text', 'text']);
SELECT has_function('public', 'setup_google_indexing_cron_jobs', ARRAY['text', 'text']);
SELECT has_function('public', 'check_api_rate_limit', ARRAY['uuid', 'uuid']);
SELECT has_function('public', 'request_account_deletion', ARRAY['text']);
SELECT has_function('public', 'assess_checkout_fraud_risk', ARRAY['text', 'numeric', 'text', 'text']);
SELECT has_function('public', 'list_user_store_organizations', ARRAY[]::text[]);

SELECT * FROM finish();
ROLLBACK;
