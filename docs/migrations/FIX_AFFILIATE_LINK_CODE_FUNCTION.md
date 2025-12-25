# 🔧 Correction de la fonction generate_affiliate_link_code

**Date** : 31/01/2025  
**Problème** : La fonction `generate_affiliate_link_code` échoue avec l'erreur :
```
function digest(text, unknown) does not exist
```

**Cause** : L'extension PostgreSQL `pgcrypto` n'est pas activée, ce qui est nécessaire pour utiliser la fonction `digest()`.

---

## ✅ Solution

Une migration a été créée pour :
1. Activer l'extension `pgcrypto`
2. Corriger la fonction `generate_affiliate_link_code` pour utiliser correctement `digest()`

---

## 🚀 Instructions d'exécution

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **"New query"**
5. Copiez-collez le contenu du fichier :
   ```
   supabase/migrations/20250131_fix_affiliate_link_code_function.sql
   ```
6. Cliquez sur **"Run"** (ou `Ctrl+Enter`)

### Option 2 : Via Supabase CLI

```bash
# Si vous utilisez Supabase CLI
supabase db push
```

---

## 📋 Vérification

Après l'exécution de la migration, vérifiez que :

1. **L'extension est activée** :
```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

2. **La fonction existe et fonctionne** :
```sql
SELECT public.generate_affiliate_link_code('TEST123', 'test-product');
-- Devrait retourner un code de 12 caractères en majuscules
```

---

## ⚠️ Notes importantes

- Cette migration est **idempotente** (peut être exécutée plusieurs fois sans problème)
- L'extension `pgcrypto` est standard dans PostgreSQL et ne pose pas de problème de sécurité
- La fonction génère des codes uniques de 12 caractères basés sur un hash SHA256

---

## 🔍 Dépannage

Si vous rencontrez des erreurs :

1. **Erreur "permission denied"** :
   - Assurez-vous d'être connecté en tant qu'administrateur du projet Supabase
   - Vérifiez que vous avez les droits pour créer des extensions

2. **Erreur "extension already exists"** :
   - C'est normal, la migration utilise `CREATE EXTENSION IF NOT EXISTS`
   - Vous pouvez ignorer cette erreur

3. **Erreur "function already exists"** :
   - C'est normal, la migration utilise `CREATE OR REPLACE FUNCTION`
   - La fonction sera mise à jour avec la version corrigée

---

## ✅ Après la migration

Une fois la migration exécutée avec succès :

1. Testez la création d'un lien d'affiliation depuis l'interface
2. Vérifiez que le code généré est bien un code de 12 caractères
3. Vérifiez que les liens d'affiliation peuvent être créés sans erreur

