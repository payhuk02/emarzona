-- =========================================================
-- Migration : Index optimisés pour les notifications
-- Date : 2 Février 2025
-- Description : Ajoute des index pour améliorer les performances des requêtes
-- =========================================================

-- Index sur is_archived pour le filtre archivées
CREATE INDEX IF NOT EXISTS idx_notifications_is_archived 
  ON public.notifications(is_archived) 
  WHERE is_archived = true;

-- Index composite pour les requêtes complexes (user_id, is_archived, is_read)
-- Utile pour les filtres combinés dans la page de gestion
CREATE INDEX IF NOT EXISTS idx_notifications_user_archived_read 
  ON public.notifications(user_id, is_archived, is_read, created_at DESC);

-- Index composite pour les notifications non lues et non archivées
-- Optimise la fonction get_unread_count()
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_not_archived 
  ON public.notifications(user_id, is_read, is_archived) 
  WHERE is_read = false AND is_archived = false;

-- Index sur priority pour le tri par priorité
CREATE INDEX IF NOT EXISTS idx_notifications_priority 
  ON public.notifications(priority, created_at DESC);

-- Commentaires
COMMENT ON INDEX idx_notifications_is_archived IS 
'Index pour optimiser le filtre des notifications archivées';

COMMENT ON INDEX idx_notifications_user_archived_read IS 
'Index composite pour optimiser les requêtes avec filtres multiples (user, archived, read, date)';

COMMENT ON INDEX idx_notifications_user_unread_not_archived IS 
'Index pour optimiser le comptage des notifications non lues et non archivées';

COMMENT ON INDEX idx_notifications_priority IS 
'Index pour optimiser le tri par priorité et date';

