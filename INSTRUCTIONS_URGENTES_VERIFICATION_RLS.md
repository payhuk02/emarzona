# 🚨 INSTRUCTIONS URGENTES - Vérification des Politiques RLS

## 🔴 PROBLÈME CRITIQUE

L'URL publique retourne du **JSON au lieu de l'image**. Cela signifie que les politiques RLS bloquent toujours l'accès au fichier.

**Même après avoir exécuté le script SQL, le problème persiste.**

---

## ✅ SOLUTION : Vérifier EXACTEMENT les Politiques

### ÉTAPE 1 : Exécuter le Script de Vérification

1. Ouvrez Supabase Dashboard > SQL Editor
2. Ouvrez le fichier : `supabase/migrations/20250201_verify_rls_policies_exact.sql`
3. **Copiez TOUT le contenu**
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run**

Ce script va afficher :

- ✅ Toutes les politiques pour "attachments"
- ✅ Les **rôles exacts** de chaque politique
- ✅ Si la politique SELECT est pour `public` ou `authenticated`

### ÉTAPE 2 : Vérifier les Résultats

**Regardez attentivement la colonne "Rôles (CRITIQUE)"** dans les résultats.

Pour la politique **"Anyone can view attachments"** (SELECT) :

- ✅ **DOIT être** : `{public}`
- ❌ **NE DOIT PAS être** : `{authenticated}`

Si c'est `{authenticated}`, c'est le problème !

---

## 🔧 CORRECTION MANUELLE SI NÉCESSAIRE

Si la politique SELECT est pour `authenticated` au lieu de `public` :

### 1. Supprimer la Politique Incorrecte

Exécutez dans Supabase SQL Editor :

```sql
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
```

### 2. Créer la Politique Correcte

```sql
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');
```

**IMPORTANT** : Notez `TO public` (pas `TO authenticated`) !

### 3. Vérifier

Exécutez à nouveau le script de vérification pour confirmer que c'est maintenant `{public}`.

---

## 🔍 VÉRIFICATION DANS SUPABASE DASHBOARD

1. Allez dans **Storage** > **Buckets** > **"attachments"**
2. Cliquez sur **"Policies"**
3. Cliquez sur **"Anyone can view attachments"**
4. Vérifiez que **"Roles"** contient **`public`** (pas `authenticated`)

Si ce n'est pas le cas :

- Cliquez sur **"Edit"**
- Changez **"Roles"** de `authenticated` à `public`
- Cliquez sur **"Save"**

---

## 📋 CHECKLIST COMPLÈTE

- [ ] Script de vérification exécuté
- [ ] Politique SELECT vérifiée : rôles = `{public}`
- [ ] Si incorrect, politique supprimée et recréée
- [ ] Vérification dans Supabase Dashboard effectuée
- [ ] Attendu 2-3 minutes (propagation)
- [ ] Application rechargée (F5)
- [ ] Test d'upload effectué

---

## ✅ RÉSULTAT ATTENDU

Après correction :

- ✅ La politique SELECT est pour `{public}`
- ✅ L'URL publique retourne l'image (pas du JSON)
- ✅ Upload de fichiers fonctionnel
- ✅ Affichage des images correct

---

**Date**: 1 Février 2025
**Fichier créé**: `supabase/migrations/20250201_verify_rls_policies_exact.sql`
