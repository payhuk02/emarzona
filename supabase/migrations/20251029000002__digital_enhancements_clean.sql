-- Digital Products System Enhancements - Clean Version for Supabase Dashboard
-- Date: 2025-10-29

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON public.digital_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_updated_at ON public.digital_products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_version ON public.digital_products(version);
CREATE INDEX IF NOT EXISTS idx_digital_products_encryption ON public.digital_products(encryption_enabled);

CREATE INDEX IF NOT EXISTS idx_downloads_download_date ON public.digital_product_downloads(download_date DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_product_user ON public.digital_product_downloads(digital_product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_session ON public.digital_product_downloads(session_id);

CREATE INDEX IF NOT EXISTS idx_licenses_customer_email ON public.digital_licenses(customer_email);
CREATE INDEX IF NOT EXISTS idx_licenses_issued_at ON public.digital_licenses(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_licenses_activated_at ON public.digital_licenses(activated_at DESC);

-- Create analytics views
CREATE OR REPLACE VIEW digital_products_stats AS
SELECT 
  dp.id,
  dp.product_id,
  p.name as product_name,
  p.store_id,
  dp.digital_type,
  dp.license_type,
  
  COUNT(DISTINCT dpd.id) as total_downloads,
  COUNT(DISTINCT dpd.user_id) as unique_downloaders,
  COUNT(DISTINCT dpd.id) FILTER (WHERE dpd.download_success = true) as successful_downloads,
  COUNT(DISTINCT dpd.id) FILTER (WHERE dpd.download_success = false) as failed_downloads,
  
  COUNT(DISTINCT dl.id) as total_licenses,
  COUNT(DISTINCT dl.id) FILTER (WHERE dl.status = 'active') as active_licenses,
  COUNT(DISTINCT dl.id) FILTER (WHERE dl.status = 'expired') as expired_licenses,
  
  MAX(dpd.download_date) as last_download_date,
  MAX(dl.issued_at) as last_license_issued_at,
  
  COALESCE(SUM(dl.current_activations), 0) as total_activations
  
FROM public.digital_products dp
INNER JOIN public.products p ON dp.product_id = p.id
LEFT JOIN public.digital_product_downloads dpd ON dp.id = dpd.digital_product_id
LEFT JOIN public.digital_licenses dl ON dp.id = dl.digital_product_id
GROUP BY dp.id, p.id;

COMMENT ON VIEW digital_products_stats IS 
'Statistiques agrégées pour chaque produit digital';

CREATE OR REPLACE VIEW recent_digital_downloads AS
SELECT 
  dpd.id,
  dpd.download_date,
  dpd.download_success,
  dpd.download_ip,
  dpd.download_country,
  dpd.user_agent,
  dp.id as digital_product_id,
  p.name as product_name,
  p.store_id,
  u.email as user_email,
  dpd.file_version,
  dpd.download_duration_seconds,
  dpd.download_speed_mbps
FROM public.digital_product_downloads dpd
INNER JOIN public.digital_products dp ON dpd.digital_product_id = dp.id
INNER JOIN public.products p ON dp.product_id = p.id
INNER JOIN auth.users u ON dpd.user_id = u.id
ORDER BY dpd.download_date DESC;

COMMENT ON VIEW recent_digital_downloads IS 
'Vue des téléchargements récents avec toutes les informations pertinentes';

CREATE OR REPLACE VIEW active_digital_licenses AS
SELECT 
  dl.id,
  dl.license_key,
  dl.license_type,
  dl.status,
  dl.max_activations,
  dl.current_activations,
  dl.issued_at,
  dl.activated_at,
  dl.expires_at,
  dl.customer_email,
  dl.customer_name,
  dp.id as digital_product_id,
  p.name as product_name,
  p.store_id,
  s.name as store_name,
  
  CASE 
    WHEN dl.expires_at IS NULL THEN true
    WHEN dl.expires_at > now() THEN true
    ELSE false
  END as is_valid,
  
  CASE 
    WHEN dl.expires_at IS NOT NULL THEN 
      EXTRACT(DAY FROM (dl.expires_at - now()))
    ELSE NULL
  END as days_until_expiry,
  
  dl.max_activations - dl.current_activations as remaining_activations
  
FROM public.digital_licenses dl
INNER JOIN public.digital_products dp ON dl.digital_product_id = dp.id
INNER JOIN public.products p ON dp.product_id = p.id
INNER JOIN public.stores s ON p.store_id = s.id
WHERE dl.status = 'active';

COMMENT ON VIEW active_digital_licenses IS 
'Vue des licenses actives avec calculs de validité et activations restantes';

-- Utility functions
CREATE OR REPLACE FUNCTION get_remaining_downloads(
  p_digital_product_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_download_limit INTEGER;
  v_downloads_count INTEGER;
BEGIN
  SELECT download_limit INTO v_download_limit
  FROM public.digital_products
  WHERE id = p_digital_product_id;
  
  IF v_download_limit = -1 THEN
    RETURN -1;
  END IF;
  
  SELECT COUNT(*) INTO v_downloads_count
  FROM public.digital_product_downloads
  WHERE digital_product_id = p_digital_product_id
    AND user_id = p_user_id
    AND download_success = true;
  
  RETURN GREATEST(v_download_limit - v_downloads_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_remaining_downloads(UUID, UUID) IS 
'Retourne le nombre de téléchargements restants pour un utilisateur';

CREATE OR REPLACE FUNCTION has_digital_access(
  p_product_id UUID,
  p_user_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.order_items oi
    INNER JOIN public.orders o ON oi.order_id = o.id
    INNER JOIN public.customers c ON o.customer_id = c.id
    WHERE oi.product_id = p_product_id
      AND c.email = p_user_email
      AND o.payment_status = 'paid'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_digital_access(UUID, TEXT) IS 
'Vérifie si un utilisateur a acheté et a accès à un produit digital';

CREATE OR REPLACE FUNCTION get_download_analytics(
  p_digital_product_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_downloads BIGINT,
  successful_downloads BIGINT,
  failed_downloads BIGINT,
  unique_users BIGINT,
  avg_download_time NUMERIC,
  top_countries JSONB,
  downloads_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH download_data AS (
    SELECT 
      dpd.*
    FROM public.digital_product_downloads dpd
    WHERE dpd.digital_product_id = p_digital_product_id
      AND dpd.download_date >= now() - (p_days || ' days')::interval
  ),
  country_stats AS (
    SELECT 
      download_country,
      COUNT(*) as count
    FROM download_data
    WHERE download_country IS NOT NULL
    GROUP BY download_country
    ORDER BY count DESC
    LIMIT 10
  ),
  daily_stats AS (
    SELECT 
      DATE(download_date) as download_day,
      COUNT(*) as count
    FROM download_data
    GROUP BY DATE(download_date)
    ORDER BY download_day
  )
  SELECT 
    COUNT(*)::BIGINT as total_downloads,
    COUNT(*) FILTER (WHERE download_success = true)::BIGINT as successful_downloads,
    COUNT(*) FILTER (WHERE download_success = false)::BIGINT as failed_downloads,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    ROUND(AVG(download_duration_seconds)::NUMERIC, 2) as avg_download_time,
    (SELECT jsonb_agg(jsonb_build_object('country', download_country, 'count', count)) 
     FROM country_stats) as top_countries,
    (SELECT jsonb_agg(jsonb_build_object('date', download_day, 'count', count))
     FROM daily_stats) as downloads_by_day
  FROM download_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_download_analytics(UUID, INTEGER) IS 
'Retourne des analytics détaillées des téléchargements pour un produit';

CREATE OR REPLACE FUNCTION update_digital_product_stats(p_digital_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.digital_products dp
  SET 
    total_downloads = (
      SELECT COUNT(*) 
      FROM public.digital_product_downloads 
      WHERE digital_product_id = p_digital_product_id
    ),
    unique_downloaders = (
      SELECT COUNT(DISTINCT user_id)
      FROM public.digital_product_downloads
      WHERE digital_product_id = p_digital_product_id
    ),
    updated_at = now()
  WHERE dp.id = p_digital_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_digital_product_stats(UUID) IS 
'Met à jour les statistiques de téléchargement d un produit digital';

CREATE OR REPLACE FUNCTION expire_digital_licenses()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.digital_licenses
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_digital_licenses() IS 
'Expire automatiquement les licenses dont la date d expiration est dépassée';

-- Automatic trigger
CREATE OR REPLACE FUNCTION trigger_update_download_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_digital_product_stats(NEW.digital_product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_after_download ON public.digital_product_downloads;
CREATE TRIGGER update_stats_after_download
  AFTER INSERT ON public.digital_product_downloads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_download_stats();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration digital_enhancements_clean completed successfully!';
END $$;

