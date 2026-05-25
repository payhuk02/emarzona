-- Align calculate_daily_email_analytics with production email_logs schema:
-- to_email, status, created_at (not recipient_email / sendgrid_status / sent_at)

CREATE OR REPLACE FUNCTION public.calculate_daily_email_analytics(
  p_date DATE DEFAULT CURRENT_DATE,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  store_id UUID,
  campaign_id UUID,
  sequence_id UUID,
  template_id UUID,
  total_sent INTEGER,
  total_delivered INTEGER,
  total_opened INTEGER,
  total_clicked INTEGER,
  total_bounced INTEGER,
  total_unsubscribed INTEGER,
  total_failed INTEGER,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC,
  unsubscribe_rate NUMERIC,
  click_to_open_rate NUMERIC,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH enriched_logs AS (
    SELECT
      el.*,
      COALESCE(
        NULLIF(el.metadata->>'store_id', '')::uuid,
        (SELECT c.store_id FROM public.email_campaigns c WHERE c.id = el.campaign_id LIMIT 1),
        (SELECT s.store_id FROM public.email_sequences s WHERE s.id = el.sequence_id LIMIT 1)
      ) AS resolved_store_id,
      DATE(COALESCE(el.created_at, el.updated_at)) AS stat_date
    FROM public.email_logs el
    WHERE DATE(COALESCE(el.created_at, el.updated_at)) = p_date
  ),
  email_stats AS (
    SELECT
      el.stat_date,
      el.resolved_store_id AS store_id,
      el.campaign_id,
      el.sequence_id,
      el.template_id,
      COUNT(*)::INTEGER AS total_sent,
      COUNT(*) FILTER (WHERE el.status IN ('delivered', 'sent'))::INTEGER AS total_delivered,
      COUNT(*) FILTER (WHERE el.opened_at IS NOT NULL)::INTEGER AS total_opened,
      COUNT(*) FILTER (WHERE el.clicked_at IS NOT NULL)::INTEGER AS total_clicked,
      COUNT(*) FILTER (WHERE el.status = 'bounced')::INTEGER AS total_bounced,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM public.email_unsubscribes eu
          WHERE eu.email = el.to_email
            AND DATE(eu.unsubscribed_at) = el.stat_date
        )
      )::INTEGER AS total_unsubscribed,
      COUNT(*) FILTER (WHERE el.status IN ('failed', 'bounced', 'spam'))::INTEGER AS total_failed,
      COALESCE(SUM(
        CASE
          WHEN NULLIF(el.metadata->>'order_id', '') IS NOT NULL THEN
            (
              SELECT o.total_amount
              FROM public.orders o
              WHERE o.id = NULLIF(el.metadata->>'order_id', '')::uuid
              LIMIT 1
            )
          ELSE 0
        END
      ), 0) AS revenue
    FROM enriched_logs el
    WHERE p_store_id IS NULL OR el.resolved_store_id = p_store_id
    GROUP BY
      el.stat_date,
      el.resolved_store_id,
      el.campaign_id,
      el.sequence_id,
      el.template_id
  )
  SELECT
    es.stat_date AS date,
    es.store_id,
    es.campaign_id,
    es.sequence_id,
    es.template_id,
    es.total_sent,
    es.total_delivered,
    es.total_opened,
    es.total_clicked,
    es.total_bounced,
    es.total_unsubscribed,
    es.total_failed,
    CASE
      WHEN es.total_sent > 0 THEN ROUND((es.total_delivered::NUMERIC / es.total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END AS delivery_rate,
    CASE
      WHEN es.total_delivered > 0 THEN ROUND((es.total_opened::NUMERIC / es.total_delivered::NUMERIC) * 100, 2)
      ELSE 0
    END AS open_rate,
    CASE
      WHEN es.total_delivered > 0 THEN ROUND((es.total_clicked::NUMERIC / es.total_delivered::NUMERIC) * 100, 2)
      ELSE 0
    END AS click_rate,
    CASE
      WHEN es.total_sent > 0 THEN ROUND((es.total_bounced::NUMERIC / es.total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END AS bounce_rate,
    CASE
      WHEN es.total_delivered > 0 THEN ROUND((es.total_unsubscribed::NUMERIC / es.total_delivered::NUMERIC) * 100, 2)
      ELSE 0
    END AS unsubscribe_rate,
    CASE
      WHEN es.total_opened > 0 THEN ROUND((es.total_clicked::NUMERIC / es.total_opened::NUMERIC) * 100, 2)
      ELSE 0
    END AS click_to_open_rate,
    es.revenue
  FROM email_stats es;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.calculate_daily_email_analytics IS
  'Agrégations quotidiennes email_logs (to_email, status, created_at)';
