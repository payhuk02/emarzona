# Dépendances entre Migrations

**Date:** 1 Février 2025  
**Version:** 1.0

## 📋 Vue d'ensemble

Ce document décrit les dépendances entre les migrations SQL de la base de données. Les migrations doivent être exécutées dans un ordre spécifique pour garantir l'intégrité des données et des relations.

## 🔗 Structure des Dépendances

### Niveau 1 : Tables de Base (Fondations)

Ces tables doivent être créées en premier car elles sont référencées par de nombreuses autres tables.

#### 1.1. Tables d'Authentification

- **auth.users** (Supabase built-in)
- **public.profiles** → Dépend de `auth.users`
- **public.user_roles** → Dépend de `auth.users`

#### 1.2. Tables de Boutiques

- **public.stores** → Dépend de `auth.users` (user_id)
- **public.customers** → Dépend de `public.stores`

#### 1.3. Tables de Produits de Base

- **public.products** → Dépend de `public.stores`
- **public.product_variants** → Dépend de `public.products`
- **public.product_categories** → Table indépendante

### Niveau 2 : Tables de Commandes

#### 2.1. Commandes

- **public.orders** → Dépend de `public.stores`, `public.customers`
- **public.order_items** → Dépend de `public.orders`, `public.products`

#### 2.2. Paiements

- **public.payments** → Dépend de `public.orders`
- **public.transactions** → Dépend de `public.payments`, `public.orders`

### Niveau 3 : Tables Spécifiques par Type de Produit

#### 3.1. Produits Digitaux

**Ordre d'exécution :**

1. `20251027_digital_products_professional.sql`
   - `digital_products` → Dépend de `products`
   - `digital_product_files` → Dépend de `digital_products`
   - `digital_product_downloads` → Dépend de `digital_products`, `auth.users`
   - `digital_licenses` → Dépend de `digital_products`, `orders`
   - `digital_license_activations` → Dépend de `digital_licenses`

2. `20251029_digital_bundles_system.sql`
   - `digital_bundles` → Dépend de `digital_products`
   - `digital_bundle_items` → Dépend de `digital_bundles`, `digital_products`

3. `20250201_digital_product_versions.sql`
   - `digital_product_versions` → Dépend de `digital_products`, `products`
   - `digital_product_update_notifications` → Dépend de `digital_product_versions`, `auth.users`
   - `digital_product_version_downloads` → Dépend de `digital_product_versions`, `auth.users`

#### 3.2. Produits Physiques

**Ordre d'exécution :**

1. `20251028_physical_products_professional.sql`
   - `physical_products` → Dépend de `products`
   - `warehouses` → Table indépendante
   - `warehouse_inventory` → Dépend de `warehouses`, `physical_products`

2. `20250128_physical_products_serial_tracking.sql`
   - `serial_numbers` → Dépend de `physical_products`, `orders`
   - `serial_number_history` → Dépend de `serial_numbers`

3. `20250128_physical_products_lots_expiration.sql`
   - `product_lots` → Dépend de `physical_products`
   - `lot_movements` → Dépend de `product_lots`

4. `20250131_warranty_system.sql`
   - `product_warranties` → Dépend de `physical_products`, `orders`, `auth.users`
   - `warranty_claims` → Dépend de `product_warranties`
   - `warranty_history` → Dépend de `product_warranties`

5. `20250201_physical_product_advanced_images.sql`
   - `physical_product_images` → Dépend de `physical_products`, `products`

#### 3.3. Services

**Ordre d'exécution :**

1. `20251027_service_bookings_system.sql`
   - `service_products` → Dépend de `products`
   - `service_bookings` → Dépend de `service_products`, `customers`
   - `service_availability` → Dépend de `service_products`

2. `20250131_service_calendar_integrations.sql`
   - `service_calendar_integrations` → Dépend de `service_products`
   - `service_calendar_events` → Dépend de `service_calendar_integrations`
   - `service_calendar_sync_logs` → Dépend de `service_calendar_integrations`

3. `20250201_service_waitlist_system.sql`
   - `service_waitlist` → Dépend de `service_products`, `customers`

4. `20250201_service_booking_reminders.sql`
   - `service_booking_reminders` → Dépend de `service_bookings`
   - `service_reminder_templates` → Dépend de `service_products`

5. `20250201_service_packages.sql`
   - `service_packages` → Dépend de `service_products`, `products`, `stores`
   - `service_package_purchases` → Dépend de `service_packages`, `auth.users`, `orders`
   - `service_package_credits_usage` → Dépend de `service_package_purchases`, `service_bookings`

#### 3.4. Cours en Ligne

**Ordre d'exécution :**

1. `20251027_courses_system_complete.sql`
   - `courses` → Dépend de `products`
   - `course_sections` → Dépend de `courses`
   - `course_lessons` → Dépend de `course_sections`
   - `course_quizzes` → Dépend de `courses`
   - `course_enrollments` → Dépend de `courses`, `auth.users`
   - `course_lesson_progress` → Dépend de `course_enrollments`, `course_lessons`
   - `quiz_attempts` → Dépend de `course_quizzes`, `course_enrollments`
   - `course_certificates` → Dépend de `course_enrollments`

2. `20250127_course_cohorts.sql`
   - `course_cohorts` → Dépend de `courses`

3. `20250131_course_cohorts_advanced.sql` (ou `_fixed.sql`)
   - `cohort_enrollments` → Dépend de `course_cohorts`, `course_enrollments`
   - `cohort_analytics` → Dépend de `course_cohorts`
   - `cohort_progress_snapshots` → Dépend de `cohort_enrollments`

#### 3.5. Œuvres d'Artistes

**Ordre d'exécution :**

1. `20250128_artist_portfolios_galleries.sql`
   - `artist_portfolios` → Dépend de `stores`
   - `artist_galleries` → Dépend de `artist_portfolios`
   - `artist_gallery_artworks` → Dépend de `artist_galleries`, `products`

2. `20250128_artist_product_certificates.sql`
   - `artist_product_certificates` → Dépend de `artist_products`, `orders`

3. `20250131_artist_auctions_system.sql`
   - `artist_product_auctions` → Dépend de `artist_products`
   - `auction_bids` → Dépend de `artist_product_auctions`, `auth.users`
   - `auction_watchlist` → Dépend de `artist_product_auctions`, `auth.users`

4. `20250201_artist_3d_gallery_provenance.sql`
   - `artist_3d_models` → Dépend de `artist_products`
   - `artwork_provenance` → Dépend de `artist_products`
   - `artwork_certificates` → Dépend de `artist_products`

5. `20250201_artist_dedications.sql`
   - `artist_product_dedications` → Dépend de `artist_products`, `products`, `orders`
   - `artist_dedication_templates` → Dépend de `artist_products`, `stores`

### Niveau 4 : Tables Transversales

#### 4.1. Marketing et Promotions

- **public.promotions** → Dépend de `products`, `stores`
- **public.collections** → Dépend de `stores`
- **public.collection_products** → Dépend de `collections`, `products`

#### 4.2. Analytics

- **public.product_analytics** → Dépend de `products`
- **public.analytics_events** → Dépend de `products`, `auth.users`

#### 4.3. Email et Notifications

- **public.email_templates** → Table indépendante
- **public.email_campaigns** → Dépend de `stores`
- **public.email_logs** → Dépend de `email_campaigns`

#### 4.4. Webhooks

- **public.webhooks** → Dépend de `stores`
- **public.webhook_deliveries** → Dépend de `webhooks`

#### 4.5. Loyalty Program

- **public.loyalty_tiers** → Dépend de `stores`
- **public.loyalty_points** → Dépend de `loyalty_tiers`, `auth.users`
- **public.loyalty_rewards** → Dépend de `stores`
- **public.loyalty_transactions** → Dépend de `loyalty_points`
- **public.loyalty_reward_redemptions** → Dépend de `loyalty_rewards`, `loyalty_points`

## ⚠️ Migrations de Correction

Ces migrations corrigent des problèmes dans les migrations précédentes et doivent être exécutées après les migrations qu'elles corrigent.

### Corrections RLS

- `20250130_rls_critical_tables_phase1.sql` → Après création des tables de base
- `20250130_rls_products_marketing_phase2.sql` → Après création des tables de produits
- `20250130_rls_affiliates_courses_products_phase3.sql` → Après création des tables de cours
- `20250130_rls_phase4a_critical_tables.sql` → Après toutes les tables critiques
- `20250130_rls_phase4b_remaining_tables.sql` → Après toutes les tables restantes
- `20250130_rls_phase4c_complete_policies.sql` → Finalisation des politiques RLS

### Corrections owner_id → user_id

- `20250201_fix_emailing_owner_id_to_user_id.sql` → Après les migrations email
- `20250131_fix_warranty_user_id_final_v2.sql` → Après `20250131_warranty_system.sql`
- `20250131_fix_warranty_user_id_final.sql` → Alternative à la version v2
- `20250131_fix_warranty_user_id_complete.sql` → Version complète

### Corrections de Colonnes

- `20250131_fix_calendar_integrations_service_id.sql` → Après `20250131_service_calendar_integrations.sql`
- `20250131_fix_all_migration_errors.sql` → Corrections générales
- `20250131_fix_final_all_errors.sql` → Corrections finales

## 📊 Ordre d'Exécution Recommandé

### Phase 1 : Fondations

1. Tables d'authentification (Supabase built-in)
2. `20250122_fix_profiles_table.sql`
3. Tables de stores et customers
4. Tables de products de base

### Phase 2 : Commandes et Paiements

1. Tables orders et order_items
2. Tables payments et transactions

### Phase 3 : Produits Spécifiques (peuvent être exécutés en parallèle)

1. Produits digitaux (toutes les migrations)
2. Produits physiques (toutes les migrations)
3. Services (toutes les migrations)
4. Cours (toutes les migrations)
5. Artistes (toutes les migrations)

### Phase 4 : Tables Transversales

1. Marketing et promotions
2. Analytics
3. Email et notifications
4. Webhooks
5. Loyalty program

### Phase 5 : Corrections et Optimisations

1. Corrections RLS
2. Corrections owner_id → user_id
3. Corrections de colonnes
4. `20250201_add_missing_indexes.sql` (index manquants)

## 🔍 Vérification des Dépendances

Pour vérifier qu'une migration peut être exécutée, vérifier que :

1. Toutes les tables référencées dans les `REFERENCES` existent
2. Toutes les colonnes référencées dans les `JOIN` existent
3. Toutes les fonctions référencées existent
4. Toutes les politiques RLS nécessaires sont en place

## 📝 Notes Importantes

1. **Colonnes générées** : Les colonnes `GENERATED ALWAYS AS` ne peuvent pas être ajoutées avec `ALTER TABLE`. Elles doivent être créées lors de la création de la table.

2. **Politiques RLS** : Certaines migrations créent des politiques RLS qui peuvent entrer en conflit. Utiliser `DROP POLICY IF EXISTS` avant `CREATE POLICY`.

3. **Triggers** : Utiliser `DROP TRIGGER IF EXISTS` avant `CREATE TRIGGER` pour éviter les erreurs de duplication.

4. **Index** : Les index peuvent être créés à tout moment, mais il est recommandé de les créer après la création des tables et le chargement des données initiales.

5. **Compatibilité** : Certaines migrations anciennes gèrent à la fois `owner_id` et `user_id` pour compatibilité. Les migrations récentes utilisent uniquement `user_id`.

## 🚀 Script d'Exécution Automatique

Un script pourrait être créé pour exécuter les migrations dans le bon ordre, mais cela dépasse le cadre de ce document. Supabase gère automatiquement l'ordre d'exécution basé sur les noms de fichiers (ordre lexicographique).
