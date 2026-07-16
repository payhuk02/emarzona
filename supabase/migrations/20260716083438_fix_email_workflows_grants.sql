-- 1. Ensure all email tables have the proper grants
GRANT ALL ON public.email_templates TO authenticated, anon, service_role;
GRANT ALL ON public.email_campaigns TO authenticated, anon, service_role;
GRANT ALL ON public.email_sequences TO authenticated, anon, service_role;
GRANT ALL ON public.email_sequence_steps TO authenticated, anon, service_role;
GRANT ALL ON public.email_segments TO authenticated, anon, service_role;
GRANT ALL ON public.email_logs TO authenticated, anon, service_role;
GRANT ALL ON public.email_workflows TO authenticated, anon, service_role;
GRANT ALL ON public.email_ab_tests TO authenticated, anon, service_role;
GRANT ALL ON public.email_preferences TO authenticated, anon, service_role;
GRANT ALL ON public.email_unsubscribes TO authenticated, anon, service_role;

-- 2. Ensure the email_workflows table has the columns expected by the frontend (it may be missing if the 2026 schema overwrote the 2025 one)
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS actions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS execution_count integer DEFAULT 0;
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS success_count integer DEFAULT 0;
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS last_executed_at timestamptz;
ALTER TABLE public.email_workflows ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. Reload the schema cache so the API recognizes the tables and new columns
NOTIFY pgrst, 'reload schema';
