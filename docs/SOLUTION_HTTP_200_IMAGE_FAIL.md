# Solution au problème HTTP 200 avec Content-Type JSON au lieu d'image

**Date :** 31 Janvier 2025  
**Problème :** Les images retournent HTTP 200 mais avec `Content-Type: application/json` au lieu de `image/*`  
**Statut :** 🔧 **CORRECTIONS APPLIQUÉES - À TESTER**

---

## 🔴 Problème Identifié

Les images dans les messages retournent un statut HTTP 200 (succès) mais avec un `Content-Type: application/json` au lieu de `image/*`. Cela signifie que Supabase retourne probablement une réponse JSON d'erreur au lieu de l'image elle-même.

### Causes Possibles

1. **Fichier introuvable** : Le fichier n'existe pas réellement dans le bucket malgré une URL valide
2. **Problème de permissions RLS** : Les politiques RLS bloquent l'accès et retournent une erreur JSON
3. **Fichier corrompu** : Le fichier a été corrompu lors de l'upload et est vide ou invalide
4. **Content-Type incorrect** : Le fichier a été uploadé sans Content-Type correct

---

## ✅ Corrections Appliquées

### 1. Amélioration de l'Upload avec Content-Type Explicite

**Fichiers modifiés :**

- `src/pages/vendor/VendorMessaging.tsx`
- `src/hooks/useMessaging.ts`

**Changements :**

- Ajout de `contentType` explicite lors de l'upload pour garantir le bon type MIME
- Ajout de metadata (`originalName`, `uploadedAt`) pour le tracking
- Vérification que l'upload retourne bien un `path`
- Enregistrement du `storage_path` réel retourné par Supabase

**Code avant :**

```typescript
await supabase.storage.from('attachments').upload(filePath, file);
```

**Code après :**

```typescript
await supabase.storage.from('attachments').upload(filePath, file, {
  cacheControl: '3600',
  contentType: file.type || 'application/octet-stream',
  metadata: {
    originalName: file.name,
    uploadedAt: new Date().toISOString(),
  },
});
```

### 2. Enregistrement du storage_path

**Fichiers modifiés :**

- `src/pages/vendor/VendorMessaging.tsx`
- `src/hooks/useMessaging.ts`
- `src/hooks/useVendorMessaging.ts`

**Changements :**

- Le `storage_path` est maintenant toujours enregistré dans la base de données
- Utilisation du `path` réel retourné par l'upload plutôt que celui construit
- Le type `VendorMessageFormData` a été mis à jour pour inclure `storage_path` optionnel

### 3. Diagnostic Amélioré dans MediaAttachment

**Fichier modifié :**

- `src/components/media/MediaAttachment.tsx`

**Changements :**

- Analyse approfondie des réponses JSON/HTML pour identifier les erreurs Supabase
- Parsing du contenu JSON pour extraire les messages d'erreur
- Détection des pages d'erreur HTML
- Logs détaillés avec suggestions spécifiques selon le type d'erreur
- **Affichage de l'erreur JSON dans l'UI** : Les erreurs JSON sont maintenant stockées dans l'état et affichées dans l'overlay d'erreur
- **Vérification du blob type** : Le composant vérifie maintenant si le blob est vraiment une image même si le Content-Type HTTP est incorrect

**Nouveaux états ajoutés :**

- `jsonError` : Stocke l'erreur JSON parsée de Supabase
- `isImageBlob` : Indique si le blob téléchargé est vraiment une image

**Nouveaux logs :**

```typescript
// Si réponse JSON, parser pour voir l'erreur Supabase
if (detectedContentType.includes('application/json')) {
  const jsonContent = JSON.parse(await blob.text());
  setJsonError(jsonContent); // Stocker dans l'état pour affichage UI
  logger.error('❌ JSON Response Analysis (Supabase Error)', {
    jsonError: jsonContent,
    suggestion:
      jsonContent.error || jsonContent.message
        ? `Erreur Supabase: ${jsonContent.error || jsonContent.message}`
        : 'Problème de permissions RLS ou fichier introuvable.',
  });
}
```

**Affichage UI amélioré :**

- L'overlay d'erreur affiche maintenant le message d'erreur JSON si disponible
- Le bouton "Debug" inclut toutes les informations de diagnostic (jsonError, contentType, isImageBlob, etc.)

---

## 🔍 Diagnostic

### Vérifier dans la Console

1. Ouvrez la console du navigateur (F12)
2. Cherchez les logs commençant par `❌ CRITICAL: HTTP 200 but invalid Content-Type`
3. Examinez les détails de la réponse JSON pour voir l'erreur Supabase exacte

### Script de Test dans la Console

```javascript
// Tester une URL d'image directement
async function testImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));

    if (response.headers.get('content-type')?.includes('application/json')) {
      const fullResponse = await fetch(url);
      const blob = await fullResponse.blob();
      const text = await blob.text();
      try {
        const json = JSON.parse(text);
        console.error('❌ JSON Error Response:', json);
      } catch {
        console.error('❌ Invalid JSON:', text.substring(0, 200));
      }
    }
  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }
}

// Utilisation : coller l'URL de l'image
// testImageUrl('https://xxx.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/xxx.png');
```

### Vérifier dans Supabase Dashboard

1. **Storage > Buckets > attachments**
   - Vérifiez que le bucket est **public**
   - Vérifiez que les fichiers existent dans le bon dossier (`vendor-message-attachments/` ou `message-attachments/`)

2. **Storage > Policies**
   - Vérifiez que la politique "Anyone can view attachments" (SELECT) existe et est active
   - Vérifiez qu'elle utilise `bucket_id = 'attachments'`

3. **Storage > Files**
   - Cliquez sur un fichier qui ne s'affiche pas
   - Vérifiez que le fichier n'est pas vide (size > 0)
   - Téléchargez-le et vérifiez qu'il s'ouvre comme une image valide

---

## 🚀 Actions à Effectuer

### 1. Exécuter la Migration SQL

Exécutez la migration pour s'assurer que les politiques RLS sont correctes :

**Option A : Via Supabase Dashboard (Recommandé)**

1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez le contenu de `supabase/migrations/20250230_fix_attachments_rls_policies.sql`
3. Collez et exécutez la requête

**Option B : Via Supabase CLI**

```bash
# Exécuter toutes les migrations en attente
supabase db push

# Ou exécuter uniquement cette migration
supabase db execute -f supabase/migrations/20250230_fix_attachments_rls_policies.sql
```

**Option C : Vérifier la configuration**
Exécutez le script de vérification pour diagnostiquer :

```sql
-- Fichier: supabase/migrations/20250230_verify_attachments_rls.sql
```

**Guide détaillé :** Voir `docs/guides/EXECUTER_MIGRATION_RLS_ATTACHMENTS.md`

### 2. Tester avec une Nouvelle Image

1. Allez sur la page de messagerie
2. Envoyez une nouvelle image
3. Vérifiez les logs dans la console
4. Si l'erreur persiste, utilisez le script de test ci-dessus avec l'URL de l'image

### 3. Vérifier les Fichiers Existants

Pour les images qui ne s'affichent pas actuellement :

1. Ouvrez la console du navigateur
2. Cliquez sur le bouton "Debug" sur une image qui échoue
3. Examinez les logs pour voir le `storage_path` et l'URL
4. Vérifiez dans Supabase Dashboard que le fichier existe à ce chemin

---

## 📋 Checklist de Vérification

- [ ] La migration SQL a été exécutée (`20250230_fix_attachments_rls_policies.sql`)
- [ ] Le script de vérification confirme que tout est correct (`20250230_verify_attachments_rls.sql`)
- [ ] Le bucket `attachments` est public dans Supabase Dashboard
- [ ] Les 4 politiques RLS existent et sont actives :
  - [ ] "Anyone can view attachments" (SELECT)
  - [ ] "Authenticated users can upload attachments" (INSERT)
  - [ ] "Users can update their own attachments" (UPDATE)
  - [ ] "Users can delete their own attachments" (DELETE)
- [ ] Les nouveaux uploads fonctionnent (tester avec une nouvelle image)
- [ ] Les logs dans la console montrent des informations détaillées (y compris l'erreur JSON si présente)
- [ ] Les fichiers existent bien dans Supabase Storage (vérifier manuellement)
- [ ] L'UI affiche maintenant les détails de l'erreur JSON si disponible

---

## 🐛 Si le Problème Persiste

### Problème : Les nouveaux uploads fonctionnent mais les anciennes images échouent

**Solution :** Les anciennes images peuvent avoir un `storage_path` incorrect ou être dans un mauvais dossier. Vérifiez manuellement dans Supabase Dashboard et réupload si nécessaire.

### Problème : Toutes les images échouent même après la migration

**Solution :**

1. Vérifiez que la migration a bien créé les politiques (voir les NOTICE dans les logs SQL)
2. Vérifiez que le bucket est bien nommé `attachments` (pas `attachment` ou autre)
3. Essayez de supprimer et recréer la politique "Anyone can view attachments" manuellement dans le Dashboard

### Problème : Erreur 403 dans les logs

**Solution :** Les politiques RLS ne sont pas correctement configurées. Vérifiez dans Supabase Dashboard > Storage > Policies que la politique SELECT existe et est active pour `bucket_id = 'attachments'`.

---

## 📝 Notes Techniques

### Format d'URL Attendu

```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/attachments/[PATH]
```

Où `[PATH]` peut être :

- `vendor-message-attachments/[filename]`
- `message-attachments/[filename]`

### Format de storage_path Attendu

Le `storage_path` stocké en base doit être le chemin relatif dans le bucket :

- ✅ `vendor-message-attachments/1234567890-abc123.png`
- ❌ `/vendor-message-attachments/1234567890-abc123.png` (pas de slash initial)
- ❌ `https://xxx.supabase.co/storage/v1/object/public/attachments/...` (pas l'URL complète)
