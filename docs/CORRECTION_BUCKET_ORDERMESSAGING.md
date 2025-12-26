# Correction du Bucket Incorrect dans OrderMessaging

**Date :** 30 Janvier 2025  
**Problème :** Bucket incorrect dans `OrderMessaging.tsx`  
**Statut :** ✅ **CORRIGÉ**

---

## 🔴 Problème Identifié

Dans `src/pages/orders/OrderMessaging.tsx`, la fonction `uploadFiles` utilisait le bucket `message-attachments` au lieu du bucket standardisé `attachments`.

### Impact

- Les fichiers uploadés dans `OrderMessaging` n'étaient pas accessibles via le composant `MediaAttachment`
- Inconsistance avec les autres systèmes de messagerie qui utilisent tous le bucket `attachments`
- Risque d'erreurs d'affichage des images et fichiers dans les messages de commande

---

## ✅ Correction Appliquée

### Fichier Modifié

**`src/pages/orders/OrderMessaging.tsx`**

### Changements

**Avant :**

```typescript
const { data, error } = await supabase.storage
  .from('message-attachments') // ❌ Bucket incorrect
  .upload(filePath, file);

const {
  data: { publicUrl },
} = supabase.storage
  .from('message-attachments') // ❌ Bucket incorrect
  .getPublicUrl(filePath);
```

**Après :**

```typescript
const { data, error } = await supabase.storage
  .from('attachments') // ✅ Bucket correct
  .upload(filePath, file);

const {
  data: { publicUrl },
} = supabase.storage
  .from('attachments') // ✅ Bucket correct
  .getPublicUrl(filePath);
```

### Lignes Modifiées

- **Ligne 159** : `.from('message-attachments')` → `.from('attachments')`
- **Ligne 165** : `.from('message-attachments')` → `.from('attachments')`

---

## ✅ Vérifications

### 1. Hook useMessaging.ts

Le hook `useMessaging.ts` (utilisé par `OrderMessaging`) utilise déjà le bon bucket `attachments` :

- ✅ Ligne 322 : `.from('attachments')`
- ✅ Ligne 329 : `.from('attachments')`

### 2. Cohérence avec les Autres Systèmes

Tous les systèmes de messagerie utilisent maintenant le bucket `attachments` :

- ✅ `VendorMessaging.tsx` → `attachments`
- ✅ `OrderMessaging.tsx` → `attachments` (corrigé)
- ✅ `ConversationComponent.tsx` → `attachments` (via `useMessaging`)
- ✅ `ShippingServiceMessages.tsx` → `attachments`
- ✅ `DisputeDetail.tsx` → `attachments`

### 3. Linter

✅ Aucune erreur de linter détectée

---

## 🧪 Tests Recommandés

1. **Test d'Upload** :
   - Ouvrir une conversation de commande dans `OrderMessaging`
   - Uploader une image
   - Vérifier que l'image s'affiche correctement via `MediaAttachment`

2. **Test d'Affichage** :
   - Vérifier que les images existantes s'affichent toujours correctement
   - Vérifier que les nouvelles images uploadées s'affichent immédiatement

3. **Test de Cohérence** :
   - Vérifier que les fichiers sont bien stockés dans le bucket `attachments`
   - Vérifier que les URLs générées sont accessibles publiquement

---

## 📝 Notes

- Le chemin de stockage reste `messages/{orderId}/{fileName}` pour maintenir l'organisation par commande
- Le bucket `attachments` est configuré comme public, donc les URLs publiques fonctionnent correctement
- Les politiques RLS du bucket `attachments` permettent l'upload et la lecture pour les utilisateurs authentifiés

---

## ✅ Statut Final

**Problème :** ✅ **RÉSOLU**  
**Tests :** ⏳ À effectuer par l'utilisateur  
**Impact :** ✅ Aucun impact négatif, correction transparente

---

**Date de correction :** 30 Janvier 2025  
**Corrigé par :** Auto (Cursor AI)
