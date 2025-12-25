# 🔍 GUIDE DE DIAGNOSTIC - PROBLÈME D'AFFICHAGE DES IMAGES

**Date** : 30 Janvier 2025  
**Problème** : Les images uploadées ne s'affichent pas malgré l'exécution du script SQL

---

## 📋 ÉTAPES DE DIAGNOSTIC

### Étape 1 : Exécuter le script de diagnostic

1. **Dans Supabase Dashboard** → **SQL Editor**
2. **Ouvrez le fichier** : `diagnostic_product_images_permissions.sql`
3. **Exécutez le script** pour voir l'état actuel

Le script vous montrera :
- ✅ Si le bucket est public
- ✅ Quelles politiques RLS existent
- ✅ Les fichiers dans le dossier `artist/`
- ✅ Si les permissions sont correctes

### Étape 2 : Vérifier les résultats

#### Résultat attendu pour le bucket :
```sql
id: product-images
name: product-images
public: true  ← DOIT ÊTRE true
```

#### Résultat attendu pour les politiques :
Vous devriez voir **4 politiques** :
1. `product-images - Upload authenticated` (INSERT)
2. `product-images - Public read access` (SELECT) ← CRITIQUE
3. `product-images - Update authenticated` (UPDATE)
4. `product-images - Delete authenticated` (DELETE)

### Étape 3 : Vérifier manuellement dans le Dashboard

1. **Storage** → **product-images** → **Settings**
   - ✅ **"Public bucket"** doit être **activé**
   - Si non, activez-le et sauvegardez

2. **Storage** → **Policies**
   - Filtrez par bucket : `product-images`
   - Vérifiez qu'il y a une politique **SELECT** pour **public**

3. **Storage** → **product-images** → **artist/**
   - Vérifiez que vos fichiers uploadés sont visibles
   - Cliquez sur un fichier pour voir son URL publique

### Étape 4 : Tester l'URL directement

1. **Copiez l'URL de l'image** depuis :
   - Les logs de la console du navigateur
   - Ou depuis Supabase Dashboard → Storage → fichier → URL publique

2. **Ouvrez l'URL dans un nouvel onglet** du navigateur

3. **Résultats possibles** :
   - ✅ **Image s'affiche** → Les permissions sont correctes, problème côté code
   - ❌ **403 Forbidden** → Permissions incorrectes, exécutez le script de correction
   - ❌ **404 Not Found** → Le fichier n'existe pas, problème d'upload

---

## 🔧 CORRECTIONS POSSIBLES

### Si le bucket n'est pas public :

1. **Dans Supabase Dashboard** :
   - **Storage** → **product-images** → **Settings**
   - Activez **"Public bucket"**
   - Sauvegardez

2. **Ou exécutez ce SQL** :
```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';
```

### Si les politiques n'existent pas ou sont incorrectes :

1. **Exécutez le script de correction** : `fix_product_images_permissions.sql`
2. **Vérifiez avec le script de diagnostic** que les politiques existent
3. **Si le problème persiste**, exécutez ce SQL manuellement :

```sql
-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Update authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product-images - Delete authenticated" ON storage.objects;

-- Créer les politiques correctes
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images - Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product-images - Update authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images - Delete authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

### Si l'URL ne fonctionne pas dans le navigateur :

1. **Vérifiez le format de l'URL** :
   - Doit commencer par : `https://[project].supabase.co/storage/v1/object/public/product-images/`
   - Doit contenir le chemin : `artist/filename.ext`

2. **Vérifiez que le fichier existe** :
   - Dans Supabase Dashboard → Storage → product-images → artist/
   - Cherchez le nom du fichier

3. **Si le fichier n'existe pas** :
   - L'upload a peut-être échoué
   - Réessayez d'uploader l'image

---

## 🐛 DIAGNOSTIC AVANCÉ

### Vérifier les logs Supabase

1. **Dans Supabase Dashboard** → **Logs** → **Storage**
2. **Cherchez les erreurs** liées à `product-images`
3. **Vérifiez les tentatives d'accès** aux fichiers

### Vérifier les logs du navigateur

1. **Ouvrez les DevTools** (F12)
2. **Onglet Console** :
   - Cherchez les erreurs liées à l'image
   - Vérifiez l'URL de l'image dans les logs

3. **Onglet Network** :
   - Filtrez par **Img**
   - Cliquez sur la requête de l'image
   - Vérifiez le **Status Code** :
     - **200** = Image accessible ✅
     - **403** = Permissions refusées ❌
     - **404** = Fichier non trouvé ❌

### Tester avec curl (optionnel)

```bash
# Remplacer [URL] par l'URL de votre image
curl -I [URL]

# Résultats attendus :
# HTTP/2 200 → Image accessible ✅
# HTTP/2 403 → Permissions refusées ❌
# HTTP/2 404 → Fichier non trouvé ❌
```

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Le bucket `product-images` existe
- [ ] Le bucket est configuré comme **public** (vérifié avec le script de diagnostic)
- [ ] La politique **SELECT** pour **public** existe (vérifiée avec le script de diagnostic)
- [ ] Les fichiers dans `artist/` sont visibles dans le dashboard
- [ ] Les URLs publiques des fichiers sont accessibles dans le navigateur (test manuel)
- [ ] L'image s'affiche correctement dans le formulaire après upload
- [ ] Pas d'erreur 403 dans la console du navigateur
- [ ] Pas d'erreur 404 dans la console du navigateur

---

## 🚨 SI LE PROBLÈME PERSISTE

### Option 1 : Vérifier les CORS

Si les images ne se chargent toujours pas, vérifiez les paramètres CORS de Supabase Storage.

### Option 2 : Contacter le support Supabase

Si toutes les vérifications sont correctes mais que le problème persiste, contactez le support Supabase avec :
- L'URL de l'image qui ne fonctionne pas
- Les résultats du script de diagnostic
- Les logs d'erreur du navigateur

### Option 3 : Solution temporaire - Utiliser un proxy

En dernier recours, vous pouvez créer un proxy côté serveur pour servir les images, mais cela n'est pas recommandé pour la production.

---

## 📝 FICHIERS CRÉÉS

- ✅ `diagnostic_product_images_permissions.sql` - Script de diagnostic
- ✅ `fix_product_images_permissions.sql` - Script de correction (mis à jour)
- ✅ `GUIDE_DIAGNOSTIC_IMAGES.md` - Ce guide

---

**Prochaine étape** : Exécutez le script de diagnostic pour identifier le problème exact.










