# 🔧 Guide : Corriger l'erreur 403 sur les paiements

## ❌ Problème actuel
L'erreur `403 (Forbidden)` apparaît lors de la récupération des paiements car la politique RLS (Row Level Security) de Supabase ne vérifie pas correctement les permissions.

## ✅ Solution : Exécuter le script SQL

### Étape 1 : Ouvrir Supabase Dashboard
1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Copier le script
Ouvrez le fichier `supabase/quick_fix_payments_rls.sql` et copiez tout son contenu.

### Étape 3 : Coller et exécuter
1. Collez le script dans l'éditeur SQL
2. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)

### Étape 4 : Vérifier
Le script affichera les informations de la politique créée. Vous devriez voir une ligne avec `policyname = 'payments_select_policy'`.

## 📋 Contenu du script (pour référence)

```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "payments_select_policy" ON payments;

-- Créer la nouvelle politique avec vérification store_id prioritaire
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    -- PRIORITÉ 1: Vérification directe par store_id (le plus efficace)
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR
    -- PRIORITÉ 2: Admins peuvent tout voir
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- PRIORITÉ 3: Vérification via customer_id (pour les clients)
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- PRIORITÉ 4: Vérification via order_id (pour compatibilité)
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
  );
```

## ✅ Après exécution
1. Rechargez la page "Paiements & Clients" dans votre application
2. L'erreur 403 devrait disparaître
3. Les paiements devraient s'afficher correctement

## 🔍 Vérification alternative
Si vous voulez vérifier manuellement que la politique existe :

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'payments' AND policyname = 'payments_select_policy';
```

## ⚠️ Note importante
Cette correction est temporaire jusqu'à ce que la migration `20250210_fix_payments_rls_store_id.sql` soit appliquée via votre processus de déploiement normal.

