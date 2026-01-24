# 🗄️ Structure de la Base de Données - Emarzona

**Date** : 2026-01-18  
**Version** : 1.0.0

---

## 📋 Vue d'Ensemble

Emarzona utilise **Supabase (PostgreSQL)** comme base de données principale. Cette documentation décrit la structure des tables principales organisées par domaine fonctionnel.

---

## 🏗️ Architecture Générale

### Schéma Principal : `public`

Toutes les tables sont dans le schéma `public` avec **Row Level Security (RLS)** activé.

### Nombre de Tables

- **520+ migrations SQL** dans `supabase/migrations/`
- **Tables principales** : ~100+ tables organisées par domaine

---

## 📦 Domaines Fonctionnels

### 1. 🛍️ E-commerce Core

#### Tables Produits

- `products` - Produits génériques (base pour tous types)
- `digital_products` - Produits digitaux
- `physical_products` - Produits physiques
- `services` - Services (réservations, consultations)
- `online_courses` - Cours en ligne (LMS)
- `artist_products` - Œuvres d'artistes

#### Tables Commandes

- `orders` - Commandes principales
- `order_items` - Items de commande
- `order_status_history` - Historique des statuts
- `order_messages` - Messages liés aux commandes

#### Tables Panier

- `cart_items` - Items du panier
- `abandoned_carts` - Paniers abandonnés

---

### 2. 👥 Utilisateurs & Authentification

- `users` - Utilisateurs (via Supabase Auth)
- `user_profiles` - Profils utilisateurs étendus
- `user_preferences` - Préférences utilisateurs
- `user_sessions` - Sessions utilisateurs
- `user_activity_logs` - Logs d'activité

---

### 3. 🏪 Stores & Multi-tenant

- `stores` - Boutiques des vendeurs
- `store_members` - Membres d'équipe des stores
- `store_tasks` - Tâches des stores
- `store_settings` - Paramètres des stores
- `store_analytics` - Analytics des stores

---

### 4. 💳 Paiements

- `payments` - Transactions de paiement
- `payment_methods` - Méthodes de paiement
- `payment_refunds` - Remboursements
- `payment_disputes` - Litiges
- `withdrawals` - Retraits des vendeurs
- `store_withdrawals` - Demandes de retrait

---

### 5. 📦 Produits Digitaux

- `digital_products` - Produits digitaux
- `digital_product_files` - Fichiers des produits
- `digital_licenses` - Licences
- `digital_downloads` - Téléchargements
- `digital_licenses_history` - Historique des licences
- `digital_product_analytics` - Analytics par produit
- `digital_bundles` - Bundles de produits digitaux

---

### 6. 🚚 Produits Physiques

- `physical_products` - Produits physiques
- `physical_product_variants` - Variantes (taille, couleur, etc.)
- `inventory_items` - Stock
- `inventory_movements` - Mouvements de stock
- `suppliers` - Fournisseurs
- `warehouses` - Entrepôts
- `product_lots` - Lots de produits
- `serial_numbers` - Numéros de série
- `pre_orders` - Précommandes
- `backorders` - Commandes en attente

---

### 7. 💼 Services

- `services` - Services
- `service_bookings` - Réservations
- `service_availability` - Disponibilités
- `service_staff` - Personnel assigné
- `recurring_bookings` - Réservations récurrentes
- `service_waitlist` - Listes d'attente

---

### 8. 🎓 Cours en Ligne (LMS)

- `online_courses` - Cours
- `course_modules` - Modules de cours
- `course_lessons` - Leçons
- `course_enrollments` - Inscriptions
- `course_progress` - Progression
- `course_reviews` - Avis sur les cours
- `course_quizzes` - Quiz
- `quiz_questions` - Questions de quiz
- `quiz_attempts` - Tentatives de quiz
- `course_certificates` - Certificats
- `course_instructors` - Instructeurs
- `course_cohorts` - Cohortes

---

### 9. 🤝 Affiliation

- `affiliates` - Affiliés
- `affiliate_links` - Liens d'affiliation
- `affiliate_commissions` - Commissions
- `affiliate_withdrawals` - Retraits des affiliés
- `affiliate_short_links` - Liens courts d'affiliation
- `affiliate_short_link_clicks` - Clics sur les liens courts

---

### 10. ⭐ Reviews & Ratings

- `reviews` - Avis produits
- `review_votes` - Votes sur les avis
- `review_reports` - Signalements d'avis

---

### 11. 📧 Email & Marketing

- `email_campaigns` - Campagnes email
- `email_sequences` - Séquences email
- `email_segments` - Segments d'audience
- `email_templates` - Templates email
- `email_workflows` - Workflows email
- `email_tags` - Tags email

---

### 12. 🎁 Promotions & Coupons

- `promotions` - Promotions
- `coupons` - Coupons
- `gift_cards` - Cartes cadeaux
- `loyalty_profiles` - Profils de fidélité
- `loyalty_transactions` - Transactions de fidélité

---

### 13. 📊 Analytics & Tracking

- `product_analytics` - Analytics produits
- `store_analytics` - Analytics stores
- `pixels` - Pixels de tracking (GA, FB, TikTok)
- `analytics_events` - Événements analytics

---

### 14. 🔔 Notifications

- `notifications` - Notifications
- `notification_preferences` - Préférences de notification
- `notification_templates` - Templates de notification

---

### 15. 🚢 Shipping

- `shipping_addresses` - Adresses de livraison
- `shipping_services` - Services de livraison
- `shipping_rates` - Tarifs de livraison
- `shipping_labels` - Étiquettes de livraison
- `shipping_tracking` - Suivi des colis

---

### 16. 🔄 Returns & Warranty

- `returns` - Retours
- `return_items` - Items retournés
- `warranty_claims` - Réclamations de garantie

---

### 17. 🔗 Webhooks

- `webhooks` - Webhooks
- `webhook_deliveries` - Livraisons de webhooks

---

### 18. 👨‍💼 Administration

- `admin_users` - Utilisateurs admin
- `admin_actions` - Actions admin
- `admin_config` - Configuration admin
- `platform_settings` - Paramètres de la plateforme
- `platform_roles` - Rôles de la plateforme

---

## 🔒 Sécurité (RLS)

### Patterns RLS Implémentés

1. **Pattern 1 : User ID**
   - L'utilisateur ne peut accéder qu'à ses propres données
   - Exemple : `user_profiles`, `user_preferences`

2. **Pattern 2 : Store ID**
   - L'utilisateur peut accéder aux données de ses stores
   - Exemple : `stores`, `store_products`

3. **Pattern 3 : Public**
   - Données publiques accessibles à tous
   - Exemple : `products` (en lecture), `reviews`

4. **Pattern 4 : Admin Only**
   - Seuls les admins peuvent accéder
   - Exemple : `admin_config`, `platform_settings`

### Migrations RLS

Les migrations RLS sont organisées dans :
- `supabase/migrations/rls_execution/`
- Scripts de vérification : `AUDIT_RLS_*.sql`

---

## 📈 Indexes & Performance

### Indexes Principaux

- **Primary Keys** : Toutes les tables ont des PK
- **Foreign Keys** : Relations bien définies
- **Indexes sur colonnes fréquemment requêtées** :
  - `user_id`, `store_id`, `product_id`
  - `created_at`, `updated_at`
  - `status`, `type`

### Vues Matérialisées

- `dashboard_recent_orders` - Commandes récentes
- `dashboard_product_stats` - Statistiques produits
- `dashboard_store_stats` - Statistiques stores

---

## 🔄 Relations Principales

### Relations Produits

```
products (base)
├── digital_products
├── physical_products
├── services
├── online_courses
└── artist_products
```

### Relations Commandes

```
orders
├── order_items
│   ├── digital_products
│   ├── physical_products
│   ├── services
│   └── online_courses
├── payments
├── shipping_addresses
└── order_messages
```

### Relations Stores

```
stores
├── store_members
├── store_products
├── store_analytics
├── store_withdrawals
└── store_settings
```

---

## 📝 Conventions de Nommage

### Tables

- **Snake_case** : `user_profiles`, `order_items`
- **Pluriel** : `products`, `orders`, `users`
- **Préfixes par domaine** : `digital_*`, `physical_*`, `course_*`

### Colonnes

- **Snake_case** : `user_id`, `created_at`, `updated_at`
- **Timestamps standards** : `created_at`, `updated_at`, `deleted_at`
- **Foreign keys** : `{table}_id` (ex: `store_id`, `product_id`)

---

## 🔍 Requêtes Utiles

### Lister toutes les tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Vérifier les politiques RLS

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Compter les tables

```sql
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 📚 Documentation Supplémentaire

- [Migrations SQL](./supabase/migrations/)
- [Scripts RLS](./supabase/migrations/rls_execution/)
- [Tests de validation](./supabase/tests/)

---

## 🎯 Prochaines Étapes

1. **Générer un diagramme ER** avec `dbdiagram.io`
2. **Documenter les relations complexes**
3. **Créer des vues pour les requêtes fréquentes**
4. **Optimiser les indexes selon les requêtes réelles**

---

**Dernière mise à jour** : 2026-01-18  
**Maintenu par** : Équipe Emarzona
