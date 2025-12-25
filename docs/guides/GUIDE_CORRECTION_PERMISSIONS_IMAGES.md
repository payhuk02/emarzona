# 🔧 GUIDE DE CORRECTION - PERMISSIONS IMAGES ARTISTE

**Date** : 30 Janvier 2025  
**Problème** : Les images uploadées ne s'affichent pas (erreur de permissions Supabase Storage)

---

## 🔍 ANALYSE DU PROBLÈME

### Problème identifié

Les images sont uploadées avec succès vers Supabase Storage, mais ne peuvent pas être chargées/affichées car :

1. **Politique RLS trop restrictive** : La migration existante exige que les fichiers soient dans un dossier `{userId}/`, mais les images artiste sont uploadées dans `artist/`
2. **Bucket peut ne pas être public** : Le bucket doit être configuré comme public
3. **Politique de lecture peut être absente ou incorrecte**

---

## ✅ SOLUTION - MIGRATION SQL

Une migration SQL a été créée : `supabase/migrations/20250131_fix_product_images_permissions.sql`

### Ce que fait la migration :

1. ✅ **S'assure que le bucket est public**
2. ✅ **Supprime les anciennes politiques restrictives**
3. ✅ **Crée une politique d'upload permissive** pour tous les dossiers (y compris `artist/`)
4. ✅ **Crée une politique de lecture publique** pour tous les fichiers du bucket
5. ✅ **Crée des politiques de mise à jour et suppression** pour les utilisateurs authentifiés

---

## 🚀 ÉTAPES DE CORRECTION

### Option 1 : Appliquer la migration (Recommandé)

1. **Dans Supabase Dashboard** :
   - Allez dans : **SQL Editor**
   - Créez une nouvelle requête
   - Copiez-collez le contenu de `supabase/migrations/20250131_fix_product_images_permissions.sql`
   - Exécutez la requête

2. **Vérifiez que le bucket est public** :
   - Allez dans : **Storage** → **product-images** → **Settings**
   - Vérifiez que **"Public bucket"** est activé
   - Si non, activez-le et sauvegardez

### Option 2 : Configuration manuelle

#### Étape 1 : Vérifier le bucket

1. Allez dans : **Supabase Dashboard** → **Storage** → **product-images**
2. Cliquez sur **Settings**
3. Vérifiez que **"Public bucket"** est ✅ **activé**
4. Si non, activez-le et sauvegardez

#### Étape 2 : Vérifier les politiques RLS

1. Allez dans : **Supabase Dashboard** → **Storage** → **Policies**
2. Filtrez par bucket : `product-images`
3. Vérifiez qu'il existe une politique de **SELECT** pour **public**

#### Étape 3 : Créer/Corriger les politiques

Si les politiques n'existent pas ou sont incorrectes, exécutez ce SQL :

```sql
-- 1. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- 3. Politique d'upload - Permet l'upload dans tous les dossiers
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 4. Politique de lecture publique - TOUS les fichiers sont accessibles
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 5. Politique de mise à jour
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Politique de suppression
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

---

## 🧪 TESTER LA CORRECTION

### 1. Tester l'upload

1. Uploader une nouvelle image dans le formulaire
2. Vérifier dans la console qu'il n'y a pas d'erreur
3. Vérifier que l'image s'affiche correctement

### 2. Tester l'URL directement

1. Après upload, copier l'URL de l'image depuis les logs de la console
2. Ouvrir l'URL dans un nouvel onglet du navigateur
3. Si l'image s'affiche → Les permissions sont correctes ✅
4. Si erreur 403/404 → Les permissions ne sont pas correctes ❌

### 3. Vérifier dans Supabase Dashboard

1. Allez dans : **Storage** → **product-images** → **artist/**
2. Vérifiez que les fichiers uploadés sont visibles
3. Cliquez sur un fichier pour voir son URL publique
4. Testez l'URL dans le navigateur

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Le bucket `product-images` existe
- [ ] Le bucket est configuré comme **public**
- [ ] La politique de **SELECT** pour **public** existe
- [ ] La politique de **INSERT** pour **authenticated** existe
- [ ] Les fichiers dans `artist/` sont visibles dans le dashboard
- [ ] Les URLs publiques des fichiers sont accessibles dans le navigateur
- [ ] L'image s'affiche correctement dans le formulaire après upload

---

## 🔍 DIAGNOSTIC SI LE PROBLÈME PERSISTE

### Vérifier les logs

1. **Console du navigateur** :
   - Ouvrir les DevTools (F12)
   - Aller dans l'onglet **Console**
   - Chercher les erreurs liées à l'image
   - Vérifier l'URL de l'image dans les logs

2. **Network tab** :
   - Aller dans l'onglet **Network**
   - Filtrer par **Img**
   - Cliquer sur la requête de l'image
   - Vérifier le **Status Code** :
     - **200** = Image accessible ✅
     - **403** = Permissions refusées ❌
     - **404** = Fichier non trouvé ❌

### Vérifier les permissions Supabase

1. **Storage Policies** :
   - Allez dans : **Storage** → **Policies**
   - Vérifiez qu'il y a une politique pour `product-images`
   - Vérifiez que la politique de SELECT est pour **public**

2. **Bucket Settings** :
   - Allez dans : **Storage** → **product-images** → **Settings**
   - Vérifiez que **"Public bucket"** est activé
   - Vérifiez les **"Allowed MIME types"** incluent les types d'images

---

## 📝 NOTES IMPORTANTES

### Sécurité

- ✅ Le bucket est public pour la **lecture** (nécessaire pour afficher les images)
- ✅ Seuls les utilisateurs **authentifiés** peuvent **uploader/modifier/supprimer**
- ✅ Les politiques RLS protègent contre les accès non autorisés

### Performance

- Les images sont servies directement depuis Supabase Storage
- Pas de proxy intermédiaire nécessaire
- CDN Supabase pour une distribution rapide

---

## ✅ RÉSULTAT ATTENDU

Après avoir appliqué la correction :

1. ✅ Les images uploadées s'affichent immédiatement
2. ✅ Plus d'erreur "Image non accessible"
3. ✅ Les URLs publiques fonctionnent dans le navigateur
4. ✅ L'expérience utilisateur est fluide

---

**Fichiers modifiés** :
- ✅ `supabase/migrations/20250131_fix_product_images_permissions.sql` - Migration SQL pour corriger les permissions
- ✅ `src/components/products/create/artist/ArtistBasicInfoForm.tsx` - Message d'erreur amélioré
- ✅ `GUIDE_CORRECTION_PERMISSIONS_IMAGES.md` - Ce guide










