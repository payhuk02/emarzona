# 📋 MIGRATIONS SQL PRÊTES À EXÉCUTER

**Date** : 28 Janvier 2025  
**Statut** : ✅ **Fichiers vérifiés et prêts**

---

## ⚠️ IMPORTANT : ORDRE D'EXÉCUTION

Les migrations doivent être exécutées dans cet ordre :

1. ✅ `20250128_staff_availability_settings.sql`
2. ✅ `20250128_resource_conflict_settings.sql`
3. ✅ `20250128_wizard_server_validation.sql`

---

## 📝 INSTRUCTIONS D'EXÉCUTION

### Étape 1 : Accéder à Supabase Dashboard

1. Ouvrir : https://app.supabase.com
2. Sélectionner votre projet **Payhuk**
3. Aller dans **SQL Editor** (menu de gauche)
4. Cliquer sur **"New query"**

### Étape 2 : Exécuter Migration 1

**Fichier** : `supabase/migrations/20250128_staff_availability_settings.sql`

1. Ouvrir le fichier dans votre éditeur
2. **Copier tout le contenu**
3. **Coller dans Supabase SQL Editor**
4. Cliquer sur **"Run"** (ou `Ctrl+Enter`)
5. Vérifier qu'il n'y a pas d'erreur

**Résultat attendu** :
```
Success. No rows returned
```

### Étape 3 : Exécuter Migration 2

**Fichier** : `supabase/migrations/20250128_resource_conflict_settings.sql`

1. Créer une **nouvelle requête** dans SQL Editor
2. Ouvrir le fichier dans votre éditeur
3. **Copier tout le contenu**
4. **Coller dans Supabase SQL Editor**
5. Cliquer sur **"Run"**
6. Vérifier qu'il n'y a pas d'erreur

**Résultat attendu** :
```
Success. No rows returned
```

### Étape 4 : Exécuter Migration 3

**Fichier** : `supabase/migrations/20250128_wizard_server_validation.sql`

1. Créer une **nouvelle requête** dans SQL Editor
2. Ouvrir le fichier dans votre éditeur
3. **Copier tout le contenu**
4. **Coller dans Supabase SQL Editor**
5. Cliquer sur **"Run"**
6. Vérifier qu'il n'y a pas d'erreur

**Résultat attendu** :
```
Success. No rows returned
```

---

## ✅ VÉRIFICATION POST-MIGRATION

### Test 1 : Vérifier les Tables

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('staff_availability_settings', 'resource_conflict_settings');
```

**Résultat attendu** : 2 lignes retournées

### Test 2 : Vérifier les Fonctions

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
)
ORDER BY routine_name;
```

**Résultat attendu** : 6 lignes retournées (toutes de type `FUNCTION`)

### Test 3 : Tester les Fonctions

```sql
-- Test 1: validate_product_slug (doit retourner valid: true)
SELECT validate_product_slug(
  'test-product-123',
  '00000000-0000-0000-0000-000000000000'::uuid,
  NULL
);

-- Test 2: validate_sku (doit retourner valid: true)
SELECT validate_sku(
  'TEST-SKU-001',
  '00000000-0000-0000-0000-000000000000'::uuid,
  NULL
);

-- Test 3: validate_digital_product (doit retourner valid: true)
SELECT validate_digital_product(
  'Test Product',
  'test-product',
  99.99,
  '00000000-0000-0000-0000-000000000000'::uuid,
  NULL
);
```

**Résultat attendu** : Tous retournent `{"valid": true}`

---

## 🚨 EN CAS D'ERREUR

### Erreur : "relation already exists"

**Cause** : La table/fonction existe déjà.

**Solution** :
```sql
-- Vérifier si la table existe
SELECT * FROM staff_availability_settings LIMIT 1;

-- Si elle existe et est correcte, passer à la migration suivante
-- Si elle existe mais est incorrecte, la supprimer d'abord :
-- DROP TABLE IF EXISTS staff_availability_settings CASCADE;
```

### Erreur : "permission denied"

**Cause** : Permissions insuffisantes.

**Solution** : Vérifier que vous êtes connecté avec un compte ayant les permissions `postgres` ou `service_role`.

### Erreur : "column does not exist"

**Cause** : Table référencée n'existe pas.

**Solution** : Vérifier que les tables suivantes existent :
- `products`
- `digital_products`
- `physical_products`
- `services`
- `stores`
- `service_products`

### Erreur : "function does not exist"

**Cause** : Fonction appelée n'existe pas encore.

**Solution** : Vérifier l'ordre d'exécution. `validate_product_slug` doit être créée avant `validate_digital_product`, `validate_physical_product`, et `validate_service`.

---

## 📊 RÉSULTAT FINAL ATTENDU

Après exécution réussie des 3 migrations :

### Tables Créées (2)
- ✅ `staff_availability_settings` avec RLS activé
- ✅ `resource_conflict_settings` avec RLS activé

### Fonctions Créées (6)
- ✅ `validate_product_slug`
- ✅ `validate_sku`
- ✅ `validate_digital_version`
- ✅ `validate_digital_product`
- ✅ `validate_physical_product`
- ✅ `validate_service`

### Permissions Configurées
- ✅ `GRANT EXECUTE` sur toutes les fonctions pour `authenticated`

---

## 🎯 PROCHAINES ÉTAPES

Après exécution réussie :

1. ✅ Tester la validation serveur dans les wizards
2. ✅ Tester le dashboard updates digitales
3. ✅ Tester le calendrier staff
4. ✅ Tester la gestion conflits ressources

---

**Date** : 28 Janvier 2025  
**Statut** : ⚠️ **À EXÉCUTER MANUELLEMENT DANS SUPABASE DASHBOARD**

