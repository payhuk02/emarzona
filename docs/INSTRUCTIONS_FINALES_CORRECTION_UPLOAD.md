# 🚨 Instructions Finales : Correction Upload JSON

**Date** : 1 Février 2025  
**Problème** : Fichiers uploadés comme JSON au lieu d'images

---

## ⚠️ PROBLÈME IDENTIFIÉ

Le fichier est **toujours uploadé comme JSON** malgré toutes les corrections. Cela signifie que **les politiques RLS bloquent toujours l'upload**.

---

## ✅ SOLUTION EN 3 ÉTAPES (ORDRE IMPORTANT)

### ÉTAPE 1 : Vérifier le Bucket Public (CRITIQUE)

1. **Supabase Dashboard** > **Storage** > **Buckets**
2. Cliquer sur **"attachments"**
3. **Vérifier visuellement** que **"Public bucket"** est activé (toggle ON)
4. Si ce n'est pas activé :
   - **Activer** le toggle
   - **Sauvegarder** (cliquer sur "Save" ou "Update")
   - **Attendre 30 secondes**

### ÉTAPE 2 : Exécuter les Migrations SQL (DANS L'ORDRE)

#### Migration 1 : Configuration Complète

1. **Supabase Dashboard** > **SQL Editor**
2. Ouvrir : `supabase/migrations/20250201_fix_attachments_final_complete.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL
5. Cliquer sur **"Run"**
6. **Lire le rapport** affiché

#### Migration 2 : Supprimer Restrictions MIME

1. **Supabase Dashboard** > **SQL Editor**
2. Ouvrir : `supabase/migrations/20250201_fix_attachments_mime_types.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL
5. Cliquer sur **"Run"**
6. **Lire le rapport** affiché

### ÉTAPE 3 : Vérifier et Tester

1. **Attendre 2-3 minutes** (délai de propagation Supabase)
2. **Recharger l'application** (F5)
3. **Vérifier que vous êtes connecté**
4. **Réessayer l'upload** d'un fichier image
5. **Surveiller les logs** dans la console

---

## 🔍 Vérification dans Supabase Dashboard

### Vérification 1 : Bucket Public

1. **Storage** > **Buckets** > **"attachments"**
2. Vérifier que **"Public bucket"** est activé
3. Vérifier que **"Allowed MIME types"** est **vide** ou **"Any"**

### Vérification 2 : Politiques RLS

1. **Storage** > **Policies**
2. Vérifier que ces 4 politiques existent :
   - "Anyone can view attachments" (SELECT, TO public)
   - "Authenticated users can upload attachments" (INSERT, TO authenticated)
   - "Users can update their own attachments" (UPDATE, TO authenticated)
   - "Users can delete their own attachments" (DELETE, TO authenticated)

---

## 📊 Diagnostic Automatique

Le code vérifie maintenant automatiquement les permissions. Si le problème persiste, vous verrez dans les logs :

```
[WARN] Vérification des permissions de stockage...
[ERROR] Rapport de vérification des permissions:
📋 RAPPORT DE VÉRIFICATION DES PERMISSIONS
==========================================
...
```

Ce rapport indiquera exactement ce qui ne va pas.

---

## 🚨 Si le Problème Persiste Encore

### Vérification Manuelle dans Supabase Dashboard

1. **Storage** > **Buckets** > **"attachments"**
   - ✅ "Public bucket" doit être activé
   - ✅ "Allowed MIME types" doit être vide

2. **Storage** > **Policies**
   - ✅ 4 politiques doivent exister (voir ci-dessus)

3. **SQL Editor** > Exécuter cette requête :

   ```sql
   SELECT id, name, public, allowed_mime_types
   FROM storage.buckets
   WHERE id = 'attachments';
   ```

   - ✅ `public` doit être `true`
   - ✅ `allowed_mime_types` doit être `NULL`

4. **SQL Editor** > Exécuter cette requête :

   ```sql
   SELECT policyname, cmd, roles::text
   FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND policyname ILIKE '%attachment%'
   ORDER BY cmd;
   ```

   - ✅ 4 politiques doivent être listées

---

## 💡 Points Importants

1. **Le bucket DOIT être public** : C'est la cause la plus probable
2. **Les restrictions MIME DOIVENT être supprimées** : Sinon les erreurs JSON sont rejetées
3. **Attendre la propagation** : Supabase a besoin de 2-3 minutes
4. **Vérifier visuellement** : Ne pas se fier uniquement aux migrations SQL

---

**Dernière mise à jour** : 1 Février 2025
