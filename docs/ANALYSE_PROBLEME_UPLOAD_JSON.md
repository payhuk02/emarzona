# 🔍 Analyse Approfondie : Problème Upload JSON

**Date** : 1 Février 2025  
**Problème** : Les fichiers uploadés sont enregistrés comme "application/json" au lieu d'images

---

## 📊 Observations

### 1. Symptômes
- ✅ Le bucket "attachments" existe maintenant
- ✅ Le bucket est PUBLIC
- ❌ Les fichiers sont enregistrés comme "application/json - 44.68 KB"
- ❌ Le serveur retourne du JSON au lieu du fichier
- ❌ Les URLs publiques retournent du JSON (erreur Supabase)

### 2. Comportement Actuel
- L'upload semble réussir (pas d'erreur `uploadError`)
- Le fichier est créé dans le bucket
- Mais le contenu est du JSON (réponse d'erreur Supabase)
- Les politiques RLS semblent bloquer l'accès

---

## 🔍 Analyse du Code

### Point 1 : Upload Supabase
```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(filePath, fileToUpload, {
    cacheControl: '3600',
    contentType,
    upsert: false,
    metadata: {...},
  });
```

**Problème potentiel** :
- Si `uploadError` est `null` mais que `uploadData` contient une erreur JSON
- Si Supabase accepte l'upload mais retourne une erreur dans le body
- Si le fichier est uploadé mais les RLS bloquent ensuite l'accès

### Point 2 : Vérification Post-Upload
```typescript
const testResponse = await fetch(urlData.publicUrl, { 
  method: 'HEAD',
  cache: 'no-cache',
});
```

**Problème identifié** :
- La vérification se fait APRÈS l'upload
- Si les RLS bloquent, on obtient du JSON
- Mais le fichier est déjà créé avec le contenu JSON de l'erreur

### Point 3 : Politiques RLS
Les politiques créées sont :
- `"Anyone can view attachments"` (SELECT, TO public)
- `"Authenticated users can upload attachments"` (INSERT, TO authenticated)

**Problème potentiel** :
- Les politiques peuvent ne pas être appliquées correctement
- Il peut y avoir un conflit avec d'autres politiques
- Le bucket peut ne pas être vraiment PUBLIC malgré la configuration

---

## 🎯 Hypothèses

### Hypothèse 1 : Upload Silencieux avec Erreur JSON
**Scénario** :
1. L'upload est accepté par Supabase
2. Mais les RLS bloquent l'écriture
3. Supabase retourne une erreur JSON
4. Cette erreur JSON est enregistrée comme fichier

**Vérification** :
- Vérifier si `uploadError` est vraiment `null`
- Vérifier le contenu de `uploadData`
- Logger la réponse complète de Supabase

### Hypothèse 2 : Problème de Content-Type
**Scénario** :
1. Le fichier est uploadé avec le bon Content-Type
2. Mais Supabase le rejette et retourne du JSON
3. Le JSON est enregistré avec Content-Type "application/json"

**Vérification** :
- Vérifier que `contentType` est correct
- Vérifier que `fileToUpload` est bien un File/Blob
- Logger le type MIME détecté

### Hypothèse 3 : Problème de Politiques RLS
**Scénario** :
1. Les politiques RLS sont créées
2. Mais elles ne sont pas appliquées correctement
3. L'upload réussit mais l'accès est bloqué
4. Quand on essaie de lire, on obtient une erreur JSON

**Vérification** :
- Vérifier les politiques dans Supabase Dashboard
- Tester l'accès direct via l'API
- Vérifier les logs Supabase

---

## 🔧 Solutions Proposées

### Solution 1 : Vérifier la Réponse Complète de l'Upload
Ajouter un logging détaillé pour voir exactement ce que Supabase retourne :

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(filePath, fileToUpload, {...});

// Logger la réponse complète
logger.info('Upload response', {
  uploadData,
  uploadError,
  hasData: !!uploadData,
  hasError: !!uploadError,
  dataType: typeof uploadData,
  errorType: typeof uploadError,
});
```

### Solution 2 : Vérifier le Fichier Avant Upload
S'assurer que `fileToUpload` est bien un File/Blob valide :

```typescript
// Vérifier que fileToUpload est un File/Blob
if (!(fileToUpload instanceof File) && !(fileToUpload instanceof Blob)) {
  throw new Error('fileToUpload must be a File or Blob');
}

// Vérifier la taille
if (fileToUpload.size === 0) {
  throw new Error('File is empty');
}

// Vérifier le type
if (!fileToUpload.type && !contentType) {
  logger.warn('No content type detected', { fileName: file.name });
}
```

### Solution 3 : Vérifier les Politiques RLS Immédiatement
Tester l'accès immédiatement après l'upload :

```typescript
// Après l'upload, tester immédiatement avec list()
const { data: fileList, error: listError } = await supabase.storage
  .from(bucket)
  .list(folder, { search: fileName });

if (listError) {
  logger.error('Cannot list file after upload', { listError });
  throw new Error('RLS policies may be blocking access');
}

const uploadedFile = fileList?.find(f => f.name === fileName);
if (!uploadedFile) {
  throw new Error('File not found in bucket after upload');
}

// Vérifier le Content-Type du fichier uploadé
if (uploadedFile.metadata?.mimetype !== contentType) {
  logger.warn('Content-Type mismatch', {
    expected: contentType,
    actual: uploadedFile.metadata?.mimetype,
  });
}
```

### Solution 4 : Utiliser une URL Signée Immédiatement
Si l'URL publique ne fonctionne pas, utiliser une URL signée :

```typescript
// Générer une URL signée immédiatement après l'upload
const { data: signedUrlData, error: signedUrlError } = await supabase.storage
  .from(bucket)
  .createSignedUrl(uploadData.path, 3600);

if (!signedUrlError && signedUrlData?.signedUrl) {
  // Tester l'URL signée
  const signedTest = await fetch(signedUrlData.signedUrl, { method: 'HEAD' });
  if (signedTest.ok) {
    // L'URL signée fonctionne, utiliser celle-ci
    return { ...uploadData, publicUrl: signedUrlData.signedUrl };
  }
}
```

---

## 🚨 Problème Critique Identifié

En regardant l'image du dashboard Supabase, je vois que les fichiers sont enregistrés comme "application/json". Cela signifie que :

**Le fichier uploadé EST du JSON, pas une image.**

Cela peut arriver si :
1. Supabase retourne une erreur JSON lors de l'upload
2. Cette erreur JSON est enregistrée comme fichier
3. Le code ne détecte pas l'erreur car `uploadError` est `null`

**Solution immédiate** :
Vérifier si `uploadData` contient une erreur même si `uploadError` est `null`.

---

## 📋 Plan d'Action

1. **Ajouter un logging détaillé** de la réponse Supabase
2. **Vérifier le type de `uploadData`** avant de continuer
3. **Tester l'accès immédiatement** après l'upload avec `list()`
4. **Vérifier les politiques RLS** dans Supabase Dashboard
5. **Tester avec une URL signée** si l'URL publique échoue

---

**Dernière mise à jour** : 1 Février 2025

