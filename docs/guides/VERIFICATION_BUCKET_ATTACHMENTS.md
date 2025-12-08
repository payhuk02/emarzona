# Guide : Vérification du Bucket "attachments"

## 🔍 Vérification dans Supabase Dashboard

### 1. Vérifier que le bucket existe

1. Allez dans **Supabase Dashboard** > **Storage**
2. Vérifiez que le bucket **"attachments"** est présent dans la liste
3. Vérifiez que le bucket est marqué comme **Public** (icône de globe)

### 2. Vérifier les fichiers uploadés

1. Cliquez sur le bucket **"attachments"**
2. Naviguez dans le dossier `vendor-message-attachments/`
3. Vérifiez que les fichiers sont bien présents (ex: `1765207968982-y0xu1n9lneq.png`)

### 3. Vérifier les politiques RLS

1. Allez dans **Storage** > **Policies**
2. Vérifiez que les politiques suivantes existent pour le bucket "attachments" :
   - **"Anyone can view attachments"** (SELECT) - Doit être active
   - **"Authenticated users can upload attachments"** (INSERT)
   - **"Users can update their own attachments"** (UPDATE)
   - **"Users can delete their own attachments"** (DELETE)

### 4. Tester l'URL directement

Dans la console du navigateur, testez l'URL directement :

```javascript
// Remplacer par votre URL Supabase
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const filePath = 'vendor-message-attachments/1765207968982-y0xu1n9lneq.png';
const testUrl = `${supabaseUrl}/storage/v1/object/public/attachments/${filePath}`;

// Tester dans la console
fetch(testUrl)
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    return response.blob();
  })
  .then(blob => {
    console.log('File loaded successfully, size:', blob.size);
  })
  .catch(error => {
    console.error('Error loading file:', error);
  });
```

## 🔧 Solutions possibles

### Solution 1 : Vérifier que le fichier existe

Si le fichier n'existe pas dans le bucket :
- Le fichier n'a peut-être pas été uploadé correctement
- Vérifiez les logs d'upload dans la console
- Réessayez d'envoyer une nouvelle image

### Solution 2 : Vérifier les permissions RLS

Si les politiques RLS ne sont pas correctes :
1. Allez dans **Storage** > **Policies**
2. Supprimez les anciennes politiques
3. Réexécutez la migration `20250230_create_attachments_storage_bucket.sql`

### Solution 3 : Vérifier l'URL

Si l'URL est incorrecte :
- Vérifiez que `VITE_SUPABASE_URL` est correctement configuré
- Vérifiez que le chemin du fichier est correct
- Les logs dans la console devraient montrer l'URL corrigée

## 📝 Requête SQL pour vérifier les attachments

```sql
-- Vérifier les attachments récents
SELECT 
  id,
  message_id,
  file_name,
  file_type,
  file_url,
  storage_path,
  created_at
FROM vendor_message_attachments
ORDER BY created_at DESC
LIMIT 10;
```

## 🔍 Vérification dans la console

Après le rechargement de la page, vérifiez dans la console :
1. Les logs "Corrected file URL:" pour voir l'URL corrigée
2. Les logs "Image load error:" pour voir pourquoi l'image ne charge pas
3. Les logs "File existence check:" pour voir si le fichier existe

