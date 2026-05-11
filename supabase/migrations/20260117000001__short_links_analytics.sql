-- Migration: Analytics avancés pour les liens courts d'affiliation
-- Date : Janvier 2026
-- Description : Ajout de fonctions d'analytics et d'optimisation pour les liens courts

-- =========================================================
-- FONCTION : Analytics avancés pour les liens courts
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_short_links_analytics(
  p_affiliate_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_links INTEGER;
  v_active_links INTEGER;
  v_total_clicks INTEGER;
  v_avg_clicks_per_link NUMERIC;
  v_conversion_rate NUMERIC;
  v_top_performing_links JSONB;
  v_clicks_by_day JSONB;
  v_geographic_data JSONB;
BEGIN
  -- Statistiques générales
  SELECT
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN is_active THEN 1 END)::INTEGER,
    COALESCE(SUM(total_clicks), 0)::INTEGER
  INTO v_total_links, v_active_links, v_total_clicks
  FROM affiliate_short_links
  WHERE (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id);

  -- Moyenne de clics par lien
  v_avg_clicks_per_link := CASE
    WHEN v_total_links > 0 THEN ROUND(v_total_clicks::NUMERIC / v_total_links, 2)
    ELSE 0
  END;

  -- Top 5 liens les plus performants
  SELECT jsonb_agg(
    jsonb_build_object(
      'short_code', short_code,
      'custom_alias', custom_alias,
      'clicks', total_clicks,
      'is_active', is_active,
      'created_at', created_at,
      'last_used_at', last_used_at
    )
  ) INTO v_top_performing_links
  FROM (
    SELECT * FROM affiliate_short_links
    WHERE (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id)
    ORDER BY total_clicks DESC, created_at DESC
    LIMIT 5
  ) top_links;

  -- Clics par jour (derniers N jours)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'clicks', COALESCE(clicks, 0)
    )
  ) INTO v_clicks_by_day
  FROM (
    SELECT
      DATE(last_used_at) as date,
      COUNT(*) as clicks
    FROM affiliate_short_links
    WHERE (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id)
      AND last_used_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY DATE(last_used_at)
    ORDER BY date
  ) daily_clicks;

  -- Données géographiques (si tracking activé)
  SELECT jsonb_agg(
    jsonb_build_object(
      'country', country,
      'clicks', clicks)
  ) INTO v_geographic_data
  FROM (
    SELECT
      COALESCE(country, 'Unknown') as country,
      COUNT(*) as clicks
    FROM affiliate_clicks ac
    JOIN affiliate_links al ON al.id = ac.affiliate_link_id
    WHERE al.affiliate_id = COALESCE(p_affiliate_id, al.affiliate_id)
    GROUP BY country
    ORDER BY clicks DESC
    LIMIT 10
  ) geo_data;

  -- Taux de conversion (clics convertis / total clics)
  SELECT ROUND(
    CASE
      WHEN SUM(asl.total_clicks) > 0
      THEN (COUNT(CASE WHEN ac.converted THEN 1 END)::NUMERIC / SUM(asl.total_clicks)) * 100
      ELSE 0
    END, 2
  ) INTO v_conversion_rate
  FROM affiliate_short_links asl
  LEFT JOIN affiliate_links al ON al.id = asl.affiliate_link_id
  LEFT JOIN affiliate_clicks ac ON ac.affiliate_link_id = al.id AND ac.product_id = al.product_id
  WHERE (p_affiliate_id IS NULL OR asl.affiliate_id = p_affiliate_id);

  -- Construction du résultat
  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'total_links', v_total_links,
      'active_links', v_active_links,
      'inactive_links', v_total_links - v_active_links,
      'total_clicks', v_total_clicks,
      'avg_clicks_per_link', v_avg_clicks_per_link,
      'conversion_rate', v_conversion_rate
    ),
    'top_performing_links', COALESCE(v_top_performing_links, '[]'::jsonb),
    'clicks_by_day', COALESCE(v_clicks_by_day, '[]'::jsonb),
    'geographic_distribution', COALESCE(v_geographic_data, '[]'::jsonb),
    'period_days', p_days,
    'generated_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_affiliate_short_links_analytics IS 'Analytics avancés pour les liens courts d''affiliation avec métriques détaillées';

-- =========================================================
-- FONCTION : Recommandations d'optimisation pour les liens courts
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_short_link_optimization_suggestions(
  p_affiliate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_underperforming_links JSONB;
  v_suggestions JSONB[] := ARRAY[]::JSONB[];
BEGIN
  -- Liens sous-performants (peu de clics)
  SELECT jsonb_agg(
    jsonb_build_object(
      'short_code', link.short_code,
      'custom_alias', link.custom_alias,
      'clicks', link.total_clicks,
      'days_since_creation', EXTRACT(DAY FROM NOW() - link.created_at),
      'avg_daily_clicks', ROUND(link.total_clicks::NUMERIC / GREATEST(EXTRACT(DAY FROM NOW() - link.created_at), 1), 2)
    )
  ) INTO v_underperforming_links
  FROM (
    SELECT short_code, custom_alias, total_clicks, created_at
    FROM affiliate_short_links
    WHERE affiliate_id = p_affiliate_id
      AND total_clicks < 10
      AND created_at < NOW() - INTERVAL '7 days'
    ORDER BY total_clicks ASC
    LIMIT 5
  ) link;

  -- Suggestions basées sur les performances
  v_suggestions := ARRAY[]::JSONB[];

  -- Suggestion 1: Liens sous-performants
  IF v_underperforming_links IS NOT NULL AND jsonb_array_length(v_underperforming_links) > 0 THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'underperforming_links',
      'priority', 'high',
      'title', 'Liens sous-performants détectés',
      'description', 'Certains liens reçoivent peu de trafic. Considérez les promouvoir davantage.',
      'affected_links', v_underperforming_links,
      'action_suggestion', 'Augmentez la visibilité de ces liens sur vos canaux de communication'
    );
  END IF;

  -- Suggestion 2: Pas d'alias personnalisé
  IF EXISTS (
    SELECT 1 FROM affiliate_short_links
    WHERE affiliate_id = p_affiliate_id
      AND custom_alias IS NULL
      AND total_clicks > 50
  ) THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'missing_custom_alias',
      'priority', 'medium',
      'title', 'Liens populaires sans alias personnalisé',
      'description', 'Vos liens les plus populaires n''ont pas d''alias mémorable.',
      'action_suggestion', 'Ajoutez des alias personnalisés pour améliorer la mémorisation'
    );
  END IF;

  -- Suggestion 3: Liens expirés proches
  IF EXISTS (
    SELECT 1 FROM affiliate_short_links
    WHERE affiliate_id = p_affiliate_id
      AND expires_at IS NOT NULL
      AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  ) THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'expiring_links',
      'priority', 'medium',
      'title', 'Liens arrivant à expiration',
      'description', 'Certains liens courts arrivent bientôt à expiration.',
      'action_suggestion', 'Renouvelez ou supprimez les liens expirés'
    );
  END IF;

  -- Construction du résultat
  v_result := jsonb_build_object(
    'affiliate_id', p_affiliate_id,
    'suggestions', v_suggestions,
    'total_suggestions', array_length(v_suggestions, 1),
    'generated_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_short_link_optimization_suggestions IS 'Génère des suggestions d''optimisation pour améliorer les performances des liens courts';