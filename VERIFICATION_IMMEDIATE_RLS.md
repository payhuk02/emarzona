# 🔍 VÉRIFICATION IMMÉDIATE - Politiques RLS

## ⚠️ IMPORTANT

Le script que vous avez exécuté ne retourne pas de lignes. Vous devez exécuter le script de **vérification** qui contient des `SELECT`.

---

## ✅ EXÉCUTER LE BON SCRIPT

### ÉTAPE 1 : Ouvrir le Script de Vérification

1. Dans Supabase SQL Editor, ouvrez le fichier :
   **`supabase/migrations/20250201_verify_rls_policies_exact.sql`**

### ÉTAPE 2 : Vérifier le Contenu

Le script doit commencer par un `SELECT`, pas par `DO $$`.

Il doit contenir :

```sql
SELECT
  policyname as "Nom de la politique",
  cmd as "Opération",
  roles::text as "Rôles (CRITIQUE)",
  ...
```

### ÉTAPE 3 : Exécuter

1. **Copiez TOUT le contenu** du fichier
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run**

### ÉTAPE 4 : Vérifier les Résultats

**Vous devriez voir un TABLEAU avec des lignes**, pas "No rows returned".

Le tableau doit avoir ces colonnes :

- **Nom de la politique**
- **Opération** (SELECT, INSERT, etc.)
- **Rôles (CRITIQUE)** ← **C'EST LA COLONNE IMPORTANTE**

---

## 🔍 CE QU'IL FAUT VÉRIFIER

Dans le tableau des résultats, trouvez la ligne pour :

- **Nom de la politique** : "Anyone can view attachments"
- **Opération** : "SELECT"
- **Rôles (CRITIQUE)** : **DOIT être `{public}`**

Si c'est `{authenticated}` au lieu de `{public}`, c'est le problème !

---

## 🔧 SI VOUS NE VOYEZ PAS DE RÉSULTATS

Si vous voyez toujours "No rows returned", cela signifie :

1. Soit le script n'a pas été exécuté correctement
2. Soit il n'y a **aucune politique** pour "attachments"

Dans ce cas, exécutez ce script simple pour vérifier :

```sql
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%attachment%';
```

Si ce script ne retourne rien, il n'y a **aucune politique** et vous devez les créer.

---

## 📋 ALTERNATIVE : Vérification dans Supabase Dashboard

Si les scripts SQL ne fonctionnent pas, vérifiez manuellement :

1. Allez dans **Storage** > **Buckets** > **"attachments"**
2. Cliquez sur **"Policies"** (devrait afficher un nombre, ex: "4")
3. Cliquez sur **"Anyone can view attachments"**
4. Regardez la section **"Roles"**
5. **DOIT être** : `public`
6. **NE DOIT PAS être** : `authenticated`

Si c'est `authenticated`, cliquez sur **"Edit"** et changez-le en `public`.

---

**Date**: 1 Février 2025


