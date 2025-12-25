# 🧪 GUIDE DE TEST - SAUVEGARDE IMAGES ARTISTE

**Date** : 28 Janvier 2025  
**Objectif** : Vérifier que les images sont bien sauvegardées en base de données

---

## 📋 ÉTAPES DE TEST

### Étape 1 : Créer un Produit Artiste Complet

1. **Aller sur** : `http://localhost:8080/dashboard/products/new`
2. **Sélectionner** : Type "Œuvre d'artiste"
3. **Remplir le formulaire** :
   - ✅ **Étape 1** : Sélectionner type d'artiste (ex: "Artiste visuel")
   - ✅ **Étape 2** : Informations de base
     - **Nom artiste** : "Test Artist"
     - **Titre œuvre** : "Test Artwork"
     - **Médium** : "Huile sur toile"
     - **Prix** : 10000
     - **📸 UPLOADER PHOTO ARTISTE** : Cliquer sur "Ajouter une photo"
     - **📸 UPLOADER IMAGES ŒUVRE** : Cliquer sur "Ajouter" et uploader au moins 2 images
   - ✅ **Étape 3-7** : Remplir les autres étapes (ou passer rapidement)
   - ✅ **Étape 8** : Cliquer sur "Publier"

### Étape 2 : Vérifier les Logs Console

Après avoir uploadé les images, vérifier dans la console :

```
✅ Photo artiste uploadée avec succès
✅ Image œuvre uploadée
```

### Étape 3 : Vérifier en Base de Données

**Exécuter cette requête SQL dans Supabase SQL Editor** :

```sql
-- Vérifier le dernier produit artiste créé
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.image_url as product_image_url,
  p.images as product_images,
  jsonb_array_length(p.images::jsonb) as images_count,
  ap.id as artist_product_id,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url IS NOT NULL THEN '✅ Photo présente'
    ELSE '❌ Photo manquante'
  END as photo_status,
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_array_length(p.images::jsonb) > 0 THEN 
      '✅ Images présentes (' || jsonb_array_length(p.images::jsonb) || ')'
    ELSE '❌ Images manquantes'
  END as images_status,
  p.created_at
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 1;
```

### Étape 4 : Résultats Attendus

#### ✅ Si tout fonctionne correctement :

**Table `products`** :
- `image_url` : URL de la première image (ex: `https://...supabase.co/.../artist/artwork_...jpeg`)
- `images` : Tableau JSON avec toutes les URLs (ex: `["url1", "url2"]`)

**Table `artist_products`** :
- `artist_photo_url` : URL de la photo artiste (ex: `https://...supabase.co/.../artist/artist-photo_...jpeg`)

#### ❌ Si problème :

- `artist_photo_url` = `NULL` → Photo non sauvegardée
- `images` = `[]` ou `NULL` → Images non sauvegardées
- `image_url` = `NULL` → Image principale non sauvegardée

---

## 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES

### Vérification 1 : Format des URLs

Les URLs doivent être au format Supabase Storage :
```
https://[project].supabase.co/storage/v1/object/public/product-images/artist/...
```

**Requête SQL** :
```sql
SELECT 
  ap.artist_photo_url,
  CASE 
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/public/product-images/%' THEN '✅ Format valide'
    WHEN ap.artist_photo_url LIKE '%supabase.co/storage/v1/object/sign/product-images/%' THEN '✅ Format signé'
    WHEN ap.artist_photo_url IS NULL THEN '⚠️ NULL'
    ELSE '❌ Format suspect'
  END as photo_url_status,
  p.images,
  CASE 
    WHEN p.images IS NOT NULL THEN 
      jsonb_array_length(p.images::jsonb) || ' image(s)'
    ELSE '0 image'
  END as images_count
FROM artist_products ap
INNER JOIN products p ON p.id = ap.product_id
WHERE p.product_type = 'artist'
ORDER BY ap.created_at DESC
LIMIT 5;
```

### Vérification 2 : Fichiers dans Storage

1. **Dashboard Supabase** > **Storage** > **product-images** > **artist/**
2. Vérifier présence des fichiers :
   - `artist-photo_*.jpeg` (photos artiste)
   - `artwork_*.jpeg` (images œuvre)

### Vérification 3 : Accessibilité des URLs

Tester les URLs directement dans le navigateur :
- Ouvrir l'URL de `artist_photo_url` → Doit afficher l'image
- Ouvrir les URLs de `images` → Doivent afficher les images

---

## 🐛 DÉPANNAGE

### Problème : Images uploadées mais non sauvegardées

**Causes possibles** :
1. ❌ Produit non sauvegardé (brouillon seulement)
2. ❌ Erreur lors de la sauvegarde (vérifier console)
3. ❌ `formData` non mis à jour correctement

**Solution** :
1. Vérifier les logs console pour erreurs
2. Vérifier que le produit est bien publié (pas en brouillon)
3. Vérifier que `onUpdate` est bien appelé après upload

### Problème : URLs NULL en base

**Causes possibles** :
1. ❌ `formData.images` ou `formData.artist_photo_url` est vide
2. ❌ Erreur lors de l'insertion en base

**Solution** :
1. Vérifier `formData` dans les logs console
2. Vérifier les erreurs SQL lors de l'insertion
3. Vérifier que les colonnes existent bien

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Upload photo artiste réussi (logs console)
- [ ] Upload images œuvre réussi (logs console)
- [ ] Produit créé et publié (pas en brouillon)
- [ ] `artist_photo_url` présent en base (non NULL)
- [ ] `images` présent en base (tableau non vide)
- [ ] `image_url` présent en base (première image)
- [ ] URLs au format Supabase Storage correct
- [ ] Fichiers présents dans Supabase Storage
- [ ] URLs accessibles dans le navigateur
- [ ] Images s'affichent sur la page produit

---

## 📊 RÉSULTAT ATTENDU

### Après création d'un produit avec images :

**Requête SQL** :
```sql
SELECT 
  p.name,
  ap.artist_name,
  ap.artwork_title,
  ap.artist_photo_url IS NOT NULL as has_photo,
  jsonb_array_length(p.images::jsonb) as images_count,
  p.created_at
FROM products p
INNER JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 1;
```

**Résultat attendu** :
```
name: "Test Artwork"
artist_name: "Test Artist"
artwork_title: "Test Artwork"
has_photo: true
images_count: 2 (ou plus)
created_at: [date récente]
```

---

**Document créé par** : Auto (Cursor AI)  
**Date** : 28 Janvier 2025

