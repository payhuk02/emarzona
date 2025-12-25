# 🔍 Guide de Diagnostic Final - Images Non Affichées

## Problème
Les images sont uploadées mais ne s'affichent pas dans l'interface.

## ✅ Corrections Apportées

### 1. Gestion d'erreur améliorée
- **Photo artiste** : Détection automatique des erreurs 403/404
- **Images œuvre** : Détection automatique des erreurs 403/404
- **Retry automatique** : Création d'URL signée si l'URL publique échoue

### 2. Logs détaillés
- Vérification du chemin uploadé vs chemin retourné
- Test d'accessibilité de chaque URL (publique, manuelle, signée)
- Diagnostic complet en cas d'erreur

### 3. Fallback automatique
- Si URL publique ne fonctionne pas → URL manuelle
- Si URL manuelle ne fonctionne pas → URL signée
- Les URLs signées fonctionnent même si RLS bloque l'accès public

## 🧪 Test Manuel de l'URL

### Étape 1 : Récupérer l'URL depuis les logs
1. Ouvrez la console du navigateur (F12)
2. Uploadez une image
3. Cherchez dans les logs : `Photo artiste uploadée avec succès - Résumé`
4. Copiez l'URL dans `finalUrl`

### Étape 2 : Tester l'URL avec le fichier HTML
1. Ouvrez `test_image_url.html` dans votre navigateur
2. Collez l'URL copiée
3. Cliquez sur "Tester l'URL"
4. Analysez les résultats :
   - **Status 200 + Content-Type image/** → ✅ URL valide, problème d'affichage React
   - **Status 403** → ❌ Problème de permissions RLS
   - **Status 404** → ❌ Fichier non trouvé (chemin incorrect)
   - **CORS Error** → ❌ Problème de CORS

### Étape 3 : Tester directement dans le navigateur
1. Copiez l'URL depuis les logs
2. Collez-la dans un nouvel onglet
3. Si l'image s'affiche → Le problème est dans React
4. Si erreur 403/404 → Le problème est dans Supabase Storage

## 🔧 Solutions selon le Diagnostic

### Cas 1 : Status 200 mais image ne s'affiche pas dans React
**Problème** : L'URL est valide mais React ne charge pas l'image

**Solutions** :
1. Vérifier que `data.artist_photo_url` contient bien l'URL
2. Vérifier le localStorage : `JSON.parse(localStorage.getItem('artist-product-draft'))`
3. Vider le cache du navigateur (Ctrl+Shift+Delete)
4. Recharger complètement la page (Ctrl+F5)

### Cas 2 : Status 403 (Forbidden)
**Problème** : Les permissions RLS bloquent l'accès

**Solutions** :
1. Exécuter `fix_rls_immediate.sql` dans Supabase Dashboard
2. Vérifier que le bucket est public :
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
   ```
3. Vérifier les politiques RLS :
   ```sql
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'objects' 
     AND schemaname = 'storage'
     AND policyname LIKE '%product-images%';
   ```

### Cas 3 : Status 404 (Not Found)
**Problème** : Le fichier n'existe pas ou le chemin est incorrect

**Solutions** :
1. Vérifier que le fichier existe dans Supabase Storage :
   - Allez dans Supabase Dashboard → Storage → product-images → artist
   - Cherchez le fichier avec le nom correspondant
2. Vérifier le chemin dans les logs :
   - `Vérification chemin upload` → Compare `fileName` et `uploadDataPath`
   - Si différents, utiliser `uploadDataPath` pour `getPublicUrl()`

### Cas 4 : CORS Error
**Problème** : Problème de CORS entre le navigateur et Supabase

**Solutions** :
1. Vérifier que vous êtes sur le bon domaine
2. Vérifier les headers CORS dans la réponse
3. Utiliser une URL signée (fonctionne même avec CORS)

## 📊 Vérification Complète

### 1. Vérifier les logs après upload
```javascript
// Dans la console, cherchez :
"Photo artiste uploadée avec succès - Résumé"
// Vérifiez :
- pathUsed: doit être "artist/artist-photo_..."
- publicUrlAccessible: true/false
- finalUrlType: "public" / "manual" / "signed"
```

### 2. Vérifier le localStorage
```javascript
// Dans la console :
const draft = JSON.parse(localStorage.getItem('artist-product-draft'));
console.log('artist_photo_url:', draft.artist_photo_url);
console.log('images:', draft.images);
```

### 3. Vérifier Supabase Storage
```sql
-- Dans Supabase SQL Editor :
SELECT 
  name,
  created_at,
  metadata->>'size' as size,
  metadata->>'mimetype' as mimetype
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Tester l'URL directement
1. Copiez l'URL depuis les logs ou localStorage
2. Testez avec `test_image_url.html`
3. Ou collez directement dans un nouvel onglet

## 🚀 Actions Immédiates

1. **Rechargez complètement la page** (Ctrl+F5)
2. **Uploadez une nouvelle image**
3. **Ouvrez la console** (F12) et regardez les logs
4. **Copiez l'URL** depuis `finalUrl` dans les logs
5. **Testez l'URL** avec `test_image_url.html`
6. **Partagez les résultats** :
   - Status code
   - Content-Type
   - Message d'erreur si présent

## 💡 Le Code Fait Maintenant

1. ✅ Teste automatiquement l'accessibilité de l'URL publique
2. ✅ Construit une URL manuelle si nécessaire
3. ✅ Crée une URL signée en fallback
4. ✅ Utilise automatiquement l'URL qui fonctionne
5. ✅ Détecte les erreurs 403/404 et retry avec URL signée
6. ✅ Logs détaillés pour diagnostic

## 📝 Prochaines Étapes

Selon les résultats du test :
- **Si Status 200** → Le problème est dans React, vérifier le code d'affichage
- **Si Status 403** → Exécuter `fix_rls_immediate.sql`
- **Si Status 404** → Vérifier le chemin et que le fichier existe
- **Si CORS** → Utiliser URL signée (déjà implémenté)

Les logs dans la console vous donneront toutes les informations nécessaires pour identifier précisément le problème !










