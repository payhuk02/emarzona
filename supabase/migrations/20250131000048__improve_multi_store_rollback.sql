-- Migration: Amélioration du système de rollback pour multi-stores
-- Date: 2025-01-31
-- Description: Ajoute des fonctions pour nettoyer les commandes orphelines et améliorer le rollback

-- Ajouter la colonne metadata si elle n'existe pas
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index GIN sur metadata pour améliorer les performances des requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin 
ON public.orders USING GIN (metadata);

-- Fonction pour nettoyer les commandes orphelines (commandes multi-stores non payées après X heures)
CREATE OR REPLACE FUNCTION cleanup_orphaned_multi_store_orders(
  p_hours_threshold INTEGER DEFAULT 24
)
RETURNS TABLE(
  cleaned_orders_count INTEGER,
  cleaned_order_items_count INTEGER,
  cleaned_transactions_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_orders INTEGER := 0;
  v_cleaned_order_items INTEGER := 0;
  v_cleaned_transactions INTEGER := 0;
  v_threshold_timestamp TIMESTAMP;
BEGIN
  -- Calculer le timestamp seuil
  v_threshold_timestamp := NOW() - (p_hours_threshold || ' hours')::INTERVAL;

  -- Trouver les commandes orphelines (multi-stores, non payées, créées il y a plus de X heures)
  -- et sans transactions complétées
  WITH orphaned_orders AS (
    SELECT o.id
    FROM orders o
    WHERE (o.metadata->>'multi_store') = 'true'
      AND o.payment_status = 'pending'
      AND o.created_at < v_threshold_timestamp
      AND NOT EXISTS (
        SELECT 1
        FROM transactions t
        WHERE t.order_id = o.id
          AND t.status = 'completed'
      )
      -- Ne pas nettoyer les commandes qui ont des transactions en cours
      AND NOT EXISTS (
        SELECT 1
        FROM transactions t
        WHERE t.order_id = o.id
          AND t.status IN ('processing', 'pending')
          AND t.created_at > v_threshold_timestamp
      )
  )
  -- Supprimer les transactions associées (si elles existent)
  DELETE FROM transactions
  WHERE order_id IN (SELECT id FROM orphaned_orders)
    AND status != 'completed';

  -- Compter les transactions supprimées
  GET DIAGNOSTICS v_cleaned_transactions = ROW_COUNT;

  -- Supprimer les order_items associés (les order_items seront supprimés en cascade si la FK le permet)
  -- Sinon, on les supprime explicitement
  DELETE FROM order_items
  WHERE order_id IN (SELECT id FROM orphaned_orders);

  GET DIAGNOSTICS v_cleaned_order_items = ROW_COUNT;

  -- Supprimer les commandes orphelines
  DELETE FROM orders
  WHERE id IN (SELECT id FROM orphaned_orders);

  GET DIAGNOSTICS v_cleaned_orders = ROW_COUNT;

  -- Logger le nettoyage
  IF v_cleaned_orders > 0 THEN
    INSERT INTO transaction_logs (
      event_type,
      status,
      request_data
    ) VALUES (
      'orphaned_orders_cleanup',
      'completed',
      jsonb_build_object(
        'cleaned_orders', v_cleaned_orders,
        'cleaned_order_items', v_cleaned_order_items,
        'cleaned_transactions', v_cleaned_transactions,
        'threshold_hours', p_hours_threshold,
        'threshold_timestamp', v_threshold_timestamp
      )
    );
  END IF;

  -- Retourner les résultats
  RETURN QUERY SELECT v_cleaned_orders, v_cleaned_order_items, v_cleaned_transactions;
END;
$$;

COMMENT ON FUNCTION cleanup_orphaned_multi_store_orders IS 
'Nettoye les commandes multi-stores orphelines (non payées après X heures)';

-- Fonction pour nettoyer un groupe multi-stores spécifique (utile pour le rollback)
CREATE OR REPLACE FUNCTION cleanup_multi_store_group(
  p_group_id TEXT,
  p_customer_id UUID
)
RETURNS TABLE(
  cleaned_orders_count INTEGER,
  cleaned_order_items_count INTEGER,
  cleaned_transactions_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_orders INTEGER := 0;
  v_cleaned_order_items INTEGER := 0;
  v_cleaned_transactions INTEGER := 0;
  v_order_ids UUID[];
BEGIN
  -- Récupérer les IDs des commandes du groupe
  SELECT array_agg(id)
  INTO v_order_ids
  FROM orders
  WHERE (metadata->>'group_id') = p_group_id
    AND customer_id = p_customer_id
    AND payment_status = 'pending'; -- Ne nettoyer que les commandes non payées

  -- Si aucune commande trouvée, sortir
  IF v_order_ids IS NULL OR array_length(v_order_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  -- Supprimer les transactions associées (non complétées)
  DELETE FROM transactions
  WHERE order_id = ANY(v_order_ids)
    AND status != 'completed';

  GET DIAGNOSTICS v_cleaned_transactions = ROW_COUNT;

  -- Supprimer les order_items associés
  DELETE FROM order_items
  WHERE order_id = ANY(v_order_ids);

  GET DIAGNOSTICS v_cleaned_order_items = ROW_COUNT;

  -- Supprimer les commandes
  DELETE FROM orders
  WHERE id = ANY(v_order_ids);

  GET DIAGNOSTICS v_cleaned_orders = ROW_COUNT;

  -- Logger le nettoyage
  IF v_cleaned_orders > 0 THEN
    INSERT INTO transaction_logs (
      event_type,
      status,
      request_data
    ) VALUES (
      'multi_store_group_cleanup',
      'completed',
      jsonb_build_object(
        'group_id', p_group_id,
        'customer_id', p_customer_id,
        'cleaned_orders', v_cleaned_orders,
        'cleaned_order_items', v_cleaned_order_items,
        'cleaned_transactions', v_cleaned_transactions
      )
    );
  END IF;

  -- Retourner les résultats
  RETURN QUERY SELECT v_cleaned_orders, v_cleaned_order_items, v_cleaned_transactions;
END;
$$;

COMMENT ON FUNCTION cleanup_multi_store_group IS 
'Nettoye un groupe multi-stores spécifique (utile pour le rollback manuel)';

-- Fonction pour vérifier et nettoyer les commandes orphelines d'un groupe
-- (utile pour détecter les groupes partiellement créés)
CREATE OR REPLACE FUNCTION check_and_cleanup_incomplete_groups()
RETURNS TABLE(
  cleaned_groups_count INTEGER,
  total_cleaned_orders INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_groups INTEGER := 0;
  v_total_cleaned_orders INTEGER := 0;
  v_group_record RECORD;
  v_cleaned_count INTEGER;
BEGIN
  -- Trouver les groupes multi-stores incomplets
  -- (groupes où certaines commandes sont payées mais d'autres non, et créées il y a plus de 48h)
  FOR v_group_record IN
    SELECT 
      (metadata->>'group_id') as group_id,
      customer_id,
      COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_count,
      COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_count,
      COUNT(*) as total_count,
      MIN(created_at) as created_at
    FROM orders
    WHERE (metadata->>'multi_store') = 'true'
      AND (metadata->>'group_id') IS NOT NULL
      AND created_at < NOW() - INTERVAL '48 hours'
    GROUP BY (metadata->>'group_id'), customer_id
    HAVING COUNT(*) FILTER (WHERE payment_status = 'pending') > 0
      AND COUNT(*) FILTER (WHERE payment_status = 'paid') = 0
      -- Ne nettoyer que si toutes les commandes sont non payées
  LOOP
    -- Nettoyer le groupe
    SELECT cleaned_orders_count INTO v_cleaned_count
    FROM cleanup_multi_store_group(
      v_group_record.group_id,
      v_group_record.customer_id
    );

    v_total_cleaned_orders := v_total_cleaned_orders + COALESCE(v_cleaned_count, 0);
    
    IF v_cleaned_count > 0 THEN
      v_cleaned_groups := v_cleaned_groups + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_cleaned_groups, v_total_cleaned_orders;
END;
$$;

COMMENT ON FUNCTION check_and_cleanup_incomplete_groups IS 
'Vérifie et nettoie les groupes multi-stores incomplets (toutes commandes non payées après 48h)';

-- Index pour améliorer les performances des requêtes de nettoyage
-- Note: Pour les index partiels avec expressions JSONB, utiliser des expressions fonctionnelles entre parenthèses
-- et vérifier que la colonne existe avant de créer l'index

DO $$
BEGIN
  -- Vérifier si la colonne metadata existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'metadata'
  ) THEN
    -- Index pour les commandes multi-stores
    CREATE INDEX IF NOT EXISTS idx_orders_multi_store_cleanup 
    ON public.orders((metadata->>'multi_store'), payment_status, created_at)
    WHERE (metadata->>'multi_store') = 'true';

    -- Index pour les group_id
    CREATE INDEX IF NOT EXISTS idx_orders_group_id_cleanup 
    ON public.orders((metadata->>'group_id'), customer_id, payment_status)
    WHERE (metadata->>'group_id') IS NOT NULL;
  END IF;
END $$;

