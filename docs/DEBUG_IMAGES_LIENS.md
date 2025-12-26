# Guide de Débogage : Images Affichées en Lien

**Date :** 30 Janvier 2025  
**Problème :** Les images s'affichent comme des liens au lieu d'images

---

## 🔍 Étapes de Débogage

### 1. Ouvrir la Console du Navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet **Console**
3. Rechargez la page avec les messages

### 2. Vérifier les Logs

Recherchez les logs suivants dans la console :

#### Log 1 : "MediaAttachment - Component render"

Ce log montre toutes les informations de l'attachment :

```javascript
{
  attachmentId: "...",
  fileName: "...",
  fileType: "...",
  mediaType: "image" | "video" | "file", // ⚠️ Vérifier cette valeur
  originalUrl: "...",
  storagePath: "...",
  correctedUrl: "...",
  displayUrl: "...",
  imageError: false,
  triedSignedUrl: false,
  size: "medium"
}
```

**Points à vérifier :**

- ✅ `mediaType` doit être `"image"` (pas `"file"`)
- ✅ `fileName` doit contenir une extension d'image (`.png`, `.jpg`, etc.)
- ✅ `fileType` doit commencer par `"image/"` ou être vide
- ✅ `originalUrl` et `correctedUrl` doivent être des URLs valides

#### Log 2 : "MediaAttachment - Attempting to display image"

Ce log apparaît si le composant essaie d'afficher l'image.

#### Log 3 : "Image loaded successfully"

Ce log apparaît si l'image se charge correctement.

#### Log 4 : "Image load error"

Ce log apparaît si l'image ne peut pas être chargée.

#### Log 5 : "MediaAttachment - Image file detected as generic file"

⚠️ **Ce log indique un problème** : Un fichier avec une extension d'image est détecté comme fichier générique.

---

## 🐛 Problèmes Possibles et Solutions

### Problème 1 : `mediaType` est `"file"` au lieu de `"image"`

**Causes possibles :**

- `file_name` est vide ou ne contient pas d'extension
- `file_type` est vide ou incorrect
- La détection de type échoue

**Solution :**
Vérifier dans la console les valeurs de `fileName` et `fileType` dans le log "MediaAttachment - Component render".

**Exemple de problème :**

```javascript
{
  fileName: "", // ❌ Vide
  fileType: "", // ❌ Vide
  mediaType: "file" // ❌ Détecté comme fichier
}
```

**Correction :**
S'assurer que lors de l'upload, `file_name` et `file_type` sont correctement stockés.

---

### Problème 2 : `imageError` est `true` immédiatement

**Causes possibles :**

- L'URL est invalide
- Le fichier n'existe pas dans le bucket
- Les permissions RLS bloquent l'accès

**Solution :**
Vérifier dans la console :

- Les logs "Image load error"
- Les logs "File existence check"
- Les logs "Could not generate signed URL"

---

### Problème 3 : L'URL n'est pas valide

**Causes possibles :**

- `file_url` stocké dans la base de données est incorrect
- `storage_path` est incorrect
- La correction d'URL ne fonctionne pas

**Solution :**
Vérifier dans la console :

- `originalUrl` : URL stockée dans la base
- `correctedUrl` : URL après correction
- `displayUrl` : URL utilisée pour l'affichage

**Test manuel :**
Copier `displayUrl` depuis les logs et l'ouvrir dans un nouvel onglet pour voir si l'image s'affiche.

---

### Problème 4 : Le fichier n'existe pas dans le bucket

**Causes possibles :**

- L'upload a échoué silencieusement
- Le fichier a été supprimé
- Le chemin est incorrect

**Solution :**

1. Aller dans **Supabase Dashboard** > **Storage** > **attachments**
2. Naviguer dans `vendor-message-attachments/`
3. Vérifier si le fichier existe

**Vérification SQL :**

```sql
SELECT
  id,
  file_name,
  file_url,
  storage_path,
  created_at
FROM vendor_message_attachments
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 Actions Correctives

### Si `mediaType` est `"file"` au lieu de `"image"`

Vérifier que lors de l'upload, les données sont correctement passées :

```typescript
// Dans VendorMessaging.tsx, lors de l'envoi du message
attachments: selectedFiles.map((file, index) => ({
  file_name: file.name, // ✅ Doit contenir le nom avec extension
  file_type: file.type, // ✅ Doit contenir le type MIME (ex: "image/png")
  file_size: file.size,
  file_url: fileUrls[index] || '',
}));
```

### Si l'URL est invalide

Vérifier la génération de l'URL dans `VendorMessaging.tsx` :

```typescript
// L'URL doit être au format :
// https://xxx.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/filename.png
```

### Si le fichier n'existe pas

1. Vérifier que l'upload a réussi (pas d'erreur dans la console)
2. Vérifier dans Supabase Dashboard que le fichier existe
3. Si le fichier n'existe pas, réessayer d'envoyer une nouvelle image

---

## 📊 Checklist de Vérification

- [ ] `mediaType` est `"image"` dans les logs
- [ ] `fileName` contient une extension d'image (`.png`, `.jpg`, etc.)
- [ ] `fileType` commence par `"image/"` ou est vide
- [ ] `originalUrl` est une URL valide
- [ ] `correctedUrl` est une URL valide
- [ ] Le fichier existe dans Supabase Storage
- [ ] Les politiques RLS permettent l'accès public
- [ ] L'URL s'ouvre correctement dans un nouvel onglet

---

## 🧪 Test Rapide

Dans la console du navigateur, exécutez :

```javascript
// Remplacer par les valeurs depuis les logs
const testUrl =
  'https://hbdnzajbyjakdhuavrvb.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/1765207968982-y0xu1n9lneq.png';

// Test 1 : Vérifier si l'URL est accessible
fetch(testUrl, { method: 'HEAD' })
  .then(response => {
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    if (response.ok) {
      console.log("✅ L'URL est accessible");
    } else {
      console.log("❌ L'URL n'est pas accessible");
    }
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
  });

// Test 2 : Créer une image pour tester
const img = new Image();
img.onload = () => console.log('✅ Image chargée avec succès');
img.onerror = () => console.log("❌ Erreur de chargement de l'image");
img.src = testUrl;
```

---

## 📝 Informations à Fournir pour le Débogage

Si le problème persiste, fournir :

1. **Logs de la console** :
   - "MediaAttachment - Component render"
   - "MediaAttachment - Attempting to display image" (ou son absence)
   - "Image load error" (si présent)

2. **Valeurs des variables** :
   - `fileName`
   - `fileType`
   - `mediaType`
   - `originalUrl`
   - `correctedUrl`

3. **Résultat du test rapide** :
   - Status de la requête HEAD
   - Résultat du test d'image

4. **Vérification Supabase** :
   - Le fichier existe-t-il dans le bucket ?
   - Les politiques RLS sont-elles correctes ?

---

## ✅ Solution Attendu

Après ces vérifications, les images devraient s'afficher correctement. Si le problème persiste, les logs permettront d'identifier la cause exacte.
