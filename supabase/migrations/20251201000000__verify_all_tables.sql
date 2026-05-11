-- ============================================================
-- VÉRIFICATION DE TOUTES LES TABLES DE LA PLATEFORME EMARZONA
-- Date: 1er Décembre 2025
-- Auteur: Emarzona Team
-- ============================================================

-- Liste de toutes les tables attendues dans la plateforme
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        -- Tables principales utilisateurs et authentification
        'profiles',
        'users',
        'auth.users',
        
        -- Tables de produits
        'products',
        'digital_products',
        'digital_product_files',
        'digital_licenses',
        'physical_products',
        'physical_product_variants',
        'inventory_items',
        'physical_product_inventory',
        'service_products',
        'service_bookings',
        'service_availability_slots',
        
        -- Tables de commandes et paiements
        'orders',
        'order_items',
        'transactions',
        'payment_methods',
        'invoices',
        'taxes',
        
        -- Tables de boutiques
        'stores',
        'store_settings',
        'store_customization',
        'store_team',
        'store_withdrawals',
        'store_payment_methods',
        
        -- Tables de panier
        'cart',
        'cart_items',
        'wishlist',
        'wishlist_items',
        
        -- Tables de coupons et promotions
        'coupons',
        'coupon_usage',
        'gift_cards',
        'gift_card_transactions',
        
        -- Tables d'affiliation
        'affiliates',
        'affiliate_commissions',
        'affiliate_links',
        'affiliate_short_links',
        'commission_payments',
        
        -- Tables de cours et formations
        'courses',
        'course_lessons',
        'course_enrollments',
        'course_progress',
        'course_assignments',
        'course_cohorts',
        'course_gamification',
        'course_learning_paths',
        'course_live_sessions',
        'course_notes',
        'course_prerequisites',
        'course_drip_content',
        'quiz_questions',
        'quiz_answers',
        
        -- Tables de reviews et évaluations
        'reviews',
        'review_media',
        'product_ratings',
        
        -- Tables de notifications
        'notifications',
        'notification_preferences',
        'push_notifications',
        
        -- Tables de messagerie
        'conversations',
        'messages',
        'vendor_conversations',
        'shipping_service_conversations',
        
        -- Tables de stock et inventaire
        'warehouses',
        'warehouse_items',
        'inventory_movements',
        'suppliers',
        'purchase_orders',
        
        -- Tables de livraison
        'shipping_methods',
        'shipping_carriers',
        'shipping_rates',
        'shipments',
        'tracking_numbers',
        
        -- Tables de retours et garanties
        'returns',
        'return_items',
        'warranties',
        'repairs',
        
        -- Tables d'analytics
        'product_analytics',
        'store_analytics',
        'order_analytics',
        'user_analytics',
        'analytics_events',
        
        -- Tables de recherche
        'product_search',
        'product_recommendations',
        'price_stock_alerts',
        
        -- Tables de templates
        'product_templates',
        'user_templates',
        
        -- Tables de communauté
        'community_posts',
        'community_comments',
        'community_likes',
        'community_follows',
        
        -- Tables de clients
        'customers',
        'customer_addresses',
        
        -- Tables de webhooks
        'webhooks',
        'webhook_events',
        'webhook_logs',
        
        -- Tables de paramètres plateforme
        'platform_settings',
        'platform_roles',
        'admin_actions',
        'admin_config',
        
        -- Tables de disputes
        'disputes',
        'dispute_messages',
        'dispute_resolutions',
        
        -- Tables de licences
        'product_licenses',
        'license_activations',
        
        -- Tables de souscriptions
        'subscriptions',
        'subscription_plans',
        'subscription_payments',
        
        -- Tables de réservations récurrentes
        'recurring_bookings',
        'booking_schedules',
        
        -- Tables de lots et expiration
        'product_lots',
        'lot_expiration_alerts',
        
        -- Tables de suivi de série
        'serial_numbers',
        'serial_tracking',
        
        -- Tables de kits produits
        'product_kits',
        'kit_items',
        
        -- Tables de devis
        'quotes',
        'quote_items',
        
        -- Tables de facturation
        'invoices',
        'invoice_items',
        'invoice_taxes',
        
        -- Tables de multi-devises
        'currencies',
        'currency_rates',
        'currency_conversion_logs',
        
        -- Tables de multi-régions
        'regions',
        'region_settings',
        
        -- Tables de préférences utilisateur
        'user_preferences',
        'cookie_preferences',
        
        -- Tables de sécurité
        'api_keys',
        'rate_limits',
        'transaction_retries',
        
        -- Tables de stockage
        'storage_buckets',
        'storage_objects',
        
        -- Tables de vidéos
        'video_uploads',
        'video_processing',
        
        -- Tables de fichiers
        'file_uploads',
        'file_metadata',
        
        -- Tables de tracking
        'abandoned_carts',
        'upsell_tracking',
        'referral_codes',
        'referral_commissions',
        
        -- Tables de gamification
        'user_points',
        'user_badges',
        'user_achievements',
        
        -- Tables de livraison par lots
        'batch_shipments',
        'batch_shipment_items',
        
        -- Tables d'optimisation de coûts
        'cost_optimization',
        'cost_analysis',
        
        -- Tables de prévision de demande
        'demand_forecasts',
        'forecast_accuracy',
        
        -- Tables de ressources
        'resources',
        'resource_bookings',
        'resource_conflicts',
        'staff_availability',
        
        -- Tables de personnalisation avancée
        'store_advanced_customization',
        'store_info_messages',
        
        -- Tables de produits artistes
        'artist_products',
        'artist_profiles',
        
        -- Tables de suivi d'expédition
        'shipping_tracking',
        'delivery_confirmations',
        
        -- Tables de protection de téléchargement
        'download_protections',
        'download_attempts',
        
        -- Tables de versioning produits
        'product_versions',
        'version_history',
        
        -- Tables de bundles digitaux
        'digital_bundles',
        'bundle_items',
        
        -- Tables de gestion de licences digitales
        'digital_license_keys',
        'license_usage_tracking'
    ];
    
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    existing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    table_exists BOOLEAN;
    total_expected INT;
    total_existing INT;
    total_missing INT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION DES TABLES EMARZONA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    total_expected := array_length(expected_tables, 1);
    RAISE NOTICE '📊 Nombre total de tables attendues: %', total_expected;
    RAISE NOTICE '';
    
    -- Vérifier chaque table
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        -- Vérifier dans le schéma public
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        -- Si pas trouvé dans public, vérifier dans auth
        IF NOT table_exists AND table_name = 'users' THEN
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'auth' 
                AND table_name = 'users'
            ) INTO table_exists;
        END IF;
        
        IF table_exists THEN
            existing_tables := array_append(existing_tables, table_name);
            RAISE NOTICE '✅ %', table_name;
        ELSE
            missing_tables := array_append(missing_tables, table_name);
            RAISE NOTICE '❌ % (MANQUANTE)', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RÉSUMÉ';
    RAISE NOTICE '========================================';
    
    total_existing := array_length(existing_tables, 1);
    total_missing := array_length(missing_tables, 1);
    
    RAISE NOTICE '✅ Tables existantes: % / %', total_existing, total_expected;
    RAISE NOTICE '❌ Tables manquantes: % / %', total_missing, total_expected;
    RAISE NOTICE '📈 Taux de complétude: %%', ROUND((total_existing::NUMERIC / total_expected::NUMERIC) * 100, 2);
    
    IF total_missing > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '⚠️  TABLES MANQUANTES';
        RAISE NOTICE '========================================';
        FOREACH table_name IN ARRAY missing_tables
        LOOP
            RAISE NOTICE '  - %', table_name;
        END LOOP;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '🎉 TOUTES LES TABLES SONT PRÉSENTES !';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- Requête supplémentaire pour lister toutes les tables existantes
SELECT 
    table_schema,
    table_name,
    CASE 
        WHEN table_schema = 'public' THEN '✅ Public'
        WHEN table_schema = 'auth' THEN '🔐 Auth'
        ELSE '📦 ' || table_schema
    END as schema_type
FROM information_schema.tables
WHERE table_schema IN ('public', 'auth')
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

