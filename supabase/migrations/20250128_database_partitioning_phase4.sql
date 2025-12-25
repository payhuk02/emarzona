-- ================================================================
-- Database Partitioning - Phase 4 Scalability
-- Date: 2025-01-28
-- Description: Partitionnement des grandes tables pour améliorer les performances
-- ================================================================

-- =====================================================
-- 1. PARTITIONING: orders (par date)
-- =====================================================
-- Les commandes sont partitionnées par mois pour améliorer les performances
-- sur les requêtes historiques

-- Créer la table partitionnée si elle n'existe pas déjà
DO $$
DECLARE
  month_date DATE;
  partition_name TEXT;
  i INTEGER;
BEGIN
  -- Vérifier si la table orders existe et n'est pas déjà partitionnée
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'orders'
    AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'orders_partitioned'
  ) THEN
    -- Créer la table partitionnée SANS la contrainte PRIMARY KEY
    -- (car la PK doit inclure created_at pour les tables partitionnées)
    -- On crée la table manuellement pour éviter que LIKE copie la PRIMARY KEY
    EXECUTE '
      CREATE TABLE IF NOT EXISTS orders_partitioned (
        id UUID DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL,
        customer_id UUID,
        status TEXT NOT NULL DEFAULT ''pending'',
        total_amount NUMERIC NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT ''XOF'',
        payment_status TEXT DEFAULT ''unpaid'',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      ) PARTITION BY RANGE (created_at)
    ';
    
    -- Ajouter les contraintes et références
    EXECUTE 'ALTER TABLE orders_partitioned ADD CONSTRAINT orders_partitioned_store_id_fkey 
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE orders_partitioned ADD CONSTRAINT orders_partitioned_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL';
    
    -- Ajouter une PRIMARY KEY qui inclut created_at (requis pour tables partitionnées)
    EXECUTE 'ALTER TABLE orders_partitioned ADD PRIMARY KEY (id, created_at)';
    
    -- Créer les partitions pour les 12 derniers mois
    FOR i IN 0..11 LOOP
      month_date := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
      partition_name := 'orders_' || TO_CHAR(month_date, 'YYYY_MM');
      
      -- Utiliser le format correct pour les partitions PostgreSQL
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF orders_partitioned
        FOR VALUES FROM (%L::TIMESTAMPTZ) TO ((%L)::TIMESTAMPTZ)
      ', 
        partition_name,
        month_date::TEXT,
        (month_date + INTERVAL '1 month')::TEXT
      );
    END LOOP;
    
    -- Créer une partition par défaut pour les futures données
    EXECUTE 'CREATE TABLE IF NOT EXISTS orders_default PARTITION OF orders_partitioned DEFAULT';
  END IF;
END $$;

-- =====================================================
-- 2. PARTITIONING: order_items (par order_id range)
-- =====================================================
-- Les order_items peuvent être partitionnées par range de order_id
-- pour améliorer les jointures avec orders

-- =====================================================
-- 3. PARTITIONING: digital_product_downloads (par date)
-- =====================================================
-- Les téléchargements sont partitionnés par mois
DO $$
DECLARE
  month_date DATE;
  partition_name TEXT;
  i INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_product_downloads'
    AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_product_downloads_partitioned'
  ) THEN
    -- Créer la table partitionnée SANS la contrainte PRIMARY KEY
    -- On crée la table manuellement pour éviter que LIKE copie la PRIMARY KEY
    EXECUTE '
      CREATE TABLE IF NOT EXISTS digital_product_downloads_partitioned (
        id UUID DEFAULT gen_random_uuid(),
        digital_product_id UUID NOT NULL,
        file_id UUID,
        user_id UUID NOT NULL,
        download_date TIMESTAMPTZ NOT NULL DEFAULT now(),
        download_ip TEXT,
        download_country TEXT,
        user_agent TEXT,
        download_method TEXT DEFAULT ''web'',
        download_duration_seconds INTEGER,
        download_speed_mbps NUMERIC,
        download_success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        license_key TEXT,
        license_id UUID,
        file_version TEXT,
        session_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      ) PARTITION BY RANGE (download_date)
    ';
    
    -- Ajouter les contraintes et références
    EXECUTE 'ALTER TABLE digital_product_downloads_partitioned ADD CONSTRAINT digital_downloads_partitioned_product_id_fkey 
      FOREIGN KEY (digital_product_id) REFERENCES digital_products(id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE digital_product_downloads_partitioned ADD CONSTRAINT digital_downloads_partitioned_file_id_fkey 
      FOREIGN KEY (file_id) REFERENCES digital_product_files(id) ON DELETE SET NULL';
    EXECUTE 'ALTER TABLE digital_product_downloads_partitioned ADD CONSTRAINT digital_downloads_partitioned_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
    
    -- Ajouter une PRIMARY KEY qui inclut download_date (requis pour tables partitionnées)
    EXECUTE 'ALTER TABLE digital_product_downloads_partitioned ADD PRIMARY KEY (id, download_date)';
    
    -- Créer les partitions pour les 12 derniers mois
    FOR i IN 0..11 LOOP
      month_date := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
      partition_name := 'digital_downloads_' || TO_CHAR(month_date, 'YYYY_MM');
      
      -- Utiliser le format correct pour les partitions PostgreSQL
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF digital_product_downloads_partitioned
        FOR VALUES FROM (%L::TIMESTAMPTZ) TO ((%L)::TIMESTAMPTZ)
      ', 
        partition_name,
        month_date::TEXT,
        (month_date + INTERVAL '1 month')::TEXT
      );
    END LOOP;
    
    -- Partition par défaut
    EXECUTE 'CREATE TABLE IF NOT EXISTS digital_downloads_default PARTITION OF digital_product_downloads_partitioned DEFAULT';
  END IF;
END $$;

-- =====================================================
-- 4. PARTITIONING: transaction_logs (par date)
-- =====================================================
-- Les logs de transactions sont partitionnés par mois
DO $$
DECLARE
  month_date DATE;
  partition_name TEXT;
  i INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_logs'
    AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_logs_partitioned'
  ) THEN
    -- Créer la table partitionnée SANS la contrainte PRIMARY KEY
    -- On crée la table manuellement pour éviter que LIKE copie la PRIMARY KEY
    -- Note: Structure basique - ajuster selon la structure réelle de transaction_logs
    EXECUTE '
      CREATE TABLE IF NOT EXISTS transaction_logs_partitioned (
        id UUID DEFAULT gen_random_uuid(),
        transaction_id UUID,
        status TEXT,
        message TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      ) PARTITION BY RANGE (created_at)
    ';
    
    -- Ajouter une PRIMARY KEY qui inclut created_at (requis pour tables partitionnées)
    EXECUTE 'ALTER TABLE transaction_logs_partitioned ADD PRIMARY KEY (id, created_at)';
    
    -- Créer les partitions pour les 12 derniers mois
    FOR i IN 0..11 LOOP
      month_date := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
      partition_name := 'transaction_logs_' || TO_CHAR(month_date, 'YYYY_MM');
      
      -- Utiliser le format correct pour les partitions PostgreSQL
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF transaction_logs_partitioned
        FOR VALUES FROM (%L::TIMESTAMPTZ) TO ((%L)::TIMESTAMPTZ)
      ', 
        partition_name,
        month_date::TEXT,
        (month_date + INTERVAL '1 month')::TEXT
      );
    END LOOP;
    
    -- Partition par défaut
    EXECUTE 'CREATE TABLE IF NOT EXISTS transaction_logs_default PARTITION OF transaction_logs_partitioned DEFAULT';
  END IF;
END $$;

-- =====================================================
-- 5. INDEXES pour les partitions
-- =====================================================
-- Créer des index sur les colonnes fréquemment utilisées dans les partitions
-- Les index sont créés de manière conditionnelle pour éviter les erreurs si les tables n'existent pas

-- Index sur orders_partitioned (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_partitioned') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_partitioned_customer_id ON orders_partitioned(customer_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_partitioned_store_id ON orders_partitioned(store_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_partitioned_status ON orders_partitioned(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_partitioned_payment_status ON orders_partitioned(payment_status)';
  END IF;
END $$;

-- Index sur digital_product_downloads_partitioned (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_product_downloads_partitioned') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_digital_downloads_partitioned_user_id ON digital_product_downloads_partitioned(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_digital_downloads_partitioned_product_id ON digital_product_downloads_partitioned(digital_product_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_digital_downloads_partitioned_success ON digital_product_downloads_partitioned(download_success)';
  END IF;
END $$;

-- Index sur transaction_logs_partitioned (seulement si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_logs_partitioned') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transaction_logs_partitioned_transaction_id ON transaction_logs_partitioned(transaction_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transaction_logs_partitioned_status ON transaction_logs_partitioned(status)';
  END IF;
END $$;

-- =====================================================
-- 6. FUNCTION pour créer automatiquement les partitions futures
-- =====================================================
-- Fonction pour créer automatiquement les partitions mensuelles

CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  month_date DATE;
  partition_name TEXT;
  table_name TEXT;
BEGIN
  -- Créer les partitions pour le mois suivant
  month_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  
  -- Orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_partitioned') THEN
    partition_name := 'orders_' || TO_CHAR(month_date, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF orders_partitioned
        FOR VALUES FROM (%L::TIMESTAMPTZ) TO ((%L)::TIMESTAMPTZ)
      ', partition_name, month_date::TEXT, (month_date + INTERVAL '1 month')::TEXT);
    END IF;
  END IF;
  
  -- Digital Downloads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_product_downloads_partitioned') THEN
    partition_name := 'digital_downloads_' || TO_CHAR(month_date, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF digital_product_downloads_partitioned
        FOR VALUES FROM (%L::TIMESTAMPTZ) TO ((%L)::TIMESTAMPTZ)
      ', partition_name, month_date::TEXT, (month_date + INTERVAL '1 month')::TEXT);
    END IF;
  END IF;
  
  -- Transaction Logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_logs_partitioned') THEN
    partition_name := 'transaction_logs_' || TO_CHAR(month_date, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF transaction_logs_partitioned
        FOR VALUES FROM (%L::TIMESTAMPTZ) TO ((%L)::TIMESTAMPTZ)
      ', partition_name, month_date::TEXT, (month_date + INTERVAL '1 month')::TEXT);
    END IF;
  END IF;
END;
$$;

-- =====================================================
-- 7. COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION create_monthly_partitions() IS 
'Crée automatiquement les partitions mensuelles pour les tables partitionnées';

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================
-- ⚠️ ATTENTION: Cette migration crée des tables partitionnées
-- mais ne migre PAS automatiquement les données existantes
-- 
-- Pour migrer les données en production:
-- 1. Créer les tables partitionnées
-- 2. Insérer les données: INSERT INTO orders_partitioned SELECT * FROM orders;
-- 3. Renommer les tables: ALTER TABLE orders RENAME TO orders_old;
-- 4. Renommer la partitionnée: ALTER TABLE orders_partitioned RENAME TO orders;
-- 5. Vérifier que tout fonctionne
-- 6. Supprimer l'ancienne table après vérification
--
-- Cette migration est préparée pour une migration future
-- et ne modifie PAS les tables existantes pour éviter les risques

