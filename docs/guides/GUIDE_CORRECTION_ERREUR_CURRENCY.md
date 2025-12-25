# 🔧 Guide de Correction : Erreur "currency column does not exist"

## 📋 Problème

L'erreur `Could not find the 'currency' column of 'transactions' in the schema cache` apparaît lors de la tentative de création d'une transaction sur le marketplace.

## 🎯 Cause

La colonne `currency` (et potentiellement d'autres colonnes) n'existe pas dans la table `transactions` de votre base de données Supabase, ou le cache du schéma Supabase n'est pas à jour.

## ✅ Solution

### Étape 1: Exécuter la migration SQL

1. **Ouvrez votre Supabase Dashboard** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet Payhula

2. **Ouvrez le SQL Editor** :
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Copiez et exécutez le script SQL** :
   - Ouvrez le fichier `supabase/migrations/20250201_fix_transactions_currency_immediate.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)

4. **Vérifiez le résultat** :
   - Vous devriez voir des messages de succès : `✅ Colonne currency ajoutée avec succès`
   - Le script affichera aussi la liste des colonnes de la table `transactions`

### Étape 2: Rafraîchir le cache du schéma Supabase

1. **Dans le Supabase Dashboard** :
   - Allez dans **Settings** (icône d'engrenage en bas à gauche)
   - Cliquez sur **"API"** dans le menu de gauche
   - Faites défiler jusqu'à **"Schema Cache"**
   - Cliquez sur **"Refresh schema cache"** ou **"Regenerate types"**

   **OU**

2. **Via SQL** (alternative) :
   ```sql
   -- Forcer un refresh du cache (optionnel)
   NOTIFY pgrst, 'reload schema';
   ```

### Étape 3: Vérifier que les colonnes existent

Exécutez cette requête SQL pour vérifier :

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name IN ('currency', 'payment_provider', 'metadata', 'customer_email')
ORDER BY column_name;
```

Vous devriez voir les 4 colonnes listées ci-dessus.

### Étape 4: Tester à nouveau

1. **Videz le cache de votre navigateur** :
   - Appuyez sur `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
   - Ou utilisez une fenêtre de navigation privée

2. **Retournez sur le marketplace** :
   - Allez sur https://payhula.vercel.app/marketplace
   - Essayez d'acheter un produit
   - L'erreur devrait être résolue

## 🚨 Solution Rapide (Si vous êtes pressé)

Si vous voulez une solution rapide sans exécuter tout le script, exécutez simplement ces deux commandes SQL :

```sql
-- Ajouter la colonne currency
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';

-- Mettre à jour les valeurs NULL et rendre NOT NULL
UPDATE public.transactions 
SET currency = 'XOF' 
WHERE currency IS NULL;

ALTER TABLE public.transactions 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'XOF';

-- Ajouter les autres colonnes essentielles
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;
```

## 📝 Fichiers de Migration

Deux migrations ont été créées pour résoudre ce problème :

1. **`supabase/migrations/20250201_ensure_transactions_columns.sql`** :
   - Migration complète et idempotente
   - Ajoute toutes les colonnes nécessaires
   - Gère les cas où la table a déjà des données

2. **`supabase/migrations/20250201_fix_transactions_currency_immediate.sql`** :
   - Script SQL simple et direct
   - Idéal pour une correction rapide
   - Affiche des messages de confirmation

## 🔍 Vérification

Après avoir exécuté la migration, vous pouvez vérifier que tout fonctionne :

```sql
-- Vérifier que la colonne currency existe et a la bonne structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name = 'currency';

-- Résultat attendu:
-- column_name | data_type | is_nullable | column_default
-- currency    | text      | NO          | 'XOF'::text
```

## 🆘 Si l'erreur persiste

Si l'erreur persiste après avoir exécuté la migration :

1. **Vérifiez les logs Supabase** :
   - Allez dans **Logs** → **Postgres Logs**
   - Cherchez des erreurs liées à la table `transactions`

2. **Vérifiez les RLS Policies** :
   - Allez dans **Authentication** → **Policies**
   - Vérifiez que les policies pour `transactions` permettent l'insertion

3. **Vérifiez le cache du navigateur** :
   - Videz complètement le cache du navigateur
   - Ou utilisez une fenêtre de navigation privée

4. **Contactez le support** :
   - Si le problème persiste, contactez le support avec les détails de l'erreur

## 📚 Références

- [Documentation Supabase - Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Documentation Supabase - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation PostgreSQL - ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)






