-- Align get_enrollment_stats with course_enrollments (LMS canonical table)

CREATE OR REPLACE FUNCTION public.get_enrollment_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  status_counts JSON;
BEGIN
  SELECT json_object_agg(status, count) INTO status_counts
  FROM (
    SELECT status, COUNT(*) AS count
    FROM public.course_enrollments
    GROUP BY status
  ) status_agg;

  SELECT json_build_object(
    'total_enrollments', COUNT(*),
    'active_enrollments', COUNT(*) FILTER (WHERE status = 'active'),
    'completed_enrollments', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_revenue', COALESCE((
      SELECT SUM(o.total_amount)
      FROM public.course_enrollments ce
      JOIN public.orders o ON o.id = ce.order_id
      WHERE o.payment_status IN ('paid', 'completed')
    ), 0),
    'avg_progress', COALESCE(AVG(progress_percentage), 0),
    'avg_completion_time', (
      SELECT COALESCE(AVG(
        EXTRACT(EPOCH FROM (completion_date::timestamp - enrollment_date::timestamp)) / 86400
      ), 0)
      FROM public.course_enrollments
      WHERE status = 'completed'
        AND completion_date IS NOT NULL
        AND enrollment_date IS NOT NULL
    ),
    'by_status', COALESCE(status_counts, '{}'::json)
  ) INTO result
  FROM public.course_enrollments;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_enrollment_stats() TO authenticated;

COMMENT ON FUNCTION public.get_enrollment_stats() IS
  'Enrollment KPIs from course_enrollments + paid orders (replaces legacy enrollments table).';
