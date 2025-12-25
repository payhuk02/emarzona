# 🧪 GUIDE DE TEST - MIGRATIONS SERVICE

## Améliorations Phase 1, 2 et 3

**Date**: 1 Février 2025  
**Objectif**: Tester toutes les migrations et améliorations du système Service

---

## 📋 MIGRATIONS À TESTER

### 1. Migration RLS Policies

**Fichier**: `supabase/migrations/20250201_fix_service_bookings_rls_policies.sql`

**Objectif**: Consolider les RLS policies dupliquées

---

### 2. Migration Indexes Composites

**Fichier**: `supabase/migrations/20250201_add_service_indexes_composites.sql`

**Objectif**: Améliorer les performances avec 10 nouveaux indexes

---

### 3. Migration Fonctions de Validation

**Fichier**: `supabase/migrations/20250201_add_service_validation_functions.sql`

**Objectif**: Fonctions SQL pour validation côté serveur

---

## 🚀 EXÉCUTION DES TESTS

### Option 1: Via Supabase Dashboard (Recommandé)

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Exécutez les migrations dans l'ordre :

#### Étape 1: Migration RLS Policies

```sql
-- Copier le contenu de: 20250201_fix_service_bookings_rls_policies.sql
-- Coller et exécuter
```

#### Étape 2: Migration Indexes

```sql
-- Copier le contenu de: 20250201_add_service_indexes_composites.sql
-- Coller et exécuter
```

#### Étape 3: Migration Fonctions Validation

```sql
-- Copier le contenu de: 20250201_add_service_validation_functions.sql
-- Coller et exécuter
```

#### Étape 4: Script de Test

```sql
-- Copier le contenu de: TEST_20250201_service_improvements.sql
-- Coller et exécuter
```

---

### Option 2: Via CLI Supabase

```powershell
# Se connecter
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Exécuter les migrations
supabase db push
```

---

## ✅ VÉRIFICATION

### Test 1: Vérifier RLS Policies

Exécutez dans SQL Editor:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'service_bookings'
ORDER BY policyname;
```

**Résultat attendu**: 4 policies (select, insert, update, delete)

---

### Test 2: Vérifier Indexes

Exécutez dans SQL Editor:

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_service%'
ORDER BY tablename, indexname;
```

**Résultat attendu**: 10+ indexes

---

### Test 3: Vérifier Fonctions SQL

Exécutez dans SQL Editor:

```sql
SELECT proname, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN (
    'check_booking_conflicts',
    'check_max_bookings_per_day',
    'check_advance_booking_days'
  );
```

**Résultat attendu**: 3 fonctions présentes

---

### Test 4: Tester Fonction check_booking_conflicts

```sql
-- Tester avec un service existant
SELECT * FROM public.check_booking_conflicts(
  p_product_id := 'YOUR_PRODUCT_ID'::UUID,
  p_scheduled_date := CURRENT_DATE + INTERVAL '7 days',
  p_scheduled_start_time := '10:00:00'::TIME,
  p_scheduled_end_time := '11:00:00'::TIME,
  p_staff_member_id := NULL,
  p_exclude_booking_id := NULL
);
```

**Résultat attendu**: Table avec `has_conflict`, `conflict_type`, `conflict_message`

---

### Test 5: Tester Fonction check_max_bookings_per_day

```sql
SELECT * FROM public.check_max_bookings_per_day(
  p_product_id := 'YOUR_PRODUCT_ID'::UUID,
  p_scheduled_date := CURRENT_DATE + INTERVAL '7 days',
  p_exclude_booking_id := NULL
);
```

**Résultat attendu**: Table avec `is_within_limit`, `current_count`, `max_allowed`, `message`

---

### Test 6: Tester Fonction check_advance_booking_days

```sql
SELECT * FROM public.check_advance_booking_days(
  p_product_id := 'YOUR_PRODUCT_ID'::UUID,
  p_scheduled_date := CURRENT_DATE + INTERVAL '7 days'
);
```

**Résultat attendu**: Table avec `is_valid`, `days_difference`, `max_days_allowed`, `message`

---

## 🎯 TESTS FONCTIONNELS

### Test 1: Créer une réservation avec validations

1. Via l'interface, tenter de réserver un service
2. Vérifier que les messages d'erreur sont clairs :
   - Limite quotidienne atteinte
   - Date trop loin dans le futur
   - Conflit avec autre réservation
   - Buffer_time insuffisant

---

### Test 2: Performance

1. Exécuter une requête de disponibilité
2. Vérifier que les indexes sont utilisés (EXPLAIN ANALYZE)
3. Temps d'exécution devrait être < 100ms

---

## 📊 RÉSULTATS ATTENDUS

Après exécution du script de test (`TEST_20250201_service_improvements.sql`), vous devriez voir :

```
=== TEST 1: Vérification RLS Policies ===
✅ Policy présente: service_bookings_delete_policy
✅ Policy présente: service_bookings_insert_policy
✅ Policy présente: service_bookings_select_policy
✅ Policy présente: service_bookings_update_policy
✅ Toutes les RLS policies sont présentes

=== TEST 2: Vérification Indexes Composites ===
✅ Index présent: idx_service_availability_day_active
✅ Index présent: idx_service_availability_service_day
✅ Index présent: idx_service_availability_staff_day
✅ Index présent: idx_service_bookings_date_status
✅ Index présent: idx_service_bookings_product_date_status
✅ Index présent: idx_service_bookings_product_staff
✅ Index présent: idx_service_bookings_staff_date
✅ Index présent: idx_service_bookings_user_date
✅ Index présent: idx_service_staff_active
✅ Index présent: idx_service_staff_store_active
✅ Tous les indexes composites sont présents

... (autres tests)
```

---

## ⚠️ DÉPANNAGE

### Erreur: "Policy already exists"

- Normal, les DROP POLICY IF EXISTS devraient gérer cela
- Si problème persiste, supprimer manuellement la policy

### Erreur: "Index already exists"

- Normal, CREATE INDEX IF NOT EXISTS devrait gérer cela
- Si problème persiste, vérifier l'index existe déjà

### Erreur: "Function already exists"

- Normal, CREATE OR REPLACE FUNCTION devrait gérer cela
- Si problème persiste, supprimer la fonction et recréer

---

## ✅ VALIDATION FINALE

Si tous les tests passent :

- ✅ RLS Policies consolidées
- ✅ Indexes composites créés
- ✅ Fonctions de validation disponibles
- ✅ Système prêt pour production

---

_Guide créé le 1 Février 2025_

