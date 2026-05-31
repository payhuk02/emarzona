-- Fix disputes 403: user policies must not trigger orders RLS that reads auth.users
BEGIN;

CREATE OR REPLACE FUNCTION public.dispute_visible_to_user(
  p_order_id uuid,
  p_initiator_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_initiator_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = p_order_id
        AND (
          o.customer_id = auth.uid()
          OR o.store_id IN (
            SELECT s.id FROM public.stores s WHERE s.user_id = auth.uid()
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.dispute_creatable_by_user(
  p_order_id uuid,
  p_initiator_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_initiator_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = p_order_id
        AND (
          o.customer_id = auth.uid()
          OR o.store_id IN (
            SELECT s.id FROM public.stores s WHERE s.user_id = auth.uid()
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'contact@edigit-agence.com'
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (
          COALESCE(p.is_super_admin, false) = true
          OR p.role IN ('admin', 'staff', 'manager', 'support', 'viewer')
        )
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
CREATE POLICY "Users can view their own disputes"
  ON public.disputes
  FOR SELECT
  TO authenticated
  USING (public.dispute_visible_to_user(order_id, initiator_id));

DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
CREATE POLICY "Users can create disputes"
  ON public.disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.dispute_creatable_by_user(order_id, initiator_id));

CREATE OR REPLACE FUNCTION public.admin_list_disputes(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL,
  p_initiator_type text DEFAULT NULL,
  p_assigned_admin_id uuid DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_asc boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_rows jsonb;
  v_sort_column text;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  v_sort_column := CASE p_sort_by
    WHEN 'status' THEN 'status'
    WHEN 'subject' THEN 'subject'
    WHEN 'order_id' THEN 'order_id'
    ELSE 'created_at'
  END;

  SELECT count(*)
  INTO v_total
  FROM public.disputes d
  WHERE (p_status IS NULL OR d.status = p_status)
    AND (p_initiator_type IS NULL OR d.initiator_type = p_initiator_type)
    AND (p_assigned_admin_id IS NULL OR d.assigned_admin_id = p_assigned_admin_id)
    AND (p_priority IS NULL OR d.priority = p_priority)
    AND (
      p_search IS NULL
      OR btrim(p_search) = ''
      OR d.subject ILIKE '%' || p_search || '%'
      OR d.description ILIKE '%' || p_search || '%'
      OR d.order_id::text ILIKE '%' || p_search || '%'
    );

  EXECUTE format(
    $sql$
      SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb)
      FROM (
        SELECT
          d.id,
          d.order_id,
          d.status,
          d.priority,
          d.initiator_type,
          d.assigned_admin_id,
          d.subject,
          d.description,
          d.created_at,
          d.updated_at
        FROM public.disputes d
        WHERE ($1 IS NULL OR d.status = $1)
          AND ($2 IS NULL OR d.initiator_type = $2)
          AND ($3 IS NULL OR d.assigned_admin_id = $3)
          AND ($4 IS NULL OR d.priority = $4)
          AND (
            $5 IS NULL
            OR btrim($5) = ''
            OR d.subject ILIKE '%%' || $5 || '%%'
            OR d.description ILIKE '%%' || $5 || '%%'
            OR d.order_id::text ILIKE '%%' || $5 || '%%'
          )
        ORDER BY %I %s
        LIMIT $6 OFFSET $7
      ) q
    $sql$,
    v_sort_column,
    CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END
  )
  INTO v_rows
  USING p_status, p_initiator_type, p_assigned_admin_id, p_priority, p_search, p_limit, p_offset;

  RETURN jsonb_build_object('data', v_rows, 'count', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispute_visible_to_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_creatable_by_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_disputes(
  integer, integer, text, text, uuid, text, text, text, boolean
) TO authenticated;

COMMIT;
