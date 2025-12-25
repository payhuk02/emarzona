# 📋 GUIDE D'EXÉCUTION DES MIGRATIONS SQL

**Date** : 28 Janvier 2025  
**Objectif** : Exécuter les 3 migrations SQL dans Supabase Dashboard

---

## ⚠️ IMPORTANT

Ces migrations doivent être exécutées dans l'ordre suivant :

1. `20250128_staff_availability_settings.sql`
2. `20250128_resource_conflict_settings.sql`
3. `20250128_wizard_server_validation.sql`

---

## 📝 ÉTAPE 1 : Migration Staff Availability Settings

### Fichier : `supabase/migrations/20250128_staff_availability_settings.sql`

**Instructions** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Créer une nouvelle requête
3. Copier-coller le contenu du fichier
4. Exécuter la requête (Ctrl+Enter ou bouton "Run")

**Vérification** :
```sql
-- Vérifier que la table existe
SELECT * FROM staff_availability_settings LIMIT 1;

-- Vérifier les permissions
SELECT has_table_privilege('authenticated', 'staff_availability_settings', 'SELECT');
```

---

## 📝 ÉTAPE 2 : Migration Resource Conflict Settings

### Fichier : `supabase/migrations/20250128_resource_conflict_settings.sql`

**Instructions** :
1. Dans le même SQL Editor
2. Créer une nouvelle requête
3. Copier-coller le contenu du fichier
4. Exécuter la requête

**Vérification** :
```sql
-- Vérifier que la table existe
SELECT * FROM resource_conflict_settings LIMIT 1;

-- Vérifier les permissions
SELECT has_table_privilege('authenticated', 'resource_conflict_settings', 'SELECT');
```

---

## 📝 ÉTAPE 3 : Migration Wizard Server Validation

### Fichier : `supabase/migrations/20250128_wizard_server_validation.sql`

**Instructions** :
1. Dans le même SQL Editor
2. Créer une nouvelle requête
3. Copier-coller le contenu du fichier
4. Exécuter la requête

**Vérification** :
```sql
-- Vérifier que les fonctions existent
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'validate_product_slug',
  'validate_sku',
  'validate_digital_version',
  'validate_digital_product',
  'validate_physical_product',
  'validate_service'
);

-- Tester une fonction
SELECT validate_product_slug('test-slug', '00000000-0000-0000-0000-000000000000'::uuid, NULL);
```

---

## ✅ VÉRIFICATION FINALE

### Tester toutes les fonctions

```sql
-- 1. Test validate_product_slug
SELECT validate_product_slug('test-product', '00000000-0000-0000-0000-000000000000'::uuid, NULL);

-- 2. Test validate_sku
SELECT validate_sku('TEST-SKU-001', '00000000-0000-0000-0000-000000000000'::uuid, NULL);

-- 3. Test validate_digital_version
SELECT validate_digital_version('1.0.0', '00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid);

-- 4. Test validate_digital_product
SELECT validate_digital_product(
  'Test Product',
  'test-product',
  99.99,
  '00000000-0000-0000-0000-000000000000'::uuid,
  NULL
);

-- 5. Test validate_physical_product
SELECT validate_physical_product(
  'Test Product',
  'test-product',
  99.99,
  'TEST-SKU',
  1.5,
  10,
  '00000000-0000-0000-0000-000000000000'::uuid,
  NULL
);

-- 6. Test validate_service
SELECT validate_service(
  'Test Service',
  'test-service',
  99.99,
  60,
  5,
  'https://meet.google.com/test',
  '00000000-0000-0000-0000-000000000000'::uuid,
  NULL
);
```

---

## 🚨 EN CAS D'ERREUR

### Erreur : "relation already exists"
- **Solution** : La table/fonction existe déjà. Vérifier si elle est correcte ou la supprimer avant de réexécuter.

### Erreur : "permission denied"
- **Solution** : Vérifier que vous êtes connecté avec un compte ayant les permissions nécessaires.

### Erreur : "column does not exist"
- **Solution** : Vérifier que les tables référencées existent (`products`, `digital_products`, `physical_products`, `services`, `stores`).

---

## 📊 RÉSULTAT ATTENDU

Après exécution réussie :

- ✅ Table `staff_availability_settings` créée avec RLS
- ✅ Table `resource_conflict_settings` créée avec RLS
- ✅ 6 fonctions RPC créées :
  - `validate_product_slug`
  - `validate_sku`
  - `validate_digital_version`
  - `validate_digital_product`
  - `validate_physical_product`
  - `validate_service`
- ✅ Permissions `GRANT EXECUTE` configurées

---

**Date** : 28 Janvier 2025  
**Statut** : ⚠️ **À EXÉCUTER MANUELLEMENT DANS SUPABASE DASHBOARD**

