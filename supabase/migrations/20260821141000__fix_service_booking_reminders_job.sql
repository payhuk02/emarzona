-- Fix service booking reminder cron: use real columns and due reminder rows.
CREATE OR REPLACE FUNCTION public.check_service_booking_reminders_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The actual send is done by process-notification-retries (hourly HTTP cron).
  -- This job only keeps due rows visible / unsticks stale processing.
  UPDATE public.service_booking_reminders
  SET updated_at = now()
  WHERE status = 'pending'
    AND COALESCE(reminder_sent, false) = false
    AND reminder_scheduled_at <= now();
END;
$$;
