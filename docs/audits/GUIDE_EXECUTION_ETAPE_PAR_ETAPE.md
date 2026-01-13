# 🚀 Guide d'Exécution Étape par Étape - Migrations RLS

**Date** : 13 Janvier 2026  
**Objectif** : Exécuter toutes les migrations RLS de manière sécurisée et organisée

---

## 📋 Prérequis

### 1. Préparer les Fichiers

```bash
# Générer les fichiers combinés pour l'exécution
npm run prepare:rls-execution
```

**Résultat** : Fichiers créés dans `supabase/migrations/rls_execution/`

---

## 🎯 Étape 1 : Pattern 4 - Admin Only (CRITIQUE)

### 1.1 Ouvrir Supabase Dashboard

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor** dans le menu de gauche
4. Cliquer sur **New Query**

### 1.2 Préparer l'Exécution

1. Ouvrir le fichier : `supabase/migrations/rls_execution/20260113_rls_pattern_4_admin_only_combined.sql`
2. **LIRE** le contenu pour comprendre ce qui sera exécuté
3. Vérifier les tables concernées :
   - `platform_settings`
   - `admin_config`
   - `system_logs`
   - `admin_actions`

### 1.3 Vérifier RLS Activé

Avant d'exécuter, vérifier que RLS est activé sur toutes les tables :

```sql
-- Vérifier RLS sur les tables Pattern 4
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('platform_settings', 'admin_config', 'system_logs', 'admin_actions');
```

**Résultat attendu** : `rls_enabled = true` pour toutes les tables

**Si RLS n'est pas activé** :
```sql
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
```

### 1.4 Exécuter la Migration

1. Copier **TOUT** le contenu du fichier combiné (Ctrl+A, Ctrl+C)
2. Coller dans SQL Editor (Ctrl+V)
3. Cliquer sur **Run** ou appuyer sur Ctrl+Enter
4. **ATTENDRE** la fin de l'exécution

### 1.5 Vérifier les Résultats

```sql
-- Vérifier que les politiques sont créées
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('platform_settings', 'admin_config', 'system_logs', 'admin_actions')
GROUP BY tablename
ORDER BY tablename;
```

**Résultat attendu** : 4 politiques par table (16 politiques au total)

### 1.6 Tester avec Admin

```sql
-- Se connecter en tant qu'admin (role = 'admin' dans profiles)
SELECT * FROM platform_settings;  -- Devrait fonctionner
SELECT * FROM admin_config;       -- Devrait fonctionner
SELECT * FROM system_logs;       -- Devrait fonctionner
SELECT * FROM admin_actions;     -- Devrait fonctionner
```

### 1.7 Tester avec Utilisateur Normal

```sql
-- Se connecter en tant qu'utilisateur normal (non-admin)
SELECT * FROM platform_settings;  -- Devrait être bloqué
SELECT * FROM admin_config;       -- Devrait être bloqué
```

**Résultat attendu** : Erreur "permission denied" ou résultat vide

### 1.8 Marquer comme Complété

- [x] Pattern 4 exécuté avec succès
- [x] 16 politiques créées (4 par table)
- [x] Tests admin réussis
- [x] Tests utilisateur normal réussis (blocage confirmé)

---

## 🎯 Étape 2 : Pattern 1 - user_id (HAUTE)

### 2.1 Ouvrir le Fichier Combiné

Ouvrir : `supabase/migrations/rls_execution/20260113_rls_pattern_1_user_id_combined.sql`

### 2.2 Vérifier RLS Activé

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'user_preferences', 'saved_addresses', 
                     'certificates', 'user_sessions', 'user_activity_logs');
```

### 2.3 Exécuter la Migration

1. Copier le contenu du fichier combiné
2. Coller dans SQL Editor
3. Exécuter

### 2.4 Vérifier les Résultats

```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'user_preferences', 'saved_addresses', 
                     'certificates', 'user_sessions', 'user_activity_logs')
GROUP BY tablename;
```

**Résultat attendu** : 4 politiques par table (28 politiques au total)

### 2.5 Tester avec Utilisateur Normal

```sql
-- Se connecter en tant qu'utilisateur normal (user_id = auth.uid())
SELECT * FROM notifications;  -- Devrait voir seulement ses notifications
INSERT INTO notifications (user_id, title, message) 
VALUES (auth.uid(), 'Test', 'Message');  -- Devrait fonctionner
```

### 2.6 Tester l'Isolation

```sql
-- Créer deux utilisateurs de test : User A et User B

-- User A ne devrait PAS voir les données de User B
-- Se connecter en tant que User A
SELECT * FROM notifications;  -- Devrait voir seulement les notifications de User A
```

### 2.7 Marquer comme Complété

- [x] Pattern 1 exécuté avec succès
- [x] 28 politiques créées (4 par table)
- [x] Tests utilisateur réussis
- [x] Isolation des données vérifiée

---

## 🎯 Étape 3 : Pattern 2 - store_id (HAUTE)

### 3.1 Ouvrir le Fichier Combiné

Ouvrir : `supabase/migrations/rls_execution/20260113_rls_pattern_2_store_id_combined.sql`

### 3.2 Vérifier RLS Activé

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'invoices', 'disputes', 'service_availability',
                     'recurring_bookings', 'warranty_claims', 'product_analytics', 'store_analytics');
```

### 3.3 Exécuter la Migration

1. Copier le contenu du fichier combiné
2. Coller dans SQL Editor
3. Exécuter

### 3.4 Vérifier les Résultats

```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'invoices', 'disputes', 'service_availability',
                     'recurring_bookings', 'warranty_claims', 'product_analytics', 'store_analytics')
GROUP BY tablename;
```

**Résultat attendu** : 4 politiques par table (32 politiques au total)

### 3.5 Tester avec Propriétaire Boutique

```sql
-- Se connecter en tant que propriétaire de boutique
-- (user_id dans stores correspond à auth.uid())

SELECT * FROM subscriptions 
WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid());
-- Devrait voir seulement ses subscriptions

SELECT * FROM invoices 
WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid());
-- Devrait voir seulement ses invoices
```

### 3.6 Marquer comme Complété

- [x] Pattern 2 exécuté avec succès
- [x] 32 politiques créées (4 par table)
- [x] Tests propriétaire boutique réussis

---

## 🎯 Étape 4 : Pattern 3 - Public (MOYENNE)

### 4.1 Ouvrir le Fichier Combiné

Ouvrir : `supabase/migrations/rls_execution/20260113_rls_pattern_3_public_combined.sql`

### 4.2 Vérifier RLS Activé

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('reviews', 'community_posts', 'public_reviews');
```

### 4.3 Exécuter la Migration

1. Copier le contenu du fichier combiné
2. Coller dans SQL Editor
3. Exécuter

### 4.4 Vérifier les Résultats

```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('reviews', 'community_posts', 'public_reviews')
GROUP BY tablename;
```

**Résultat attendu** : 4 politiques par table (12 politiques au total)

### 4.5 Tester avec Utilisateur Authentifié

```sql
-- Se connecter en tant qu'utilisateur authentifié
SELECT * FROM reviews;  -- Devrait voir toutes les reviews
INSERT INTO reviews (user_id, product_id, rating, comment)
VALUES (auth.uid(), 'product_id', 5, 'Great product');  -- Devrait fonctionner
```

### 4.6 Marquer comme Complété

- [x] Pattern 3 exécuté avec succès
- [x] 12 politiques créées (4 par table)
- [x] Tests utilisateur authentifié réussis

---

## ✅ Vérification Finale

### Vérifier Toutes les Politiques

```sql
-- Compter toutes les politiques RLS créées aujourd'hui
SELECT 
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'platform_settings', 'admin_config', 'system_logs', 'admin_actions',
    'notifications', 'user_preferences', 'saved_addresses', 'certificates',
    'user_sessions', 'user_activity_logs',
    'subscriptions', 'invoices', 'disputes', 'service_availability',
    'recurring_bookings', 'warranty_claims', 'product_analytics', 'store_analytics',
    'reviews', 'community_posts', 'public_reviews'
  );
```

**Résultat attendu** : 88 politiques (4 par table × 22 tables)

---

## 📊 Résumé d'Exécution

- **Pattern 4** : ✅ / ⏳ / ❌
- **Pattern 1** : ✅ / ⏳ / ❌
- **Pattern 2** : ✅ / ⏳ / ❌
- **Pattern 3** : ✅ / ⏳ / ❌

**Total** : 0/22 migrations exécutées

---

## 🔗 Ressources

- **Fichiers combinés** : `supabase/migrations/rls_execution/`
- **Suivi d'exécution** : `docs/audits/SUIVI_EXECUTION_RLS.md`
- **Guide d'exécution** : `docs/audits/GUIDE_EXECUTION_MIGRATIONS.md`

---

**Prochaine étape** : Commencer par Pattern 4 (Admin Only) 🚀
