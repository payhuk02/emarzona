# 📦 Instructions : Création du Bucket "attachments"

**Date** : 1 Février 2025  
**Problème** : Le bucket "attachments" n'existe pas, causant des erreurs d'upload

---

## 🎯 Solution : Créer le Bucket

### Option 1 : Via Migration SQL (Recommandé)

1. **Allez dans Supabase Dashboard** > **SQL Editor**
2. **Cliquez sur "New query"**
3. **Ouvrez le fichier** : `supabase/migrations/20250201_create_attachments_bucket.sql`
4. **Copiez tout le contenu** du fichier
5. **Collez-le dans l'éditeur SQL**
6. **Cliquez sur "Run"** (ou `Ctrl+Enter`)
7. **Lisez les messages** dans la console :
   - ✅ `Bucket "attachments" créé avec succès`
   - ✅ `Configuration complète et correcte !`

### Option 2 : Via Dashboard Supabase

1. **Allez dans Supabase Dashboard** > **Storage** > **Buckets**
2. **Cliquez sur "New bucket"**
3. **Remplissez** :
   - **Name** : `attachments`
   - **Public bucket** : ✅ **ACTIVEZ** (très important !)
   - **File size limit** : `52428800` (50MB)
4. **Cliquez sur "Create bucket"**

---

## ✅ Vérification

Après la création, vérifiez :

1. **Le bucket existe** :
   - Supabase Dashboard > Storage > Buckets
   - Vous devriez voir "attachments" dans la liste

2. **Le bucket est PUBLIC** :
   - Cliquez sur le bucket "attachments"
   - Vérifiez que "Public bucket" est activé ✅

3. **Les politiques RLS existent** :
   - Supabase Dashboard > Storage > Policies
   - Vous devriez voir :
     - ✅ "Anyone can view attachments" (SELECT, TO public)
     - ✅ "Authenticated users can upload attachments" (INSERT, TO authenticated)

---

## 🔄 Après la Création

1. **Attendez 2-3 minutes** (délai de propagation Supabase)
2. **Rechargez votre application** (F5)
3. **Réessayez l'upload** d'un fichier

---

## 📋 Si le Problème Persiste

Si après la création du bucket, l'upload échoue toujours :

1. **Exécutez la migration de vérification** :
   - `supabase/migrations/20250201_verify_and_fix_attachments_bucket.sql`
   - Cette migration corrige les politiques RLS si nécessaire

2. **Vérifiez les logs Supabase** :
   - Supabase Dashboard > Logs > Storage
   - Cherchez les erreurs liées au bucket "attachments"

3. **Contactez le support** :
   - 📧 Email : support@emarzona.com
   - 💬 Chat : Disponible dans le dashboard

---

**Dernière mise à jour** : 1 Février 2025

