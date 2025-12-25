# Guide de Vérification des Images Artiste

## 📋 Vue d'ensemble

Ce guide vous aide à vérifier que les images (photo artiste et images œuvre) sont correctement sauvegardées dans la base de données après la création d'un produit artistique.

## 🔍 Étapes de Vérification

### 1. Créer un Produit Artiste Complet

**Important** : Pour que les images soient sauvegardées, vous devez :

1. ✅ **Uploader une photo artiste** dans l'étape 2 (Informations de base)
2. ✅ **Uploader au moins 1 image œuvre** dans l'étape 2
3. ✅ **Compléter toutes les étapes** du wizard
4. ✅ **Cliquer sur "Publier"** (pas "Enregistrer comme brouillon")

> ⚠️ **Note** : Si vous cliquez sur "Enregistrer comme brouillon", le produit sera créé avec `is_draft = true`, mais les images devraient quand même être sauvegardées.

### 2. Exécuter la Requête SQL de Vérification

Ouvrez le fichier `verification_images_artiste_simple.sql` dans Supabase SQL Editor et exécutez les 3 requêtes :

#### Requête 1 : Vérifier l'existence de produits
```sql
SELECT 
  'Produits artistiques totaux' as type_verification,
  COUNT(*) as nombre
FROM products
WHERE product_type = 'artist';
```

**Résultat attendu** : Si vous avez créé au moins un produit, `nombre` devrait être > 0.

#### Requête 2 : Voir les détails des produits
```sql
SELECT 
  p.id,
  p.name,
  p.image_url as image_principale,
  CASE 
    WHEN p.images IS NULL THEN 'NULL'
    WHEN jsonb_typeof(p.images::jsonb) = 'array' THEN jsonb_array_length(p.images::jsonb)::text
    ELSE 'N/A'
  END as nombre_images,
  p.images as toutes_images,
  ap.artist_photo_url as photo_artiste,
  ap.created_at as date_creation
FROM products p
LEFT JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 10;
```

**Résultat attendu** :
- `image_principale` : URL de la première image (ou NULL)
- `nombre_images` : Nombre d'images dans le tableau (ou 'NULL')
- `toutes_images` : Tableau JSON avec toutes les URLs d'images
- `photo_artiste` : URL de la photo de l'artiste (ou NULL)

#### Requête 3 : Statistiques globales
```sql
SELECT 
  COUNT(*) FILTER (WHERE p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0) as avec_images_oeuvre,
  COUNT(*) FILTER (WHERE p.images IS NULL OR jsonb_array_length(p.images::jsonb) = 0) as sans_images_oeuvre,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NOT NULL) as avec_photo_artiste,
  COUNT(*) FILTER (WHERE ap.artist_photo_url IS NULL) as sans_photo_artiste,
  COUNT(*) FILTER (
    WHERE (p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0) 
    AND ap.artist_photo_url IS NOT NULL
  ) as avec_toutes_images,
  COUNT(*) as total_produits
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist';
```

**Résultat attendu** :
- `avec_images_oeuvre` : Nombre de produits avec images œuvre
- `avec_photo_artiste` : Nombre de produits avec photo artiste
- `avec_toutes_images` : Nombre de produits avec les deux types d'images

## 🐛 Diagnostic des Problèmes

### Problème 1 : Aucun produit trouvé (`nombre = 0`)

**Causes possibles** :
- Aucun produit n'a été créé avec succès
- Le produit a été créé dans une autre boutique (`store_id` différent)
- Erreur lors de la sauvegarde (vérifier les logs de la console)

**Solution** :
1. Vérifier les logs de la console du navigateur lors de la création
2. Vérifier que vous êtes connecté avec le bon compte
3. Vérifier le `store_id` dans la table `products`

### Problème 2 : Produits trouvés mais `images` est NULL ou vide

**Causes possibles** :
- Les images n'ont pas été uploadées avant la sauvegarde
- Erreur lors de l'upload (vérifier les logs)
- Les images ont été uploadées mais `formData.images` n'a pas été mis à jour

**Solution** :
1. Vérifier les logs de la console lors de l'upload
2. Vérifier que les images sont bien présentes dans Supabase Storage (`product-images` bucket)
3. Vérifier que `formData.images` contient les URLs après l'upload

### Problème 3 : `artist_photo_url` est NULL

**Causes possibles** :
- La photo artiste n'a pas été uploadée
- Erreur lors de l'upload de la photo artiste
- `formData.artist_photo_url` n'a pas été mis à jour

**Solution** :
1. Vérifier les logs de la console lors de l'upload de la photo artiste
2. Vérifier que la photo est bien présente dans Supabase Storage
3. Vérifier que `formData.artist_photo_url` contient l'URL après l'upload

## ✅ Vérification dans Supabase Storage

Pour vérifier que les fichiers sont bien dans le storage :

1. Allez dans **Storage** > **product-images** dans Supabase Dashboard
2. Cherchez les dossiers `artist/`
3. Vérifiez la présence de :
   - `artist-photo_*.jpeg` (photo artiste)
   - `artwork_*.jpeg` (images œuvre)

## 📝 Code de Sauvegarde

Le code de sauvegarde dans `CreateArtistProductWizard.tsx` :

```typescript
// Ligne 262-263 : Images œuvre dans products
image_url: formData.images?.[0] || null,
images: formData.images || [],

// Ligne 299 : Photo artiste dans artist_products
artist_photo_url: formData.artist_photo_url || null,
```

## 🎯 Résultat Attendu

Après avoir créé un produit avec succès, vous devriez voir :

- ✅ Au moins 1 produit dans la requête 1
- ✅ `nombre_images` > 0 dans la requête 2
- ✅ `photo_artiste` non NULL dans la requête 2
- ✅ `avec_toutes_images` > 0 dans la requête 3

Si ces conditions ne sont pas remplies, suivez le diagnostic ci-dessus.

