# Audit Complet et Corrections - Système de Messaging et Images

**Date :** 2 Février 2025  
**Statut :** ✅ **CORRECTIONS APPLIQUÉES**

---

## 🔴 Problèmes Identifiés

### 1. Erreur `column profiles.name does not exist`

**Erreur :**

```
ERROR: column profiles.name does not exist
Code: 42703
```

**Cause :** La table `profiles` utilise `display_name` et non `name`.

**Fichier affecté :** `src/hooks/useVendorMessaging.ts`

**Correction appliquée :**

- ✅ Changé `.select("user_id, name, avatar_url")` → `.select("user_id, display_name, avatar_url")`
- ✅ Changé `profile.name` → `profile.display_name || profile.first_name || 'Utilisateur'`

---

### 2. Erreurs HTTP 400 pour toutes les images

**Erreur :**

```
Failed to load resource: the server responded with a status of 400 ()
Content-Type: application/json; charset=utf-8
```

**Causes possibles :**

1. Les fichiers n'existent pas dans le bucket au chemin spécifié
2. Le `storage_path` stocké en base ne correspond pas au chemin réel dans le bucket
3. Les fichiers ont été supprimés ou déplacés

**Observations :**

- Les fichiers dans `vendor-message-attachments/{conversation_id}/filename.png` génèrent parfois des URLs signées avec succès
- Les fichiers directement dans `vendor-message-attachments/filename.png` échouent toujours
- Même les URLs signées retournent HTTP 400 pour certains fichiers

**Corrections appliquées :**

- ✅ Amélioration du logging pour diagnostiquer les erreurs
- ✅ Détection automatique des fichiers introuvables
- ✅ Messages d'erreur plus explicites

**Fichiers modifiés :**

- `src/hooks/useMediaErrorHandler.ts` : Amélioration du diagnostic

---

### 3. Erreur `messagesTopRef is not defined`

**Erreur :**

```
ReferenceError: messagesTopRef is not defined
at VendorMessaging.tsx:103:28
```

**Cause :** Référence utilisée mais non déclarée.

**Correction appliquée :**

- ✅ Ajout de `const messagesTopRef = useRef<HTMLDivElement>(null);`
- ✅ Ajout du div avec la ref dans le JSX

**Fichier modifié :** `src/pages/vendor/VendorMessaging.tsx`

---

### 4. Erreur 400 lors de la récupération des profils

**Erreur :**

```
Failed to load resource: the server responded with a status of 400 ()
GET /rest/v1/profiles?select=user_id%2Cname%2Cavatar_url&user_id=in.(...)
```

**Cause :** Colonne `name` inexistante + trop d'IDs dans la requête.

**Corrections appliquées :**

- ✅ Changé `name` → `display_name`
- ✅ Limité à 50 IDs au lieu de 100
- ✅ Validation des UUIDs avant la requête

**Fichier modifié :** `src/hooks/useVendorMessaging.ts`

---

## ✅ Corrections Appliquées

### 1. Correction de la colonne `profiles.name`

**Fichier :** `src/hooks/useVendorMessaging.ts`

**Avant :**

```typescript
.select("user_id, name, avatar_url")
// ...
name: profile.name,
```

**Après :**

```typescript
.select("user_id, display_name, avatar_url")
// ...
name: profile.display_name || profile.first_name || 'Utilisateur',
```

---

### 2. Amélioration du diagnostic des erreurs HTTP 400

**Fichier :** `src/hooks/useMediaErrorHandler.ts`

**Ajouts :**

- Détection automatique des fichiers introuvables (404, "not found", "does not exist")
- Messages d'erreur plus explicites avec suggestions
- Logging amélioré avec tous les détails nécessaires

**Code ajouté :**

```typescript
const isFileNotFound =
  signedUrlError?.message?.toLowerCase().includes('not found') ||
  signedUrlError?.message?.toLowerCase().includes('does not exist') ||
  signedUrlError?.code === '404' ||
  signedUrlError?.status === 404;

// Message d'erreur personnalisé
onError?.(
  new Error(
    isFileNotFound
      ? `Fichier introuvable dans le bucket: ${path}. Le fichier a peut-être été supprimé ou le chemin est incorrect.`
      : signedUrlError?.message || 'Impossible de générer une URL signée.'
  )
);
```

---

### 3. Correction de `messagesTopRef`

**Fichier :** `src/pages/vendor/VendorMessaging.tsx`

**Ajouts :**

```typescript
const messagesTopRef = useRef<HTMLDivElement>(null);
// ...
<div ref={messagesTopRef} />
```

---

## 🔍 Diagnostic Recommandé

### Pour les fichiers introuvables (HTTP 400)

1. **Vérifier dans Supabase Dashboard :**
   - Aller dans Storage → `attachments` bucket
   - Vérifier que les fichiers existent aux chemins indiqués dans les logs
   - Comparer le `storage_path` en base avec le chemin réel dans le bucket

2. **Vérifier les logs de la console :**
   - Chercher `🔍 Attempting to generate signed URL`
   - Vérifier le `path` utilisé
   - Vérifier si `isFileNotFound` est `true`

3. **Actions possibles :**
   - Si les fichiers n'existent pas : Les supprimer de la base de données ou les ré-uploader
   - Si le chemin est incorrect : Corriger le `storage_path` en base de données
   - Si les fichiers ont été déplacés : Mettre à jour les `storage_path` en base

---

## 📊 Résumé des Fichiers Modifiés

1. ✅ `src/hooks/useVendorMessaging.ts`
   - Correction `profiles.name` → `profiles.display_name`
   - Amélioration de la gestion d'erreur pour les profils

2. ✅ `src/hooks/useMediaErrorHandler.ts`
   - Amélioration du diagnostic des erreurs HTTP 400
   - Détection automatique des fichiers introuvables
   - Logging amélioré

3. ✅ `src/pages/vendor/VendorMessaging.tsx`
   - Correction `messagesTopRef is not defined`

---

## 🚀 Prochaines Étapes Recommandées

1. **Vérifier l'existence des fichiers dans Supabase Storage**
   - Comparer les `storage_path` en base avec les fichiers réels
   - Supprimer ou corriger les entrées avec fichiers introuvables

2. **Améliorer le processus d'upload**
   - S'assurer que tous les fichiers sont uploadés avec le bon chemin
   - Vérifier que le `storage_path` stocké correspond exactement au chemin dans le bucket

3. **Ajouter une validation**
   - Vérifier l'existence du fichier après l'upload
   - Valider le `storage_path` avant de le stocker en base

---

## 📝 Notes

- Les fichiers dans `vendor-message-attachments/{conversation_id}/filename.png` semblent fonctionner mieux que ceux directement dans `vendor-message-attachments/filename.png`
- Les URLs signées sont générées avec succès pour certains fichiers, mais retournent toujours HTTP 400 lors du chargement
- Cela suggère que les fichiers n'existent pas dans le bucket, même si les URLs signées sont générées

---

**Statut final :** ✅ Toutes les corrections de code appliquées. Le problème principal (fichiers introuvables) nécessite une vérification manuelle dans Supabase Dashboard.
