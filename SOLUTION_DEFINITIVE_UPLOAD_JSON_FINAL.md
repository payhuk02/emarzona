# 🔧 Solution Définitive : Upload JSON au lieu d'Images

**Date** : 1 Février 2025  
**Problème** : Les fichiers images sont uploadés comme "application/json" au lieu d'images

---

## 📊 Diagnostic

### Symptômes Observés

1. ✅ **Upload semble réussir** : `hasError: false`, `hasData: true`
2. ❌ **Fichier enregistré comme JSON** : Les métadonnées indiquent `application/json` au lieu de `image/jpeg`
3. ✅ **Détection fonctionne** : Le code détecte le problème immédiatement après l'upload
4. ✅ **Nettoyage automatique** : Le fichier JSON incorrect est supprimé automatiquement
5. ❌ **Problème persiste** : Malgré les politiques RLS configurées

### Cause Racine

**Les politiques RLS INSERT bloquent l'upload**, mais Supabase ne retourne pas d'erreur dans `uploadError`. Au lieu de cela, Supabase stocke la réponse d'erreur JSON comme contenu du fichier, ce qui fait que les métadonnées indiquent `application/json`.

---

## 🔍 Vérifications Nécessaires

### 1. Vérifier l'Authentification

```typescript
// Dans la console du navigateur
const {
  data: { user },
} = await supabase.auth.getUser();
console.log('User:', user);
console.log('Is authenticated:', !!user);
```

**Résultat attendu** : `user` doit être un objet avec `id`, `email`, etc.

### 2. Vérifier le Bucket dans Supabase Dashboard

1. Allez dans **Supabase Dashboard > Storage > Buckets**
2. Vérifiez que le bucket **"attachments"** existe
3. Vérifiez que **"Public bucket"** est activé (checkbox cochée)
4. Vérifiez que **"File size limit"** est suffisant (au moins 10MB)
5. Vérifiez que **"Allowed MIME types"** est vide ou contient les types d'images

### 3. Vérifier les Politiques RLS

1. Allez dans **Supabase Dashboard > Storage > Buckets > "attachments" > Policies**
2. Vous devez avoir **4 politiques** :

   **Politique 1 : SELECT (Lecture publique)**
   - **Name** : `Anyone can view attachments`
   - **Allowed operation** : `SELECT`
   - **Target roles** : `public` (⚠️ CRITIQUE : doit être "public", pas "authenticated")
   - **USING expression** : `bucket_id = 'attachments'`

   **Politique 2 : INSERT (Upload)**
   - **Name** : `Authenticated users can upload attachments`
   - **Allowed operation** : `INSERT`
   - **Target roles** : `authenticated` (⚠️ CRITIQUE : doit être "authenticated")
   - **WITH CHECK expression** : `bucket_id = 'attachments'`

   **Politique 3 : UPDATE**
   - **Name** : `Users can update their own attachments`
   - **Allowed operation** : `UPDATE`
   - **Target roles** : `authenticated`
   - **USING expression** : `bucket_id = 'attachments'`
   - **WITH CHECK expression** : `bucket_id = 'attachments'`

   **Politique 4 : DELETE**
   - **Name** : `Users can delete their own attachments`
   - **Allowed operation** : `DELETE`
   - **Target roles** : `authenticated`
   - **USING expression** : `bucket_id = 'attachments'`

---

## 🔧 Solution : Exécuter la Migration SQL

### Option 1 : Migration Complète (Recommandée)

Exécutez cette migration dans **Supabase Dashboard > SQL Editor** :

```sql
-- Fichier : supabase/migrations/20250201_create_and_configure_attachments_bucket.sql
```

Cette migration :

1. ✅ Crée le bucket "attachments" s'il n'existe pas
2. ✅ Configure le bucket comme PUBLIC
3. ✅ Supprime toutes les restrictions MIME types
4. ✅ Supprime toutes les anciennes politiques RLS
5. ✅ Crée les 4 politiques RLS correctes
6. ✅ Vérifie que tout est correctement configuré

### Option 2 : Migration de Diagnostic et Correction

Si le bucket existe déjà, exécutez cette migration :

```sql
-- Fichier : supabase/migrations/20250201_diagnose_and_fix_rls_attachments.sql
```

Cette migration :

1. ✅ Diagnostique tous les problèmes
2. ✅ Supprime toutes les anciennes politiques RLS
3. ✅ Recrée les 4 politiques RLS correctes
4. ✅ S'assure que le bucket est PUBLIC
5. ✅ Supprime les restrictions MIME types

---

## 📋 Étapes de Correction Manuelle (Si les migrations ne fonctionnent pas)

### Étape 1 : Vérifier et Corriger le Bucket

```sql
-- Vérifier le bucket
SELECT id, name, public, allowed_mime_types, file_size_limit
FROM storage.buckets
WHERE id = 'attachments';

-- Corriger le bucket
UPDATE storage.buckets
SET
  public = true,
  allowed_mime_types = NULL
WHERE id = 'attachments';
```

### Étape 2 : Supprimer Toutes les Anciennes Politiques

```sql
-- Supprimer toutes les politiques liées à "attachments"
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%attachment%'
        OR qual::text ILIKE '%attachment%'
        OR with_check::text ILIKE '%attachment%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;
```

### Étape 3 : Créer les Politiques RLS Correctes

```sql
-- Politique 1: Lecture PUBLIQUE (CRITIQUE - doit être TO public)
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2: Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Politique 3: Mise à jour
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4: Suppression
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');
```

### Étape 4 : Vérifier les Politiques

```sql
-- Vérifier les politiques créées
SELECT
  policyname,
  cmd,
  roles::text,
  qual::text,
  with_check::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%attachment%'
ORDER BY cmd;
```

**Résultat attendu** :

- 1 politique SELECT avec `roles = '{public}'`
- 1 politique INSERT avec `roles = '{authenticated}'`
- 1 politique UPDATE avec `roles = '{authenticated}'`
- 1 politique DELETE avec `roles = '{authenticated}'`

---

## ✅ Vérification Post-Correction

### 1. Vérifier dans Supabase Dashboard

1. **Storage > Buckets > "attachments"**
   - ✅ "Public bucket" est activé
   - ✅ "Allowed MIME types" est vide
   - ✅ "File size limit" est suffisant

2. **Storage > Buckets > "attachments" > Policies**
   - ✅ 4 politiques sont présentes
   - ✅ La politique SELECT est pour "public"
   - ✅ La politique INSERT est pour "authenticated"

### 2. Tester l'Upload

1. Rechargez la page de l'application
2. Essayez d'uploader une image
3. Vérifiez les logs de la console :
   - ✅ Pas d'erreur "File metadata shows JSON content type!"
   - ✅ Message "✅ File metadata verified"
   - ✅ L'image s'affiche correctement

### 3. Vérifier les Métadonnées

```sql
-- Vérifier les métadonnées d'un fichier uploadé
SELECT
  name,
  metadata->>'mimetype' as content_type,
  metadata->>'size' as size,
  created_at
FROM storage.objects
WHERE bucket_id = 'attachments'
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu** : `content_type` doit être `image/jpeg`, `image/png`, etc., **PAS** `application/json`

---

## 🚨 Points Critiques

### ⚠️ CRITIQUE 1 : Politique SELECT doit être pour "public"

Si la politique SELECT est pour "authenticated" au lieu de "public", les URLs publiques ne fonctionneront pas et retourneront du JSON.

**Solution** : Vérifiez que `roles = '{public}'` pour la politique SELECT.

### ⚠️ CRITIQUE 2 : Politique INSERT doit être pour "authenticated"

Si la politique INSERT est pour "public" ou n'existe pas, les uploads seront bloqués et stockés comme JSON.

**Solution** : Vérifiez que `roles = '{authenticated}'` pour la politique INSERT.

### ⚠️ CRITIQUE 3 : Bucket doit être PUBLIC

Si le bucket n'est pas marqué comme PUBLIC, les URLs publiques ne fonctionneront pas.

**Solution** : Vérifiez que `public = true` dans `storage.buckets`.

### ⚠️ CRITIQUE 4 : Pas de Restrictions MIME Types

Si le bucket a des restrictions MIME types, certains fichiers peuvent être rejetés.

**Solution** : Vérifiez que `allowed_mime_types = NULL` dans `storage.buckets`.

---

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes :

1. Vérifiez les logs Supabase Dashboard > Logs > API
2. Vérifiez les logs de l'application dans la console du navigateur
3. Vérifiez que l'utilisateur est bien authentifié
4. Vérifiez que le bucket existe et est PUBLIC
5. Vérifiez que les 4 politiques RLS sont correctement configurées

---

## 📝 Notes Techniques

### Pourquoi les fichiers sont stockés comme JSON ?

Quand les politiques RLS bloquent l'upload, Supabase ne retourne pas toujours une erreur dans `uploadError`. Au lieu de cela, Supabase peut :

1. Accepter la requête d'upload
2. Bloquer l'écriture à cause des RLS
3. Retourner une réponse d'erreur JSON
4. Stocker cette réponse JSON comme contenu du fichier

C'est pourquoi les métadonnées indiquent `application/json` au lieu du type de fichier attendu.

### Comment le code détecte ce problème ?

Le code vérifie les métadonnées du fichier immédiatement après l'upload :

```typescript
const uploadedContentType =
  foundFile.metadata?.mimetype ||
  foundFile.metadata?.contentType ||
  foundFile.metadata?.['content-type'];

if (uploadedContentType === 'application/json') {
  // Le fichier a été stocké comme JSON - c'est une erreur
  // Supprimer le fichier et lancer une erreur
}
```

Si `uploadedContentType === 'application/json'`, le code :

1. Supprime immédiatement le fichier JSON incorrect
2. Lance une erreur avec des instructions de correction
3. Empêche l'utilisation du fichier incorrect

---

**Dernière mise à jour** : 1 Février 2025


