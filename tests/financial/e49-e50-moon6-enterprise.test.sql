-- E49/E50 — Moon 6 enterprise
BEGIN;

SELECT plan(10);

SELECT has_function('public', 'setup_platform_health_cron_job', ARRAY['text', 'text']);
SELECT has_function('public', 'setup_google_indexing_cron_jobs', ARRAY['text', 'text']);
SELECT has_function('public', 'check_api_rate_limit', ARRAY['uuid', 'uuid']);
SELECT has_function('public', 'request_account_deletion', ARRAY['text']);
SELECT has_function('public', 'assess_checkout_fraud_risk', ARRAY['text', 'numeric', 'text', 'text']);
SELECT has_function('public', 'list_user_store_organizations', ARRAY[]::text[]);
SELECT has_function('public', 'get_gdpr_deletion_grace_days', ARRAY[]::text[]);
SELECT has_function('public', 'list_pending_account_deletion_targets', ARRAY['integer', 'integer']);
SELECT has_function('public', 'anonymize_user_pii_for_deletion', ARRAY['uuid']);
SELECT has_function('public', 'setup_account_deletion_cron_job', ARRAY['text', 'text']);

SELECT * FROM finish();
ROLLBACK;
