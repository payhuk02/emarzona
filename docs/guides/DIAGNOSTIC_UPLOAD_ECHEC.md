# 🔍 Guide de Diagnostic - Échec d'Upload de Fichiers

**Date**: 1 Février 2025  
**Problème**: Les fichiers ne peuvent pas être uploadés dans le bucket "attachments"

---

## ✅ Améliorations Apportées

### 1. Vérification après Upload

- ✅ Vérification de l'existence du fichier dans le bucket avec `list()`
- ✅ Test de l'URL publique avec HEAD request
- ✅ Détection si l'URL retourne du JSON
- ✅ Erreur explicite si le fichier n'existe pas

### 2. Messages d'Erreur Améliorés

- ✅ Messages détaillés selon le type d'erreur
- ✅ Codes d'erreur HTTP affichés (403, 404, etc.)
- ✅ Suggestions de solutions selon l'erreur

### 3. Logs Détaillés

- ✅ Logs complets dans la console (F12)
- ✅ Informations sur le chemin, l'URL, le statut HTTP
- ✅ Détails de l'erreur originale

---

## 🔍 Étapes de Diagnostic

### Étape 1 : Vérifier les Logs de la Console

Ouvrez la console du navigateur (F12) et cherchez :

1. **Erreurs d'upload** :

   ```
   Upload error details
   ```

   - Notez le `errorCode` et `errorMessage`
   - Vérifiez le `filePath` utilisé

2. **Erreurs de vérification** :

   ```
   File not found in bucket after upload
   ```

   - Indique que le fichier n'existe pas après l'upload
   - Vérifiez le `path` et `folderPath`

3. **Erreurs d'accès** :

   ```
   Uploaded file not accessible via public URL
   ```

   - Notez le `status` HTTP (403 = permissions, 404 = fichier introuvable)

---

### Étape 2 : Vérifier le Bucket dans Supabase Dashboard

1. **Allez dans Supabase Dashboard** > **Storage** > **Buckets**
2. **Vérifiez que le bucket "attachments" existe**
3. **Vérifiez que le bucket est PUBLIC** (icône de globe 🌐)
4. **Cliquez sur le bucket "attachments"**
5. **Naviguez dans le dossier** `vendor-message-attachments/`
6. **Vérifiez si les fichiers sont présents**

---

### Étape 3 : Vérifier les Politiques RLS

1. **Allez dans Supabase Dashboard** > **Storage** > **Policies**
2. **Filtrez par bucket "attachments"**
3. **Vérifiez que ces politiques existent** :

   **Politique SELECT (Lecture)** :
   - Nom : `Anyone can view attachments`
   - Commande : `SELECT`
   - Rôles : `public`
   - Condition : `bucket_id = 'attachments'`

   **Politique INSERT (Upload)** :
   - Nom : `Authenticated users can upload attachments`
   - Commande : `INSERT`
   - Rôles : `authenticated`
   - Condition : `bucket_id = 'attachments'`

4. **Si les politiques manquent ou sont incorrectes**, exécutez cette migration :
   ```sql
   -- Voir : supabase/migrations/20250230_force_fix_attachments_rls.sql
   ```

---

### Étape 4 : Tester l'Upload Manuellement

Dans la console du navigateur (F12), testez :

```javascript
// 1. Vérifier que vous êtes connecté
const {
  data: { user },
} = await supabase.auth.getUser();
console.log('User:', user);

// 2. Tester un upload simple
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('attachments')
  .upload('test-upload/test.txt', testFile);

if (error) {
  console.error('Upload error:', error);
} else {
  console.log('Upload success:', data);

  // 3. Vérifier que le fichier existe
  const { data: files } = await supabase.storage.from('attachments').list('test-upload');
  console.log('Files in test-upload:', files);
}
```

---

## 🛠️ Solutions selon l'Erreur

### Erreur : "Permission refusée" (403)

**Cause** : Les politiques RLS bloquent l'upload

**Solution** :

1. Vérifiez que vous êtes connecté (`auth.getUser()`)
2. Vérifiez que la politique INSERT existe pour `authenticated`
3. Exécutez la migration de fix RLS :
   ```sql
   -- Voir : supabase/migrations/20250230_force_fix_attachments_rls.sql
   ```

---

### Erreur : "Fichier introuvable" (404)

**Cause** : Le fichier n'existe pas dans le bucket après l'upload

**Solutions possibles** :

1. **Vérifiez que l'upload a vraiment réussi** :
   - Regardez les logs : `✅ File verified in bucket after upload`
   - Si absent, l'upload a échoué silencieusement

2. **Vérifiez le chemin utilisé** :
   - Le chemin doit être : `vendor-message-attachments/{conversationId}/{filename}`
   - Vérifiez dans les logs le `path` exact

3. **Vérifiez les permissions du bucket** :
   - Le bucket doit être PUBLIC
   - Les politiques RLS doivent permettre l'INSERT

---

### Erreur : "Le serveur retourne du JSON"

**Cause** : Le fichier n'existe pas, Supabase retourne une erreur JSON

**Solution** :

1. Vérifiez que le fichier existe dans le bucket (Supabase Dashboard)
2. Si absent, l'upload a échoué
3. Vérifiez les logs pour l'erreur d'upload originale

---

### Erreur : "File size exceeds"

**Cause** : Le fichier dépasse la limite (10MB)

**Solution** :

- Réduisez la taille du fichier
- Utilisez la compression d'images (activée par défaut)

---

### Erreur : "Invalid file type"

**Cause** : Le type MIME n'est pas autorisé

**Solution** :

- Vérifiez que le type de fichier est dans la liste autorisée
- Types autorisés : images, vidéos, PDF, documents Office, ZIP, etc.

---

## 📋 Checklist de Vérification

- [ ] Bucket "attachments" existe dans Supabase
- [ ] Bucket "attachments" est PUBLIC
- [ ] Politique SELECT existe pour `public`
- [ ] Politique INSERT existe pour `authenticated`
- [ ] Utilisateur est connecté (`auth.getUser()`)
- [ ] Fichier ne dépasse pas 10MB
- [ ] Type de fichier est autorisé
- [ ] Logs de la console ne montrent pas d'erreur d'upload
- [ ] Fichier apparaît dans Supabase Dashboard après upload

---

## 🔧 Commandes SQL de Diagnostic

### Vérifier l'état du bucket

```sql
SELECT
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id = 'attachments';
```

### Vérifier les politiques RLS

```sql
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
    policyname LIKE '%attachment%'
    OR qual::text LIKE '%attachment%'
    OR with_check::text LIKE '%attachment%'
  );
```

### Vérifier les fichiers dans le bucket

```sql
SELECT
  name,
  bucket_id,
  owner,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'attachments'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Collectez les informations suivantes** :
   - Logs complets de la console (F12)
   - Résultat des commandes SQL de diagnostic
   - Screenshot du Supabase Dashboard (bucket et politiques)

2. **Vérifiez les migrations** :
   - Assurez-vous que toutes les migrations ont été exécutées
   - Vérifiez particulièrement : `20250230_force_fix_attachments_rls.sql`

3. **Testez avec un fichier simple** :
   - Utilisez un petit fichier texte (.txt)
   - Vérifiez que l'upload fonctionne
   - Si oui, le problème est lié au type/taille du fichier

---

**Dernière mise à jour** : 1 Février 2025
