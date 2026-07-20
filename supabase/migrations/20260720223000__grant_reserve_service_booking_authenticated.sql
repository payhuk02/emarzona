-- Allow authenticated buyers to reserve slots without the edge function.
GRANT EXECUTE ON FUNCTION public.reserve_service_booking(
  UUID, UUID, UUID, DATE, TIME, TIME, TEXT, INTEGER, INTEGER, TEXT
) TO authenticated, service_role;
