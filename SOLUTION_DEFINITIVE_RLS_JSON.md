# 🔧 SOLUTION DÉFINITIVE - Fichiers Uploadés comme JSON

## 🔴 PROBLÈME IDENTIFIÉ

Les fichiers sont uploadés mais enregistrés comme **`application/json`** au lieu d'images. Cela signifie que :

1. ✅ L'upload **réussit** (pas d'erreur `uploadError`)
2. ✅ Le bucket existe et est PUBLIC
3. ✅ Les politiques RLS semblent correctes
4. ❌ **MAIS** Supabase retourne une réponse JSON d'erreur qui est enregistrée comme le fichier

**Cause racine** : Les politiques RLS bloquent l'accès au fichier après l'upload, et Supabase retourne une erreur JSON qui est enregistrée comme le contenu du fichier.

---

## ✅ SOLUTION : Exécuter le Script de Diagnostic et Correction

### ÉTAPE 1 : Ouvrir Supabase SQL Editor

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor**
4. Cliquez sur **New Query**

### ÉTAPE 2 : Exécuter le Script de Diagnostic

1. Ouvrez le fichier : `supabase/migrations/20250201_diagnose_and_fix_rls_attachments.sql`
2. **Copiez TOUT le contenu**
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run** (ou `Ctrl+Enter`)

Ce script va :

- ✅ Diagnostiquer tous les problèmes
- ✅ Supprimer les anciennes politiques
- ✅ Recréer les 4 politiques correctement
- ✅ S'assurer que le bucket est PUBLIC
- ✅ Supprimer les restrictions MIME

### ÉTAPE 3 : Vérifier le Résultat

Vous devriez voir dans les logs :

```
✅ CONFIGURATION COMPLÈTE ET CORRECTE !
```

---

## 🔍 VÉRIFICATION MANUELLE CRITIQUE

### 1. Vérifier la Politique SELECT

Dans Supabase Dashboard > Storage > Buckets > "attachments" > **Policies** :

- ✅ **"Anyone can view attachments"**
  - Opération : **SELECT**
  - **Rôles : `{public}`** ← **CRITIQUE : doit être `public`, PAS `authenticated`**

Si cette politique est pour `authenticated` au lieu de `public`, c'est le problème !

### 2. Vérifier que le Bucket est PUBLIC

1. Allez dans **Storage** > **Buckets** > **"attachments"**
2. Vérifiez que **"Public bucket"** est **COCHÉ** ✅
3. Si ce n'est pas le cas, cochez-le et cliquez sur **Save**

### 3. Vérifier les 4 Politiques

Vous devriez avoir exactement **4 politiques** :

1. ✅ "Anyone can view attachments" (SELECT) - `{public}`
2. ✅ "Authenticated users can upload attachments" (INSERT) - `{authenticated}`
3. ✅ "Users can update their own attachments" (UPDATE) - `{authenticated}`
4. ✅ "Users can delete their own attachments" (DELETE) - `{authenticated}`

---

## 🚀 ACTIONS APRÈS LA CORRECTION

1. **Attendez 2-3 minutes** (propagation Supabase)
2. **Fermez complètement le navigateur** (pas juste l'onglet)
3. **Ouvrez à nouveau l'application**
4. **Reconnectez-vous** si nécessaire
5. **Testez l'upload d'une image**

---

## 📝 CORRECTIONS APPLIQUÉES DANS LE CODE

### 1. `useFileUpload.ts`

- ✅ **Vérification de l'URL publique AVANT les métadonnées**
- ✅ **Détection améliorée des fichiers JSON**
- ✅ **Toujours passer `contentType` lors de l'upload**

### 2. Messages d'erreur améliorés

- ✅ Messages plus clairs
- ✅ Instructions précises pour résoudre les problèmes

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Vérification 1 : La Politique SELECT est-elle pour `public` ?

Exécutez cette requête SQL :

```sql
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'Anyone can view attachments';
```

**Résultat attendu** :

- `policyname`: "Anyone can view attachments"
- `cmd`: "SELECT"
- `roles`: `{public}` ← **DOIT être `public`, pas `authenticated`**

### Vérification 2 : Y a-t-il des Conflits ?

Exécutez cette requête pour voir toutes les politiques :

```sql
SELECT
  policyname,
  cmd,
  roles::text,
  qual::text as "USING",
  with_check::text as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname ILIKE '%attachment%' OR qual::text ILIKE '%attachment%')
ORDER BY cmd, policyname;
```

Vous devriez voir exactement **4 politiques** pour "attachments".

### Vérification 3 : Le Bucket est-il Vraiment Public ?

Exécutez cette requête :

```sql
SELECT
  id,
  name,
  public,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'attachments';
```

**Résultat attendu** :

- `public`: `true` ← **DOIT être `true`**
- `allowed_mime_types`: `NULL` ← **DOIT être `NULL`**

---

## ✅ RÉSULTAT ATTENDU

Après avoir exécuté le script de diagnostic et rechargé l'application :

- ✅ Plus d'erreur "File uploaded as JSON instead of image"
- ✅ Upload de fichiers fonctionnel
- ✅ Affichage des images correct
- ✅ Système de messaging opérationnel

---

**Date**: 1 Février 2025
**Fichiers créés/modifiés**:

- `supabase/migrations/20250201_diagnose_and_fix_rls_attachments.sql` (nouveau)
- `src/hooks/useFileUpload.ts` (vérification URL publique améliorée)


