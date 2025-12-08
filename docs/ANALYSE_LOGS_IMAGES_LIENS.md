# Analyse des Logs : Images Affichées en Lien

**Date :** 30 Janvier 2025  
**Problème :** Les images s'affichent comme des liens malgré la génération d'URLs signées

---

## 📊 Analyse des Logs

### Séquence d'Événements Observée

1. **"Failed to load resource"** - L'URL publique échoue (erreur 400)
2. **"File existence check"** - Le fichier est vérifié dans le bucket
3. **"Generated signed URL"** - Une URL signée est générée avec succès
4. **"MediaAttachment - Displaying fallback link"** - Mais finalement un lien est affiché

### Problème Identifié

Même si l'URL signée est générée avec succès, le composant affiche quand même un lien de secours. Cela indique que :

1. ✅ Le fichier existe dans le bucket
2. ✅ L'URL signée est générée correctement
3. ❌ Mais l'image ne se recharge pas avec l'URL signée
4. ❌ Le composant affiche un lien au lieu d'une image

---

## 🔍 Causes Possibles

### 1. Le Re-render ne se fait pas correctement

Quand `setSignedUrl()` est appelé, React devrait re-rendre le composant avec la nouvelle URL. Mais peut-être que :
- Le re-render ne se déclenche pas
- L'image ne se recharge pas avec la nouvelle URL
- L'état `imageError` reste à `true`

### 2. L'URL signée échoue aussi

Même si l'URL signée est générée, elle peut échouer au chargement si :
- Le token est invalide
- Les permissions RLS bloquent toujours l'accès
- L'URL signée a un format incorrect

### 3. La Logique d'Affichage est Défectueuse

La condition `if (imageError && triedSignedUrl)` peut être vraie même si l'URL signée est générée, si :
- `imageError` n'est pas réinitialisé à `false`
- Le re-render se fait avant que `imageError` soit réinitialisé

---

## ✅ Corrections Appliquées

### 1. Ajout d'une clé sur l'image

```typescript
<img
  key={displayUrl} // Force le re-render quand l'URL change
  src={displayUrl}
  ...
/>
```

Cela force React à créer une nouvelle instance de l'image quand `displayUrl` change.

### 2. Réinitialisation de `imageError`

```typescript
if (!signedUrlError && signedUrlData?.signedUrl) {
  setSignedUrl(signedUrlData.signedUrl);
  setImageError(false); // Réinitialiser l'erreur
  setIsLoading(false);
  return; // Le re-render affichera l'image avec la nouvelle URL
}
```

### 3. Réinitialisation dans `onLoad`

```typescript
onLoad={() => {
  setIsLoading(false);
  setImageError(false); // Réinitialiser si l'image se charge
  ...
}}
```

---

## 🧪 Test à Effectuer

1. **Recharger la page** avec les messages
2. **Vérifier dans la console** :
   - "Generated signed URL" doit apparaître
   - "MediaAttachment - Attempting to display image" doit apparaître APRÈS la génération de l'URL signée
   - "Image loaded successfully" doit apparaître si l'image se charge

3. **Si "Displaying fallback link" apparaît toujours** :
   - Vérifier que l'URL signée est vraiment générée (dans les logs)
   - Tester l'URL signée directement dans un nouvel onglet
   - Vérifier les permissions RLS du bucket

---

## 🔧 Prochaines Étapes si le Problème Persiste

1. **Vérifier les permissions RLS** :
   - Le bucket `attachments` doit être public
   - La politique "Anyone can view attachments" doit être active

2. **Tester l'URL signée manuellement** :
   - Copier l'URL signée depuis les logs
   - L'ouvrir dans un nouvel onglet
   - Vérifier si l'image s'affiche

3. **Vérifier le format de l'URL signée** :
   - Doit être au format : `https://xxx.supabase.co/storage/v1/object/sign/attachments/...?token=...`
   - Le token doit être valide

---

## 📝 Logs Attendus (Succès)

```
[INFO] MediaAttachment - Component render
[INFO] MediaAttachment - Attempting to display image
[WARN] Failed to load resource (URL publique)
[INFO] File existence check (exists: true)
[INFO] Generated signed URL
[INFO] MediaAttachment - Component render (avec signedUrl)
[INFO] MediaAttachment - Attempting to display image (avec signedUrl)
[INFO] Image loaded successfully ✅
```

---

## 📝 Logs Actuels (Échec)

```
[INFO] MediaAttachment - Component render
[INFO] MediaAttachment - Attempting to display image
[WARN] Failed to load resource (URL publique)
[INFO] File existence check (exists: true)
[INFO] Generated signed URL
[WARN] MediaAttachment - Displaying fallback link ❌
```

Le problème est que "Displaying fallback link" apparaît au lieu de "Attempting to display image" avec l'URL signée.

