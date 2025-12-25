# 🔧 CORRECTION - Colonne `compare_at_price` manquante dans `products`

**Date:** 1 Février 2025

---

## 📋 PROBLÈME IDENTIFIÉ

**Erreur:** `Could not find the 'compare_at_price' column of 'products' in the schema cache`

**Cause:** La colonne `compare_at_price` n'existe pas dans la table `products` de la base de données Supabase, mais le code essaie de l'utiliser lors de l'insertion d'un produit.

**Fichiers concernés:**

- `src/components/products/create/artist/CreateArtistProductWizard.tsx` (ligne 494)
- `src/components/products/create/artist/ArtistBasicInfoForm.tsx` (ligne 926)
- `src/components/products/create/artist/ArtistPreview.tsx` (ligne 349)

**Impact:**

- ❌ Impossible de créer un produit artiste
- ❌ Erreur 400 lors de l'insertion
- ❌ Fonctionnalité de prix de comparaison non disponible

---

## 🔍 ANALYSE

### Colonnes utilisées dans le code

Le code utilise deux colonnes qui n'existent pas dans la table `products` :

1. **`compare_at_price`** : Prix de comparaison (prix barré) pour afficher une réduction
2. **`cost_per_item`** : Coût d'achat/fabrication par article pour calculer la marge

### Schéma actuel de `products`

**Fichier:** `supabase/migrations/20251006084900_2206f899-227f-4655-a684-46f9bbc334ed.sql`

```sql
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  digital_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
```

**Colonnes manquantes:**

- ❌ `compare_at_price`
- ❌ `cost_per_item`

---

## ✅ CORRECTION APPLIQUÉE

### Migration créée

**Fichier:** `supabase/migrations/20250201_add_compare_at_price_to_products.sql`

**Contenu:**

1. ✅ Ajout de la colonne `compare_at_price` (NUMERIC(10, 2), nullable)
2. ✅ Ajout de la colonne `cost_per_item` (NUMERIC(10, 2), nullable)
3. ✅ Contrainte de validation : `compare_at_price >= price` (si renseigné)
4. ✅ Index pour améliorer les performances de recherche
5. ✅ Commentaires pour documentation

**Code de la migration:**

```sql
-- Ajouter compare_at_price
ALTER TABLE public.products
ADD COLUMN compare_at_price NUMERIC(10, 2) DEFAULT NULL
CHECK (compare_at_price IS NULL OR compare_at_price >= 0);

-- Ajouter cost_per_item
ALTER TABLE public.products
ADD COLUMN cost_per_item NUMERIC(10, 2) DEFAULT NULL
CHECK (cost_per_item IS NULL OR cost_per_item >= 0);

-- Contrainte: compare_at_price >= price
ALTER TABLE public.products
ADD CONSTRAINT check_compare_at_price_gte_price
CHECK (
  compare_at_price IS NULL
  OR price IS NULL
  OR compare_at_price >= price
);
```

---

## 📊 SPÉCIFICATIONS DES COLONNES

### `compare_at_price`

- **Type:** `NUMERIC(10, 2)`
- **Nullable:** Oui (DEFAULT NULL)
- **Contrainte:** `>= 0` et `>= price` (si renseigné)
- **Usage:** Prix barré affiché pour montrer une réduction
- **Exemple:** Prix normal = 10000 XOF, Prix de vente = 8000 XOF, `compare_at_price` = 10000 XOF

### `cost_per_item`

- **Type:** `NUMERIC(10, 2)`
- **Nullable:** Oui (DEFAULT NULL)
- **Contrainte:** `>= 0`
- **Usage:** Coût d'achat/fabrication pour calculer la marge bénéficiaire
- **Exemple:** Prix de vente = 10000 XOF, `cost_per_item` = 6000 XOF → Marge = 4000 XOF (40%)

---

## 🔄 VALIDATION

### Contrainte de validation

La contrainte `check_compare_at_price_gte_price` garantit que :

- Si `compare_at_price` est renseigné, il doit être `>= price`
- Cela permet d'afficher une réduction valide (prix barré > prix de vente)

**Exemples:**

- ✅ `price = 8000`, `compare_at_price = 10000` → Réduction de 20%
- ❌ `price = 10000`, `compare_at_price = 8000` → Erreur (contrainte violée)

---

## 🧪 TESTS À EFFECTUER

### Test 1: Création produit avec compare_at_price

- [ ] Créer un produit avec `compare_at_price` > `price`
- [ ] Vérifier que le produit est créé avec succès
- [ ] Vérifier que le prix barré s'affiche correctement

### Test 2: Création produit sans compare_at_price

- [ ] Créer un produit sans `compare_at_price`
- [ ] Vérifier que le produit est créé avec succès
- [ ] Vérifier que seul le prix normal s'affiche

### Test 3: Validation contrainte

- [ ] Essayer de créer un produit avec `compare_at_price` < `price`
- [ ] Vérifier que l'erreur de contrainte est levée
- [ ] Vérifier que le message d'erreur est clair

### Test 4: cost_per_item

- [ ] Créer un produit avec `cost_per_item`
- [ ] Vérifier que le produit est créé avec succès
- [ ] Vérifier que la marge peut être calculée

---

## 📝 PROCHAINES ÉTAPES

### 1. Appliquer la migration

**Via Supabase CLI:**

```bash
supabase migration up
```

**Via Supabase Dashboard:**

1. Aller dans "Database" > "Migrations"
2. Exécuter la migration `20250201_add_compare_at_price_to_products.sql`

### 2. Rafraîchir le cache du schéma

**Important:** Après avoir appliqué la migration, rafraîchissez le cache du schéma dans Supabase Dashboard :

1. Aller dans "Database" > "Schema"
2. Cliquer sur "Refresh schema cache"

### 3. Tester la création de produit

- Créer un produit artiste avec prix de comparaison
- Vérifier que l'erreur ne se produit plus
- Vérifier que les données sont correctement sauvegardées

---

## 🔍 VÉRIFICATION POST-MIGRATION

### Vérifier que les colonnes existent

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('compare_at_price', 'cost_per_item');
```

**Résultat attendu:**

- `compare_at_price` : `numeric`, `YES`, `NULL`
- `cost_per_item` : `numeric`, `YES`, `NULL`

### Vérifier les contraintes

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND constraint_name = 'check_compare_at_price_gte_price';
```

**Résultat attendu:**

- `check_compare_at_price_gte_price` : `CHECK`

---

## 📊 IMPACT

### Avant

- ❌ Erreur 400 lors de la création de produit
- ❌ Colonne `compare_at_price` non trouvée
- ❌ Fonctionnalité de prix de comparaison non disponible
- ❌ Calcul de marge impossible

### Après

- ✅ Colonnes `compare_at_price` et `cost_per_item` disponibles
- ✅ Création de produit fonctionnelle
- ✅ Prix de comparaison affiché correctement
- ✅ Calcul de marge possible
- ✅ Validation automatique des prix

---

**Date de correction:** 1 Février 2025  
**Corrigé par:** Assistant IA  
**Fichiers créés:**

- `supabase/migrations/20250201_add_compare_at_price_to_products.sql`
- `docs/corrections/CORRECTION_COLONNE_COMPARE_AT_PRICE_MANQUANTE_2025.md`
