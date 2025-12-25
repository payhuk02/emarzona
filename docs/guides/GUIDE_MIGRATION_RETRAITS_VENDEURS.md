# 📋 GUIDE : Migration SQL - Système de Retraits Vendeurs

## ⚠️ IMPORTANT

Pour que le système de retraits fonctionne, vous devez **exécuter la migration SQL** dans votre base de données Supabase.

## 📍 Fichiers de migration

**Migration principale :** `supabase/migrations/20250131_store_withdrawals_system.sql`  
**Correction (si erreur NULL) :** `supabase/migrations/20250131_fix_store_earnings_null_constraint.sql`

## 🚀 Étapes pour exécuter la migration

### Option 1 : Via l'interface Supabase (Recommandé)

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [https://supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Copiez le contenu de la migration**
   - Ouvrez le fichier `supabase/migrations/20250131_store_withdrawals_system.sql`
   - Copiez tout le contenu

4. **Exécutez la migration**
   - Collez le contenu dans l'éditeur SQL
   - Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

5. **Si vous rencontrez l'erreur "null value in column available_balance"**
   - Exécutez également la migration de correction : `supabase/migrations/20250131_fix_store_earnings_null_constraint.sql`
   - Cette migration corrige la fonction pour éviter les valeurs NULL

6. **Vérifiez le résultat**
   - Vous devriez voir un message de succès
   - Les tables `store_earnings` et `store_withdrawals` doivent être créées

### Option 2 : Via la CLI Supabase

```bash
# Si vous utilisez Supabase CLI localement
supabase db push

# Ou pour exécuter une migration spécifique
supabase migration up
```

## ✅ Vérification

Après avoir exécuté la migration, vérifiez que :

1. **Les tables existent :**
   ```sql
   SELECT * FROM store_earnings LIMIT 1;
   SELECT * FROM store_withdrawals LIMIT 1;
   ```

2. **Les fonctions existent :**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'calculate_store_earnings';
   SELECT proname FROM pg_proc WHERE proname = 'update_store_earnings';
   ```

3. **Les triggers existent :**
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname LIKE '%store_earnings%';
   ```

## 🔧 En cas d'erreur

### Erreur : "relation already exists"
- Les tables existent déjà, c'est normal si vous avez déjà exécuté la migration
- La migration utilise `CREATE TABLE IF NOT EXISTS`, donc elle est idempotente

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté avec un compte administrateur
- Vérifiez les permissions RLS (Row Level Security)

### Erreur : "function does not exist"
- Assurez-vous d'avoir exécuté toute la migration, pas seulement une partie
- Vérifiez que les fonctions sont créées dans le bon schéma (`public`)

### Erreur : "null value in column available_balance"
- **Solution :** Exécutez la migration de correction `20250131_fix_store_earnings_null_constraint.sql`
- Cette erreur se produit si la fonction `update_store_earnings` n'a pas été corrigée pour gérer les valeurs NULL

## 📊 Tables créées

### `store_earnings`
- Stocke les revenus totaux, retraits et solde disponible par store
- Mis à jour automatiquement via des triggers

### `store_withdrawals`
- Stocke toutes les demandes de retrait des vendeurs
- Gère les statuts : pending, processing, completed, failed, cancelled

## 🔄 Après la migration

1. **Rechargez la page** `/dashboard/withdrawals`
2. L'erreur devrait disparaître
3. Le système calculera automatiquement les revenus à partir des commandes existantes

## 📝 Notes importantes

- La migration est **idempotente** : vous pouvez l'exécuter plusieurs fois sans problème
- Les revenus sont calculés automatiquement à partir des commandes avec statut `completed` et `payment_status = 'paid'`
- La commission plateforme par défaut est de **10%** (configurable dans `store_earnings.platform_commission_rate`)
- Le montant minimum de retrait est de **10 000 XOF**

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les logs Supabase dans la section "Logs"
3. Consultez le fichier `ANALYSE_SYSTEME_RETRAIT_VENDEURS.md` pour plus de détails

