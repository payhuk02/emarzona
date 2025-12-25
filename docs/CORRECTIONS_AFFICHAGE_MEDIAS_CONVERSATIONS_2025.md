# Corrections - Affichage des Médias dans les Conversations

**Date :** 2 Février 2025  
**Statut :** ✅ **CORRECTIONS APPLIQUÉES**

---

## 🔴 Problème Identifié

Les images dans les conversations retournent une erreur HTTP 200 avec `Content-Type: application/json` au lieu d'une image, ce qui empêche l'affichage correct des médias dans les messages.

**Symptômes :**
- Les images ne s'affichent pas dans les conversations
- Message d'erreur : "Le serveur retourne du JSON au lieu d'une image"
- Erreur HTTP 200 (succès mais mauvais Content-Type)
- Les fichiers n'existent pas dans le bucket au chemin spécifié

**Causes :**
1. Les fichiers référencés en base de données n'existent pas réellement dans le bucket `attachments`
2. Le `storage_path` stocké ne correspond pas au chemin réel dans le bucket
3. Les fichiers ont été supprimés ou déplacés après l'upload
4. Les politiques RLS retournent une erreur JSON au lieu de bloquer l'accès

---

## ✅ Corrections Appliquées

### 1. Amélioration de la détection précoce du JSON

**Fichier :** `src/components/media/MediaAttachment.tsx`

**Changements :**
- Ajout d'un `useEffect` qui vérifie immédiatement si l'URL retourne du JSON avant même le chargement de l'image
- Utilise une requête `HEAD` pour vérifier le `Content-Type` sans charger tout le fichier
- Si du JSON est détecté, essaie immédiatement une URL signée

**Code ajouté :**
```typescript
// Vérifier immédiatement si l'URL retourne du JSON avant même le chargement
useEffect(() => {
  if (!errorState.triedSignedUrl && displayUrl && !errorState.isLoading && !errorState.hasError) {
    const checkUrl = async () => {
      try {
        const response = await fetch(displayUrl, { method: 'HEAD', cache: 'no-cache' });
        const contentType = response.headers.get('content-type') || '';
        
        // Si c'est du JSON, essayer immédiatement l'URL signée
        if (response.ok && contentType.includes('application/json')) {
          await analyzeErrorResponse(displayUrl);
          await handleError();
        }
      } catch {
        // Ignorer les erreurs de fetch
      }
    };
    
    const timeoutId = setTimeout(checkUrl, 100);
    return () => clearTimeout(timeoutId);
  }
}, [displayUrl, errorState.triedSignedUrl, errorState.isLoading, errorState.hasError, analyzeErrorResponse, handleError]);
```

---

### 2. Amélioration de la gestion des erreurs dans `useMediaErrorHandler`

**Fichier :** `src/hooks/useMediaErrorHandler.ts`

**Changements :**
- Amélioration de la logique de `handleError` pour mieux gérer les cas où l'URL signée échoue aussi
- Vérification du résultat de `trySignedUrl()` pour déterminer si toutes les tentatives ont échoué
- Meilleure gestion des cas où le fichier n'existe pas (même avec URL signée)

**Code modifié :**
```typescript
// Si on reçoit du JSON au lieu d'une image (HTTP 200 avec Content-Type JSON)
// Essayer immédiatement avec URL signée
if (state.errorStatus === 200 && state.contentType && state.contentType.includes('application/json')) {
  if (!state.triedSignedUrl) {
    const signedUrl = await trySignedUrl();
    // Si l'URL signée échoue aussi, le fichier n'existe probablement pas
    if (!signedUrl) {
      setState(prev => ({
        ...prev,
        allAttemptsFailed: true,
        hasError: true,
      }));
    }
    return;
  }
}
```

---

### 3. Amélioration de l'affichage des erreurs

**Fichier :** `src/components/media/MediaAttachment.tsx`

**Changements :**
- Amélioration de l'affichage de l'erreur pour être plus clair et informatif
- Ajout d'un message explicatif quand le fichier retourne du JSON
- Meilleure structure visuelle de l'overlay d'erreur

**Code modifié :**
```typescript
{errorState.errorStatus === 200 && errorState.contentType && !errorState.contentType.startsWith('image/') && (
  <div className="flex flex-col items-center gap-1 mt-1">
    <span className="text-[10px] text-destructive font-medium">
      ⚠️ Le serveur retourne {errorState.contentType.includes('html') ? 'du HTML' : errorState.contentType.includes('json') ? 'du JSON' : errorState.contentType} au lieu d'une image
    </span>
    {errorState.contentType.includes('json') && (
      <span className="text-[9px] text-muted-foreground text-center max-w-[200px]">
        Le fichier n'existe probablement pas dans le bucket
      </span>
    )}
  </div>
)}
```

---

## 🔍 Flux de Détection et Correction

1. **Chargement initial** : Le composant essaie d'afficher l'image avec l'URL publique
2. **Vérification précoce** : Un `useEffect` vérifie immédiatement si l'URL retourne du JSON (requête HEAD)
3. **Détection JSON** : Si du JSON est détecté, `analyzeErrorResponse` est appelé pour mettre à jour l'état
4. **Tentative URL signée** : `handleError` est appelé pour essayer une URL signée
5. **Si l'URL signée échoue** : L'overlay d'erreur s'affiche avec un message clair
6. **Fallback** : Si toutes les tentatives échouent, un message d'erreur informatif est affiché

---

## 📊 Résultats Attendus

Après ces corrections :
- ✅ Détection précoce du JSON avant le chargement de l'image
- ✅ Tentative automatique avec URL signée si du JSON est détecté
- ✅ Affichage clair de l'erreur si le fichier n'existe pas
- ✅ Meilleure expérience utilisateur avec des messages d'erreur informatifs

---

## 🚀 Prochaines Étapes Recommandées

1. **Nettoyer les entrées invalides** : Utiliser le diagnostic storage pour supprimer les fichiers manquants
2. **Vérifier les uploads** : S'assurer que les fichiers sont bien sauvegardés lors de l'upload
3. **Vérifier les chemins** : S'assurer que le `storage_path` correspond au chemin réel dans le bucket
4. **Vérifier les politiques RLS** : S'assurer que les politiques permettent l'accès public en lecture

---

**Statut final :** ✅ Corrections appliquées. Le système détecte maintenant précocement les fichiers qui retournent du JSON et essaie automatiquement une URL signée. Si le fichier n'existe pas, un message d'erreur clair est affiché.

