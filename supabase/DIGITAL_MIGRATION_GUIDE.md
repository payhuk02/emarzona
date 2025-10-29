# 📚 GUIDE D'EXÉCUTION DES MIGRATIONS - DIGITAL PRODUCTS

## 🎯 Objectif

Ce guide vous accompagne dans l'exécution des migrations SQL pour compléter le système de **Produits Digitaux** de Payhula.

---

## 📦 Migrations Disponibles

### ✅ Migrations Existantes (Déjà exécutées)

1. **`20251027_digital_products_professional.sql`**
   - Tables de base pour produits digitaux
   - System de fichiers
   - Tracking des téléchargements
   - Gestion des licenses (basique)
   - Gestion des mises à jour

2. **`20251029_digital_license_management_system.sql`**
   - Système de licenses professionnel
   - Activations multi-devices
   - Audit trail des licenses
   - Fonctions de validation

3. **`20251029_product_versioning_system.sql`**
   - Versioning sémantique
   - Changelog
   - Logs de téléchargement par version

4. **`20251029_download_protection_system.sql`**
   - Tokens de téléchargement sécurisés
   - Protection par IP
   - Logs d'accès
   - Analytics de téléchargement

### 🆕 Nouvelles Migrations (À exécuter maintenant)

5. **`20251029_digital_bundles_system.sql`** ⭐ NOUVEAU
   - Tables pour bundles de produits
   - Pricing et remises automatiques
   - Gestion des items de bundle

6. **`20251029_digital_products_enhancements.sql`** ⭐ NOUVEAU
   - Indexes de performance
   - Vues pour dashboards
   - Fonctions utilitaires
   - Triggers automatiques

---

## 🚀 ÉTAPES D'EXÉCUTION

### Option A: Via Supabase Dashboard (Recommandé)

#### Étape 1: Accéder à SQL Editor

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **Payhula**
3. Allez dans **SQL Editor** (menu de gauche)

#### Étape 2: Exécuter les migrations dans l'ordre

**Migration 1: Digital Bundles System**

```sql
-- Copier-coller le contenu complet de:
-- supabase/migrations/20251029_digital_bundles_system.sql
```

1. Cliquez sur **"New query"**
2. Collez le contenu du fichier `20251029_digital_bundles_system.sql`
3. Cliquez sur **"Run"** (ou `Ctrl+Enter`)
4. ✅ Vérifiez que tout s'exécute sans erreur

**Migration 2: Digital Products Enhancements**

```sql
-- Copier-coller le contenu complet de:
-- supabase/migrations/20251029_digital_products_enhancements.sql
```

1. Nouvelle query
2. Collez le contenu du fichier `20251029_digital_products_enhancements.sql`
3. Cliquez sur **"Run"**
4. ✅ Vérifiez que tout s'exécute sans erreur

---

### Option B: Via Supabase CLI

```bash
# 1. Assurez-vous que Supabase CLI est installé
supabase --version

# 2. Lier votre projet
supabase link --project-ref your-project-ref

# 3. Pousser les migrations
supabase db push

# OU exécuter manuellement chaque migration
supabase db execute -f supabase/migrations/20251029_digital_bundles_system.sql
supabase db execute -f supabase/migrations/20251029_digital_products_enhancements.sql
```

---

### Option C: Via psql (Avancé)

```bash
# 1. Connexion à la base de données
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 2. Exécuter les migrations
\i supabase/migrations/20251029_digital_bundles_system.sql
\i supabase/migrations/20251029_digital_products_enhancements.sql

# 3. Quitter
\q
```

---

## ✅ VALIDATION DES MIGRATIONS

### 1. Vérifier les tables créées

```sql
-- Vérifier que toutes les tables Digital sont présentes
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'digital_%'
ORDER BY tablename;
```

**Résultat attendu:**
- `digital_bundles`
- `digital_bundle_items`
- `digital_licenses` (existant)
- `digital_license_activations` (existant)
- `digital_product_downloads` (existant)
- `digital_product_files` (existant)
- `digital_product_licenses` (existant)
- `digital_product_updates` (existant)
- `digital_products` (existant)

### 2. Vérifier les fonctions créées

```sql
-- Lister les fonctions digital
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%digital%' OR proname LIKE '%bundle%' OR proname LIKE '%license%'
ORDER BY proname;
```

**Fonctions attendues:**
- `calculate_bundle_original_price`
- `expire_digital_licenses`
- `generate_bundle_slug`
- `generate_license_key`
- `get_download_analytics`
- `get_remaining_downloads`
- `has_digital_access`
- `update_bundle_pricing`
- `update_digital_product_stats`
- `validate_license`

### 3. Vérifier les vues créées

```sql
-- Lister les vues
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%digital%'
ORDER BY viewname;
```

**Vues attendues:**
- `active_digital_licenses`
- `digital_bundles_with_stats`
- `digital_products_stats`
- `recent_digital_downloads`

### 4. Vérifier les RLS policies

```sql
-- Vérifier les policies sur digital_bundles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('digital_bundles', 'digital_bundle_items')
ORDER BY tablename, policyname;
```

### 5. Test d'intégrité complet

Créez un fichier de test et exécutez-le :

```sql
-- Copier-coller le contenu de:
-- supabase/DIGITAL_VALIDATION_TESTS.sql
```

---

## 🧪 TESTS DE VALIDATION

### Test 1: Créer un bundle test

```sql
-- Créer un bundle de test
INSERT INTO public.digital_bundles (
  store_id,
  name,
  slug,
  description,
  status,
  discount_type,
  discount_value,
  original_price,
  bundle_price
) VALUES (
  (SELECT id FROM public.stores LIMIT 1), -- Remplacer par un store_id réel
  'Test Bundle',
  'test-bundle',
  'Bundle de test pour validation',
  'draft',
  'percentage',
  25.0,
  100.00,
  75.00
) RETURNING *;
```

### Test 2: Générer une clé de license

```sql
SELECT generate_license_key();
-- Devrait retourner: XXXX-XXXX-XXXX-XXXX
```

### Test 3: Calculer les stats

```sql
-- Tester la fonction de stats (remplacer UUID)
SELECT * FROM get_download_analytics(
  'uuid-of-digital-product',
  30
);
```

### Test 4: Vérifier l'accès

```sql
-- Tester has_digital_access
SELECT has_digital_access(
  'uuid-of-product',
  'customer@example.com'
);
```

---

## 🔧 TROUBLESHOOTING

### Erreur: "relation already exists"

**Solution:** La table existe déjà, c'est normal. La migration utilise `IF NOT EXISTS` pour éviter les doublons.

### Erreur: "must be owner of table"

**Solution:** Exécutez les migrations avec un utilisateur ayant les droits SUPERUSER (généralement le user `postgres`).

### Erreur: "column does not exist"

**Solution:** Vérifiez que les migrations précédentes ont bien été exécutées dans l'ordre.

### Rollback en cas d'erreur

```sql
-- Si une migration échoue, vous pouvez rollback
BEGIN;
-- Votre migration ici
ROLLBACK; -- Si erreur
-- OU
COMMIT; -- Si succès
```

---

## 📊 STATISTIQUES POST-MIGRATION

Après l'exécution, vérifiez les statistiques :

```sql
-- Nombre total de tables Digital
SELECT COUNT(*) as total_digital_tables
FROM pg_tables 
WHERE tablename LIKE 'digital_%';
-- Résultat attendu: 9

-- Nombre de fonctions
SELECT COUNT(*) as total_functions
FROM pg_proc
WHERE proname LIKE '%digital%' OR proname LIKE '%bundle%' OR proname LIKE '%license%';
-- Résultat attendu: 10+

-- Nombre de vues
SELECT COUNT(*) as total_views
FROM pg_views 
WHERE viewname LIKE '%digital%';
-- Résultat attendu: 4

-- Nombre de policies RLS
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename LIKE 'digital_%';
-- Résultat attendu: 15+
```

---

## 🎉 SUCCÈS !

Si tous les tests passent, félicitations ! 🎊

Votre système de **Produits Digitaux** est maintenant **100% opérationnel** avec :

✅ **9 tables** professionnelles  
✅ **10+ fonctions** utilitaires  
✅ **4 vues** optimisées  
✅ **15+ policies RLS** sécurisées  
✅ **Bundles system** complet  
✅ **Analytics** avancées  
✅ **License management** professionnel  

---

## 📞 SUPPORT

En cas de problème, vérifiez :

1. Les logs Supabase : Dashboard > Logs > Database
2. La documentation : [Supabase Docs](https://supabase.com/docs)
3. Ce guide : Relisez les étapes de troubleshooting

---

**Date:** 29 Octobre 2025  
**Version:** 1.0  
**Auteur:** Payhula Team  
**Projet:** Payhuk SaaS Platform

