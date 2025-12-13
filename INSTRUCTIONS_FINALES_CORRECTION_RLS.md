# 🔧 INSTRUCTIONS FINALES - Correction des Politiques RLS

## ⚠️ PROBLÈME IDENTIFIÉ

Les erreurs persistent car :

1. ✅ Le bucket "attachments" existe
2. ✅ Le bucket est PUBLIC
3. ❌ **Les politiques RLS ne sont pas correctement configurées**

Le fichier est uploadé mais Supabase retourne une erreur JSON au lieu d'accepter le fichier.

---

## ✅ SOLUTION : Exécuter la Migration SQL de Correction

### ÉTAPE 1 : Ouvrir Supabase SQL Editor

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu gauche
4. Cliquez sur **New Query**

### ÉTAPE 2 : Exécuter la Migration

1. Ouvrez le fichier : `supabase/migrations/20250201_fix_rls_policies_attachments_final.sql`
2. **Copiez TOUT le contenu**
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou `Ctrl+Enter`)

### ÉTAPE 3 : Vérifier le Résultat

Vous devriez voir dans les logs :

```
✅ X politique(s) supprimée(s)
✅ CONFIGURATION COMPLÈTE ET CORRECTE !
```

---

## 🔍 VÉRIFICATION MANUELLE

### Dans Supabase Dashboard :

1. Allez dans **Storage** > **Buckets** > **"attachments"**
2. Cliquez sur **"Policies"** (devrait afficher "4")
3. Vérifiez que les 4 politiques existent :
   - ✅ **"Anyone can view attachments"**
     - Opération : **SELECT**
     - Rôles : **{public}** ← CRITIQUE : doit être `public`, pas `authenticated`
   - ✅ **"Authenticated users can upload attachments"**
     - Opération : **INSERT**
     - Rôles : **{authenticated}**
   - ✅ **"Users can update their own attachments"**
     - Opération : **UPDATE**
     - Rôles : **{authenticated}**
   - ✅ **"Users can delete their own attachments"**
     - Opération : **DELETE**
     - Rôles : **{authenticated}**

### ⚠️ POINT CRITIQUE

La politique **"Anyone can view attachments"** doit être pour **`public`** (pas `authenticated`).

Si elle est pour `authenticated`, les fichiers ne seront pas accessibles publiquement et Supabase retournera du JSON.

---

## 🚀 ACTIONS APRÈS LA MIGRATION

1. **Attendez 2-3 minutes** (propagation Supabase)
2. **Fermez complètement le navigateur** (ou l'onglet)
3. **Ouvrez à nouveau l'application**
4. **Reconnectez-vous** si nécessaire
5. **Testez l'upload d'une image**

---

## 📝 CORRECTIONS APPLIQUÉES DANS LE CODE

### 1. `useFileUpload.ts`

- ✅ **Toujours passer `contentType`** lors de l'upload (plus de détection automatique)
- ✅ **Détection améliorée des erreurs JSON** dans `uploadData`
- ✅ **Messages d'erreur plus clairs** pour les problèmes RLS

### 2. `checkStoragePermissions.ts`

- ✅ **Retry avec délai** pour gérer la propagation
- ✅ **Test d'upload direct** même si le bucket n'est pas trouvé dans la liste

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Vérification 1 : Les Politiques sont-elles Correctes ?

Dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies :

- Vérifiez que **"Anyone can view attachments"** est pour **`public`**
- Si elle est pour `authenticated`, c'est le problème

### Vérification 2 : Le Bucket est-il Vraiment Public ?

1. Allez dans **Storage** > **Buckets** > **"attachments"**
2. Vérifiez que **"Public bucket"** est **COCHÉ** ✅
3. Si ce n'est pas le cas, cochez-le et cliquez sur **Save**

### Vérification 3 : Y a-t-il des Conflits ?

Exécutez cette requête SQL pour voir toutes les politiques :

```sql
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname ILIKE '%attachment%' OR qual::text ILIKE '%attachment%')
ORDER BY policyname;
```

Vous devriez voir exactement **4 politiques** pour "attachments".

---

## ✅ RÉSULTAT ATTENDU

Après avoir exécuté la migration et rechargé l'application :

- ✅ Plus d'erreur "File uploaded as JSON instead of image"
- ✅ Upload de fichiers fonctionnel
- ✅ Affichage des images correct
- ✅ Système de messaging opérationnel

---

**Date**: 1 Février 2025
**Fichiers modifiés**:

- `src/hooks/useFileUpload.ts` (toujours passer contentType)
- `src/utils/checkStoragePermissions.ts` (retry et test direct)
- `supabase/migrations/20250201_fix_rls_policies_attachments_final.sql` (nouveau)


