-- Revoke public/anon execute on sync_email_tags_cron_jobs (missed by cron *_safe hardening).

REVOKE EXECUTE ON FUNCTION public.sync_email_tags_cron_jobs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_email_tags_cron_jobs() FROM anon;

CREATE OR REPLACE FUNCTION public.sync_email_tags_cron_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden: admin or staff required';
  END IF;

  UPDATE public.email_tags_cron_jobs_config c
  SET
    active = j.active,
    schedule = j.schedule::TEXT
  FROM cron.job j
  WHERE j.jobname = c.job_name
    AND (j.active != c.active OR j.schedule::TEXT != c.schedule);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_email_tags_cron_jobs() TO authenticated;

COMMENT ON FUNCTION public.sync_email_tags_cron_jobs() IS
  'Sync email_tags_cron_jobs_config from cron.job. Admin/staff only.';
