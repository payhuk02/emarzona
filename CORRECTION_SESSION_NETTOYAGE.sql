-- ======================================================================================
-- DIAGNOSTIC SESSION : Analyse et Recommandations de Nettoyage
-- ⚠️  ATTENTION: Ce script NE MODIFIE PAS les tables système Supabase Auth
-- Il fournit uniquement des diagnostics et recommandations
-- ======================================================================================

-- Étape 1 : DIAGNOSTIC seulement - Analyse des sessions (pas de modification)
-- Nous ne pouvons pas modifier les tables auth.* car nous n'en sommes pas propriétaires

-- Étape 3 : Fonction de diagnostic des sessions utilisateur (lecture seule)
CREATE OR REPLACE FUNCTION diagnose_user_sessions(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  total_sessions BIGINT,
  recent_sessions BIGINT,
  session_age_hours DECIMAL,
  recommendation TEXT
) AS $$
BEGIN
  -- Diagnostic pour un utilisateur spécifique ou tous les utilisateurs
  RETURN QUERY
  SELECT
    s.user_id,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN s.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_sessions,
    ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(s.created_at))) / 3600, 1) as session_age_hours,
    CASE
      WHEN COUNT(*) = 0 THEN 'Aucune session trouvée'
      WHEN MAX(s.created_at) < NOW() - INTERVAL '7 days' THEN 'Sessions anciennes, possible problème de persistance'
      WHEN COUNT(*) > 5 THEN 'Multiples sessions, possible problème de nettoyage'
      ELSE 'Sessions normales'
    END as recommendation
  FROM auth.sessions s
  WHERE (user_uuid IS NULL OR s.user_id = user_uuid)
    AND s.user_id IS NOT NULL
  GROUP BY s.user_id
  ORDER BY recent_sessions DESC, total_sessions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 4 : Fonction de diagnostic de l'état utilisateur (lecture seule)
CREATE OR REPLACE FUNCTION check_user_session_health(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  session_info JSON;
  store_info JSON;
BEGIN
  -- Informations sur les sessions (lecture seule)
  SELECT json_build_object(
    'total_sessions', COUNT(*),
    'recent_sessions', COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END),
    'oldest_session_hours', EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600,
    'newest_session_hours', EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600
  ) INTO session_info
  FROM auth.sessions
  WHERE user_id = user_uuid;

  -- Informations sur les boutiques
  SELECT json_build_object(
    'total_stores', COUNT(*),
    'can_create_more', COUNT(*) < 3,
    'remaining_slots', GREATEST(0, 3 - COUNT(*))
  ) INTO store_info
  FROM stores
  WHERE user_id = user_uuid;

  -- Diagnostic global
  result := json_build_object(
    'user_id', user_uuid,
    'session_health', session_info,
    'store_health', store_info,
    'recommendations', json_build_array(
      CASE WHEN (session_info->>'recent_sessions')::int = 0
           THEN 'Aucune session récente - vérifier la persistance'
           ELSE 'Sessions actives - OK' END,
      CASE WHEN (store_info->>'total_stores')::int >= 3
           THEN 'Limite de boutiques atteinte'
           ELSE 'Peut créer plus de boutiques' END
    ),
    'diagnosed_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 2 : Améliorer les indexes pour les tables que nous contrôlons
CREATE INDEX IF NOT EXISTS idx_stores_user_active ON stores(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stores_user_created ON stores(user_id, created_at DESC);

-- Étape 3 : Fonction de diagnostic des sessions (lecture seule)

-- Étape 5 : Vue pour monitorer l'activité des utilisateurs (basée sur nos tables)
CREATE OR REPLACE VIEW user_activity_monitor AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as stores_created,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_store_age_days,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_stores
FROM stores
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Permissions (pour les fonctions de diagnostic que nous contrôlons)
GRANT SELECT ON user_activity_monitor TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_user_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_session_health(UUID) TO authenticated;

-- ================================================================================
-- TESTS DE VALIDATION (LECTURE SEULE)
-- ================================================================================

-- Test 1 : Diagnostiquer les sessions utilisateur (remplacé l'ancienne fonction)
-- SELECT * FROM diagnose_user_sessions(); -- Tous les utilisateurs
-- SELECT * FROM diagnose_user_sessions('your-user-uuid'); -- Utilisateur spécifique

-- Test 2 : Vérifier la santé d'un utilisateur
-- SELECT check_user_session_health('your-user-uuid');

-- Test 3 : Monitorer l'activité des boutiques (remplace session_health_monitor)
-- SELECT * FROM user_activity_monitor LIMIT 10;

-- ================================================================================
-- INSTRUCTIONS POST-CORRECTION
-- ================================================================================

/*
APRÈS AVOIR EXÉCUTÉ CE SCRIPT :

1. ✅ Le script fournit des diagnostics sans modifier les tables système
2. ✅ Compatible avec toutes les permissions utilisateur
3. Tester la connexion/déconnexion pendant 24h
4. Vérifier que les données de boutique persistent
5. Monitorer les logs pour les erreurs de session

Les améliorations incluent :
- ✅ Diagnostics intelligents sans permissions spéciales
- ✅ Validation des données localStorage côté client
- ✅ Gestion d'erreurs JWT moins agressive côté client
- ✅ Synchronisation améliorée des contexts côté client
- ✅ Cache plus robuste pour les données de boutique
- ✅ Indexes sur nos tables (stores) seulement

🔧 APPROCHE SÉCURISÉE :
- Aucune modification des tables auth.* (réservées à Supabase)
- Diagnostics et recommandations seulement
- Compatible avec tous les niveaux de permissions
- Zero risk de corruption des données système

📋 RECOMMANDATIONS MANUELLES :
Pour nettoyer les sessions auth.*, contactez le support Supabase ou utilisez le Dashboard.
*/