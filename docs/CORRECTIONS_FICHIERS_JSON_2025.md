# Corrections - Fichiers retournant du JSON au lieu d'images

**Date :** 2 Février 2025  
**Statut :** ✅ **CORRECTIONS APPLIQUÉES**

---

## 🔴 Problème Identifié

Les images dans les messages retournent une erreur HTTP 400 avec `Content-Type: application/json` au lieu d'une image. Même les URLs signées générées avec succès retournent du JSON lors du chargement.

**Symptômes :**

- Les URLs signées sont générées avec succès (`✅ Signed URL generated successfully`)
- Mais le chargement de l'URL signée échoue avec HTTP 400
- Le serveur retourne du JSON au lieu d'une image
- Message d'erreur : "Le serveur retourne du JSON au lieu d'une image"

**Causes possibles :**

1. Les fichiers n'existent pas réellement dans le bucket au chemin spécifié
2. Le `storage_path` stocké en base ne correspond pas au chemin réel dans le bucket
3. Les fichiers ont été supprimés ou déplacés après l'upload
4. Problème avec les politiques RLS qui retournent une erreur JSON au lieu de bloquer l'accès

---

## ✅ Corrections Appliquées

### 1. Amélioration de la fonction `checkFileExists`

**Fichier :** `src/utils/diagnoseStorageFiles.ts`

**Changements :**

- Vérification du `Content-Type` lors du chargement de l'URL signée
- Détection automatique du JSON retourné au lieu d'une image
- Essai avec `GET` si `HEAD` échoue pour obtenir plus d'informations
- Analyse de la réponse JSON pour extraire le message d'erreur

**Code ajouté :**

```typescript
// Vérifier aussi le Content-Type pour s'assurer que c'est bien une image
const contentType = response.headers.get('content-type') || '';
if (contentType.includes('application/json')) {
  // Si le serveur retourne du JSON, le fichier n'existe probablement pas
  return {
    exists: false,
    error: "Le serveur retourne du JSON au lieu d'une image (fichier introuvable)",
  };
}
```

---

### 2. Amélioration de la logique de diagnostic

**Fichier :** `src/utils/diagnoseStorageFiles.ts`

**Changements :**

- Vérification que l'URL signée fonctionne réellement (pas seulement générée)
- Test du chargement de l'URL signée avec vérification du Content-Type
- Détection des fichiers avec URLs signées générées mais retournant du JSON

**Code ajouté :**

```typescript
// Vérifier que l'URL signée fonctionne réellement
try {
  const testResponse = await fetch(signData.signedUrl, { method: 'HEAD', cache: 'no-cache' });
  if (!testResponse.ok || testResponse.headers.get('content-type')?.includes('application/json')) {
    canGenerateSignedUrl = false;
    signedUrlError = `URL signée générée mais retourne ${testResponse.status} ou JSON`;
  }
} catch (fetchErr: any) {
  canGenerateSignedUrl = false;
  signedUrlError = `Erreur lors du test de l'URL signée: ${fetchErr.message}`;
}
```

---

### 3. Amélioration de la logique de détermination d'existence

**Fichier :** `src/utils/diagnoseStorageFiles.ts`

**Changements :**

- Un fichier est considéré comme existant seulement si :
  1. `checkFileExists` retourne `exists: true`
  2. ET l'URL signée peut être générée
  3. ET l'URL signée fonctionne réellement (retourne une image, pas du JSON)

**Code ajouté :**

```typescript
// Si checkFileExists dit que le fichier existe mais que l'URL signée ne fonctionne pas,
// considérer le fichier comme manquant
const actuallyExists = exists && canGenerateSignedUrl;

if (actuallyExists) {
  existingCount++;
} else {
  missingCount++;
}
```

---

### 4. Amélioration des recommandations

**Fichier :** `src/utils/diagnoseStorageFiles.ts`

**Changements :**

- Ajout de recommandations spécifiques pour les fichiers avec URLs signées mais retournant du JSON
- Comptage des fichiers avec problèmes d'URL signée

**Code ajouté :**

```typescript
if (filesWithSignedUrlIssues > 0) {
  recommendations.push(
    `⚠️ ${filesWithSignedUrlIssues} fichier(s) ont des URLs signées générées mais retournent du JSON (fichiers introuvables)`
  );
}
```

---

## 🔍 Diagnostic Amélioré

Le diagnostic vérifie maintenant :

1. ✅ Si une URL signée peut être générée
2. ✅ Si l'URL signée fonctionne réellement (HEAD request)
3. ✅ Si le Content-Type est correct (pas de JSON)
4. ✅ Si le fichier peut être chargé (GET request si HEAD échoue)

---

## 📊 Résultats Attendus

Après ces corrections, le diagnostic devrait :

- Détecter correctement les fichiers qui retournent du JSON
- Marquer ces fichiers comme "manquants" même si l'URL signée est générée
- Fournir des recommandations spécifiques pour ces cas

---

## 🚀 Prochaines Étapes Recommandées

1. **Relancer le diagnostic** pour voir les fichiers réellement manquants
2. **Vérifier dans Supabase Dashboard** que les fichiers existent aux chemins indiqués
3. **Nettoyer les entrées invalides** si les fichiers n'existent pas
4. **Vérifier le processus d'upload** pour s'assurer que les fichiers sont bien sauvegardés

---

**Statut final :** ✅ Corrections appliquées. Le diagnostic devrait maintenant détecter correctement les fichiers qui retournent du JSON.
