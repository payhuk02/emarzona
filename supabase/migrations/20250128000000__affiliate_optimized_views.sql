-- =========================================================
-- Migration : Vues optimisées pour le système d'affiliation
-- Date : 28/01/2025
-- Description : Crée des vues agrégées pour améliorer les performances
--               et éviter les requêtes N+1
-- =========================================================

-- =========================================================
-- VUE 1 : Affiliate Dashboard Data (Données agrégées pour dashboard)
-- =========================================================

CREATE OR REPLACE VIEW public.affiliate_dashboard_data AS
SELECT 
  a.id as affiliate_id,
  a.user_id,
  a.email,
  a.display_name,
  a.affiliate_code,
  a.status,
  
  -- Statistiques globales
  a.total_clicks,
  a.total_sales,
  a.total_revenue,
  a.total_commission_earned,
  a.total_commission_paid,
  a.pending_commission,
  
  -- Calculs dérivés
  CASE 
    WHEN a.total_clicks > 0 THEN (a.total_sales::NUMERIC / a.total_clicks) * 100
    ELSE 0
  END as conversion_rate,
  
  CASE 
    WHEN a.total_sales > 0 THEN a.total_revenue / a.total_sales
    ELSE 0
  END as avg_order_value,
  
  CASE 
    WHEN a.total_sales > 0 THEN a.total_commission_earned / a.total_sales
    ELSE 0
  END as avg_commission_per_sale,
  
  -- Compteurs de liens
  COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'active') as active_links_count,
  COUNT(DISTINCT al.id) as total_links_count,
  
  -- Commissions en attente
  COUNT(DISTINCT ac.id) FILTER (WHERE ac.status = 'pending') as pending_commissions_count,
  COUNT(DISTINCT ac.id) FILTER (WHERE ac.status = 'approved') as approved_commissions_count,
  
  -- Retraits en attente
  COUNT(DISTINCT aw.id) FILTER (WHERE aw.status = 'pending') as pending_withdrawals_count,
  COALESCE(SUM(aw.amount) FILTER (WHERE aw.status IN ('pending', 'processing')), 0) as pending_withdrawals_amount,
  
  -- Dates
  a.created_at,
  a.last_login_at,
  MAX(al.last_used_at) as last_link_used_at

FROM affiliates a
LEFT JOIN affiliate_links al ON al.affiliate_id = a.id
LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = a.id
LEFT JOIN affiliate_withdrawals aw ON aw.affiliate_id = a.id
GROUP BY a.id, a.user_id, a.email, a.display_name, a.affiliate_code, a.status,
         a.total_clicks, a.total_sales, a.total_revenue, a.total_commission_earned,
         a.total_commission_paid, a.pending_commission, a.created_at, a.last_login_at;

COMMENT ON VIEW public.affiliate_dashboard_data IS 'Vue agrégée pour le dashboard affilié avec toutes les statistiques nécessaires';

-- =========================================================
-- VUE 2 : Affiliate Links with Stats (Liens avec statistiques)
-- =========================================================

CREATE OR REPLACE VIEW public.affiliate_links_with_stats AS
SELECT 
  al.id,
  al.affiliate_id,
  al.product_id,
  al.store_id,
  al.link_code,
  al.full_url,
  al.status,
  al.created_at,
  al.last_used_at,
  al.updated_at,
  
  -- Statistiques du lien
  al.total_clicks,
  al.total_sales,
  al.total_revenue,
  al.total_commission,
  
  -- Statistiques des clics récents (30 derniers jours)
  COUNT(DISTINCT ac.id) FILTER (
    WHERE ac.clicked_at >= NOW() - INTERVAL '30 days'
  ) as clicks_last_30_days,
  
  COUNT(DISTINCT ac.id) FILTER (
    WHERE ac.converted = true
    AND ac.converted_at >= NOW() - INTERVAL '30 days'
  ) as sales_last_30_days,
  
  -- Taux de conversion
  CASE 
    WHEN al.total_clicks > 0 THEN (al.total_sales::NUMERIC / al.total_clicks) * 100
    ELSE 0
  END as conversion_rate,
  
  -- Informations produit
  p.name as product_name,
  p.slug as product_slug,
  p.price as product_price,
  p.image_url as product_image_url,
  
  -- Informations store
  s.name as store_name,
  s.slug as store_slug,
  
  -- Paramètres d'affiliation
  pas.commission_rate,
  pas.commission_type,
  pas.cookie_duration_days,
  
  -- Lien court associé (si existe)
  COUNT(DISTINCT asl.id) as short_links_count,
  MAX(asl.short_code) as latest_short_code

FROM affiliate_links al
LEFT JOIN products p ON p.id = al.product_id
LEFT JOIN stores s ON s.id = al.store_id
LEFT JOIN product_affiliate_settings pas ON pas.product_id = al.product_id
LEFT JOIN affiliate_clicks ac ON ac.affiliate_link_id = al.id
LEFT JOIN affiliate_short_links asl ON asl.affiliate_link_id = al.id AND asl.is_active = true
GROUP BY 
  al.id, al.affiliate_id, al.product_id, al.store_id, al.link_code, al.full_url,
  al.status, al.created_at, al.last_used_at, al.updated_at,
  al.total_clicks, al.total_sales, al.total_revenue, al.total_commission,
  p.name, p.slug, p.price, p.image_url,
  s.name, s.slug,
  pas.commission_rate, pas.commission_type, pas.cookie_duration_days;

COMMENT ON VIEW public.affiliate_links_with_stats IS 'Vue des liens d''affiliation avec toutes les statistiques et informations associées';

-- =========================================================
-- VUE 3 : Affiliate Commissions Detailed (Commissions détaillées)
-- =========================================================

CREATE OR REPLACE VIEW public.affiliate_commissions_detailed AS
SELECT 
  ac.id,
  ac.affiliate_id,
  ac.affiliate_link_id,
  ac.product_id,
  ac.store_id,
  ac.order_id,
  ac.payment_id,
  
  -- Montants
  ac.order_total,
  ac.commission_base,
  ac.commission_rate,
  ac.commission_type,
  ac.commission_amount,
  
  -- Statut
  ac.status,
  ac.approved_at,
  ac.approved_by,
  ac.rejected_at,
  ac.rejection_reason,
  ac.paid_at,
  ac.paid_by,
  ac.payment_method,
  ac.payment_reference,
  ac.payment_proof_url,
  
  ac.notes,
  ac.created_at,
  ac.updated_at,
  
  -- Informations affilié
  a.email as affiliate_email,
  a.display_name as affiliate_name,
  a.affiliate_code,
  
  -- Informations produit
  p.name as product_name,
  p.image_url as product_image_url,
  
  -- Informations commande
  o.order_number,
  o.total_amount as order_total_amount,
  o.created_at as order_date,
  
  -- Informations store
  s.name as store_name,
  
  -- Informations lien
  al.link_code,
  al.full_url as affiliate_link_url

FROM affiliate_commissions ac
LEFT JOIN affiliates a ON a.id = ac.affiliate_id
LEFT JOIN products p ON p.id = ac.product_id
LEFT JOIN orders o ON o.id = ac.order_id
LEFT JOIN stores s ON s.id = ac.store_id
LEFT JOIN affiliate_links al ON al.id = ac.affiliate_link_id;

COMMENT ON VIEW public.affiliate_commissions_detailed IS 'Vue des commissions avec toutes les informations détaillées associées';

-- =========================================================
-- VUE 4 : Daily Affiliate Stats (Statistiques journalières)
-- =========================================================

CREATE OR REPLACE VIEW public.affiliate_daily_stats AS
SELECT 
  a.id as affiliate_id,
  DATE(ac.clicked_at) as date,
  
  -- Clics
  COUNT(DISTINCT ac.id) as clicks_count,
  
  -- Ventes
  COUNT(DISTINCT ac.id) FILTER (WHERE ac.converted = true) as sales_count,
  
  -- Revenus
  COALESCE(SUM(comm.order_total) FILTER (WHERE comm.status IN ('approved', 'paid')), 0) as revenue,
  
  -- Commissions
  COALESCE(SUM(comm.commission_amount) FILTER (WHERE comm.status IN ('approved', 'paid')), 0) as commission_earned,
  
  -- Taux de conversion
  CASE 
    WHEN COUNT(DISTINCT ac.id) > 0 THEN 
      (COUNT(DISTINCT ac.id) FILTER (WHERE ac.converted = true)::NUMERIC / COUNT(DISTINCT ac.id)) * 100
    ELSE 0
  END as conversion_rate

FROM affiliates a
LEFT JOIN affiliate_clicks ac ON ac.affiliate_id = a.id
LEFT JOIN affiliate_commissions comm ON comm.affiliate_id = a.id
  AND DATE(comm.created_at) = DATE(ac.clicked_at)
WHERE ac.clicked_at IS NOT NULL
GROUP BY a.id, DATE(ac.clicked_at);

COMMENT ON VIEW public.affiliate_daily_stats IS 'Statistiques journalières agrégées par affilié pour les graphiques';

-- =========================================================
-- VUE 5 : Store Affiliates Summary (Résumé affiliés par store)
-- =========================================================

CREATE OR REPLACE VIEW public.store_affiliates_summary AS
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.user_id as store_owner_id,
  
  -- Nombre d'affiliés
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') as active_affiliates_count,
  COUNT(DISTINCT a.id) as total_affiliates_count,
  
  -- Statistiques globales
  COALESCE(SUM(al.total_clicks), 0) as total_clicks,
  COALESCE(SUM(al.total_sales), 0) as total_sales,
  COALESCE(SUM(al.total_revenue), 0) as total_revenue,
  COALESCE(SUM(al.total_commission), 0) as total_commission_paid,
  
  -- Produits avec affiliation
  COUNT(DISTINCT pas.product_id) FILTER (WHERE pas.affiliate_enabled = true) as products_with_affiliate,
  
  -- Commissions en attente d'approbation
  COUNT(DISTINCT ac.id) FILTER (WHERE ac.status = 'pending') as pending_commissions_count,
  COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.status = 'pending'), 0) as pending_commissions_amount,
  
  -- Taux de conversion global
  CASE 
    WHEN SUM(al.total_clicks) > 0 THEN 
      (SUM(al.total_sales)::NUMERIC / SUM(al.total_clicks)) * 100
    ELSE 0
  END as conversion_rate

FROM stores s
LEFT JOIN products p ON p.store_id = s.id
LEFT JOIN product_affiliate_settings pas ON pas.product_id = p.id
LEFT JOIN affiliate_links al ON al.product_id = p.id
LEFT JOIN affiliates a ON a.id = al.affiliate_id
LEFT JOIN affiliate_commissions ac ON ac.store_id = s.id
GROUP BY s.id, s.name, s.user_id;

COMMENT ON VIEW public.store_affiliates_summary IS 'Résumé des statistiques d''affiliation par store pour les vendeurs';

-- =========================================================
-- INDEX pour améliorer les performances des vues
-- =========================================================

-- Index sur affiliate_clicks pour les statistiques journalières
-- Index composite simple sur affiliate_id et clicked_at (plus efficace qu'un index sur DATE)
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_date 
ON affiliate_clicks(affiliate_id, clicked_at DESC);

-- Index sur affiliate_commissions pour les statistiques
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_status 
ON affiliate_commissions(affiliate_id, status);

-- Index sur affiliate_commissions pour les stats par store
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_store_status 
ON affiliate_commissions(store_id, status);

-- Index composite sur affiliate_links
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_product_status 
ON affiliate_links(affiliate_id, product_id, status);

-- =========================================================
-- FONCTION RPC : Get Affiliate Dashboard Data
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard_data(
  p_affiliate_id UUID
)
RETURNS TABLE (
  affiliate_id UUID,
  user_id UUID,
  email TEXT,
  display_name TEXT,
  affiliate_code TEXT,
  status TEXT,
  total_clicks INTEGER,
  total_sales INTEGER,
  total_revenue NUMERIC,
  total_commission_earned NUMERIC,
  total_commission_paid NUMERIC,
  pending_commission NUMERIC,
  conversion_rate NUMERIC,
  avg_order_value NUMERIC,
  avg_commission_per_sale NUMERIC,
  active_links_count BIGINT,
  total_links_count BIGINT,
  pending_commissions_count BIGINT,
  approved_commissions_count BIGINT,
  pending_withdrawals_count BIGINT,
  pending_withdrawals_amount NUMERIC,
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_link_used_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM affiliate_dashboard_data
  WHERE affiliate_dashboard_data.affiliate_id = p_affiliate_id;
END;
$$;

COMMENT ON FUNCTION public.get_affiliate_dashboard_data IS 'Récupère toutes les données nécessaires pour le dashboard affilié en une seule requête';

-- =========================================================
-- FONCTION RPC : Get Affiliate Daily Stats (pour graphiques)
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_daily_stats(
  p_affiliate_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  clicks_count BIGINT,
  sales_count BIGINT,
  revenue NUMERIC,
  commission_earned NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ads.date,
    ads.clicks_count,
    ads.sales_count,
    ads.revenue,
    ads.commission_earned,
    ads.conversion_rate
  FROM affiliate_daily_stats ads
  WHERE ads.affiliate_id = p_affiliate_id
    AND ads.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  ORDER BY ads.date ASC;
END;
$$;

COMMENT ON FUNCTION public.get_affiliate_daily_stats IS 'Récupère les statistiques journalières pour les graphiques d''affiliation';

-- =========================================================
-- GRANTS pour les vues
-- =========================================================

-- Les affiliés peuvent voir leurs propres données
GRANT SELECT ON public.affiliate_dashboard_data TO authenticated;
GRANT SELECT ON public.affiliate_links_with_stats TO authenticated;
GRANT SELECT ON public.affiliate_commissions_detailed TO authenticated;
GRANT SELECT ON public.affiliate_daily_stats TO authenticated;
GRANT SELECT ON public.store_affiliates_summary TO authenticated;

-- =========================================================
-- FIN DE LA MIGRATION
-- =========================================================

