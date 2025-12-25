# 🔍 Audit Complet : Upload JSON au lieu d'Images - Solution Définitive

**Date** : 1 Février 2025  
**Problème** : Les fichiers images sont uploadés comme "application/json" malgré les politiques RLS configurées

---

## 📊 Analyse du Problème

### Symptômes Observés

1. ✅ **Upload semble réussir** : `hasError: false`, `hasData: true`
2. ❌ **Fichier enregistré comme JSON** : `actual: 'application/json'` au lieu de `expected: 'image/jpeg'`
3. ✅ **Détection fonctionne** : Le code détecte le problème immédiatement
4. ✅ **Nettoyage automatique** : Le fichier JSON incorrect est supprimé
5. ❌ **Problème persiste** : Malgré les politiques RLS configurées

### Causes Possibles

1. **Bucket non public** : Le bucket "attachments" n'est pas marqué comme PUBLIC dans Supabase Dashboard
2. **Conflit de politiques** : D'autres politiques RLS bloquent l'upload
3. **Authentification** : L'utilisateur n'est pas correctement authentifié
4. **Délai de propagation** : Les changements RLS ne sont pas encore propagés
5. **Problème Supabase** : Bug ou limitation de Supabase Storage
6. **Options d'upload** : Les options passées à `supabase.storage.upload()` causent le problème

---

## 🔍 Diagnostic Complet

### Étape 1 : Vérifier l'Authentification

```typescript
// Dans la console du navigateur
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
console.log('Is authenticated:', !!user);
```

**Résultat attendu** : `user` doit être un objet avec `id`, `email`, etc.

### Étape 2 : Vérifier le Bucket Public

```sql
-- Dans Supabase SQL Editor
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'attachments';
```

**Résultat attendu** : `public = true`

### Étape 3 : Vérifier les Politiques RLS

```sql
-- Dans Supabase SQL Editor
SELECT 
  policyname,
  cmd,
  roles::text,
  qual::text,
  with_check::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%attachment%'
    OR qual::text ILIKE '%attachment%'
    OR with_check::text ILIKE '%attachment%'
  )
ORDER BY cmd;
```

**Résultat attendu** : 4 politiques (SELECT, INSERT, UPDATE, DELETE)

### Étape 4 : Tester l'Upload Directement

```typescript
// Dans la console du navigateur
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('attachments')
  .upload('test/test.jpg', testFile, {
    contentType: 'image/jpeg',
    upsert: false,
  });
console.log('Upload result:', { data, error });
```

**Résultat attendu** : `data.path` existe et `error` est `null`

### Étape 5 : Vérifier le Fichier Uploadé

```typescript
// Dans la console du navigateur
const { data: fileList, error } = await supabase.storage
  .from('attachments')
  .list('test', { limit: 1 });
console.log('File list:', fileList);
if (fileList && fileList[0]) {
  console.log('File metadata:', fileList[0].metadata);
  console.log('Content-Type:', fileList[0].metadata?.mimetype || fileList[0].metadata?.contentType);
}
```

**Résultat attendu** : `metadata.mimetype` ou `metadata.contentType` = `'image/jpeg'`

---

## 🔧 Solutions Possibles

### Solution 1 : Vérifier et Forcer le Bucket Public

1. **Supabase Dashboard** > **Storage** > **Buckets**
2. Cliquez sur **"attachments"**
3. Vérifiez que **"Public bucket"** est activé
4. Si ce n'est pas le cas, activez-le et sauvegardez

### Solution 2 : Supprimer et Recréer les Politiques

Exécutez cette migration SQL :

```sql
-- Supprimer toutes les politiques existantes
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

-- Recréer les politiques
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');
```

### Solution 3 : Modifier les Options d'Upload

Le problème peut venir des options passées à `supabase.storage.upload()`. Essayez de simplifier :

```typescript
const { data, error } = await supabase.storage
  .from('attachments')
  .upload(filePath, fileToUpload, {
    contentType, // Garder seulement contentType
    // Retirer cacheControl, metadata, upsert
  });
```

### Solution 4 : Utiliser un Bucket Différent Temporairement

Pour tester si le problème vient du bucket "attachments" :

1. Créez un nouveau bucket "test-uploads" (public)
2. Testez l'upload dans ce bucket
3. Si ça fonctionne, le problème vient de la configuration du bucket "attachments"

### Solution 5 : Vérifier les Headers de la Requête

Le problème peut venir des headers HTTP. Vérifiez dans l'onglet **Network** du navigateur :

1. Ouvrez **DevTools** > **Network**
2. Filtrez par **"storage"** ou **"upload"**
3. Cliquez sur la requête d'upload
4. Vérifiez les **Request Headers** :
   - `Authorization` doit être présent
   - `Content-Type` doit correspondre au type de fichier
5. Vérifiez les **Response Headers** :
   - `Content-Type` de la réponse (ne doit pas être `application/json`)

---

## 🎯 Solution Recommandée (Ordre de Priorité)

### Priorité 1 : Vérifier le Bucket Public

**Action** :
1. Supabase Dashboard > Storage > Buckets > "attachments"
2. Activer "Public bucket" si ce n'est pas déjà fait
3. Attendre 2-3 minutes
4. Tester l'upload

### Priorité 2 : Vérifier l'Authentification

**Action** :
1. Vérifier que vous êtes connecté
2. Vérifier que la session n'a pas expiré
3. Se reconnecter si nécessaire
4. Tester l'upload

### Priorité 3 : Simplifier les Options d'Upload

**Action** :
1. Modifier `useFileUpload.ts` pour simplifier les options
2. Retirer `cacheControl`, `metadata`, `upsert`
3. Garder seulement `contentType`
4. Tester l'upload

### Priorité 4 : Recréer les Politiques RLS

**Action** :
1. Exécuter la migration SQL de "Solution 2"
2. Attendre 2-3 minutes
3. Tester l'upload

### Priorité 5 : Créer un Nouveau Bucket

**Action** :
1. Créer un nouveau bucket "attachments-v2" (public)
2. Configurer les mêmes politiques RLS
3. Modifier le code pour utiliser ce nouveau bucket
4. Tester l'upload

---

## 📝 Modifications de Code Recommandées

### Modification 1 : Simplifier les Options d'Upload

```typescript
// Dans useFileUpload.ts, ligne ~429
const { data: uploadData, error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(filePath, fileToUpload, {
    contentType, // Seulement contentType, pas d'autres options
  });
```

### Modification 2 : Ajouter une Vérification d'Authentification

```typescript
// Avant l'upload, vérifier l'authentification
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (!user || authError) {
  throw new Error('Vous devez être connecté pour uploader des fichiers');
}
```

### Modification 3 : Ajouter un Retry avec Délai Plus Long

```typescript
// Attendre plus longtemps après l'upload pour la propagation
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes au lieu de 500ms
```

---

## 🚨 Si Rien ne Fonctionne

### Solution de Contournement : Utiliser Signed URLs

Si l'upload direct ne fonctionne toujours pas, utilisez des signed URLs :

```typescript
// 1. Générer une signed URL pour l'upload
const { data: signedUrlData, error: signedUrlError } = await supabase.storage
  .from('attachments')
  .createSignedUploadUrl(filePath);

if (signedUrlError || !signedUrlData) {
  throw new Error('Impossible de générer une URL signée');
}

// 2. Uploader directement vers l'URL signée
const response = await fetch(signedUrlData.signedUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': contentType,
  },
  body: fileToUpload,
});

if (!response.ok) {
  throw new Error(`Upload failed: ${response.statusText}`);
}
```

---

## 📊 Checklist de Vérification

- [ ] Bucket "attachments" est marqué comme PUBLIC
- [ ] 4 politiques RLS sont configurées (SELECT, INSERT, UPDATE, DELETE)
- [ ] L'utilisateur est authentifié (`supabase.auth.getUser()` retourne un user)
- [ ] La session n'a pas expiré
- [ ] Attendu 2-3 minutes après modification des politiques RLS
- [ ] Testé l'upload directement dans la console du navigateur
- [ ] Vérifié les headers HTTP dans l'onglet Network
- [ ] Simplifié les options d'upload (seulement `contentType`)
- [ ] Testé avec un nouveau bucket temporaire

---

**Dernière mise à jour** : 1 Février 2025

