# 🚨 GUIDE URGENT - Création du Bucket "attachments"

## Problème: Les fichiers sont uploadés comme JSON au lieu d'images

---

## ⚠️ PROBLÈME IDENTIFIÉ

**Erreur**: `File uploaded as JSON instead of image!`

**Cause**: Le bucket Supabase "attachments" **n'existe pas**.

**Impact**:

- ❌ Impossible d'uploader des fichiers dans les messages
- ❌ Les images sont rejetées
- ❌ Le système de messaging ne peut pas fonctionner correctement

---

## ✅ SOLUTION IMMÉDIATE

### ÉTAPE 1: Accéder à Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **Emarzona**

---

### ÉTAPE 2: Exécuter la Migration SQL

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query** (Nouvelle requête)
3. **Copiez-collez** le contenu complet du fichier suivant:

   **Fichier**: `supabase/migrations/20250201_create_and_configure_attachments_bucket.sql`

4. Cliquez sur **Run** (Exécuter) ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

---

### ÉTAPE 3: Vérifier la Création du Bucket

1. Dans le menu de gauche, cliquez sur **Storage**
2. Cliquez sur **Buckets**
3. Vérifiez que le bucket **"attachments"** apparaît dans la liste
4. **IMPORTANT**: Cliquez sur le bucket "attachments"
5. Vérifiez que la case **"Public bucket"** est **COCHÉE** ✅
6. Si ce n'est pas le cas, cochez-la et cliquez sur **Save**

---

### ÉTAPE 4: Vérifier les Politiques RLS

1. Toujours dans **Storage** > **Buckets** > **"attachments"**
2. Cliquez sur l'onglet **Policies** (Politiques)
3. Vérifiez que les politiques suivantes existent:
   - ✅ "Anyone can view attachments" (SELECT)
   - ✅ "Authenticated users can upload attachments" (INSERT)
   - ✅ "Users can update their own attachments" (UPDATE)
   - ✅ "Users can delete their own attachments" (DELETE)

---

### ÉTAPE 5: Attendre la Propagation

1. **Attendez 2-3 minutes** après l'exécution de la migration
2. Supabase a besoin de ce délai pour propager les changements

---

### ÉTAPE 6: Tester

1. Rechargez votre application (F5 ou Ctrl+R)
2. Essayez d'uploader une image dans un message
3. Vérifiez que l'image s'affiche correctement

---

## 📋 VÉRIFICATION POST-CRÉATION

Après avoir exécuté la migration, vous devriez voir dans les logs SQL:

```
✅ Bucket "attachments" créé avec succès
✅ Bucket "attachments" mis à jour (public + pas de restrictions MIME)
✅ X politique(s) supprimée(s)
✅ CONFIGURATION COMPLÈTE ET CORRECTE !
```

---

## 🔍 SI LE BUCKET EXISTE DÉJÀ

Si le bucket existe déjà mais n'est pas public:

1. Allez dans **Storage** > **Buckets** > **"attachments"**
2. Cochez **"Public bucket"**
3. Cliquez sur **Save**
4. Attendez 2-3 minutes
5. Rechargez l'application

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

1. Vérifiez que vous êtes bien connecté à Supabase
2. Vérifiez que vous avez les permissions d'administrateur
3. Vérifiez les logs SQL pour voir s'il y a des erreurs
4. Essayez d'exécuter la migration en plusieurs parties si nécessaire

---

## 📝 FICHIER DE MIGRATION

Le fichier de migration se trouve à:

```
supabase/migrations/20250201_create_and_configure_attachments_bucket.sql
```

**Contenu**: Crée le bucket, le configure comme PUBLIC, supprime les restrictions MIME, et crée toutes les politiques RLS nécessaires.

---

## ✅ RÉSULTAT ATTENDU

Après avoir exécuté la migration:

- ✅ Bucket "attachments" créé
- ✅ Bucket configuré comme PUBLIC
- ✅ Politiques RLS créées
- ✅ Upload de fichiers fonctionnel
- ✅ Affichage des images correct
- ✅ Plus d'erreur "JSON instead of image"

---

**Date**: 1 Février 2025
**Priorité**: 🔴 URGENT - Bloque le système de messaging
