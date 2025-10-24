# 🗄️ Configuration Supabase Storage - Payhuk

## 📋 Instructions de configuration du bucket `store-images`

Pour que l'upload d'images fonctionne correctement dans l'application Payhuk, vous devez créer et configurer un bucket Supabase Storage.

---

## ⚡ Étape 1 : Créer le bucket

1. Allez sur votre **Supabase Dashboard** : https://app.supabase.com
2. Sélectionnez votre projet **Payhuk**
3. Dans le menu latéral, cliquez sur **Storage**
4. Cliquez sur **"New bucket"**
5. Configurez le bucket comme suit :
   - **Name** : `store-images`
   - **Public bucket** : ✅ **Coché** (pour que les images soient accessibles publiquement)
   - **Allowed MIME types** : Laissez vide ou ajoutez : `image/jpeg, image/png, image/webp, image/gif`
   - **Max file size** : `5MB` (ou selon vos besoins)

6. Cliquez sur **"Create bucket"**

---

## 🔐 Étape 2 : Configurer les politiques de sécurité (RLS)

### Politique 1 : Permettre l'upload aux utilisateurs authentifiés

```sql
-- Politique pour l'upload d'images
CREATE POLICY "Utilisateurs authentifiés peuvent uploader"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Explication :** Cette politique permet aux utilisateurs authentifiés d'uploader des images uniquement dans leur propre dossier (`userId/...`).

---

### Politique 2 : Lecture publique

```sql
-- Politique pour la lecture publique des images
CREATE POLICY "Lecture publique des images de boutique"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-images');
```

**Explication :** Permet à tout le monde de voir les images uploadées (nécessaire pour afficher les boutiques publiques).

---

### Politique 3 : Suppression par le propriétaire

```sql
-- Politique pour la suppression par le propriétaire
CREATE POLICY "Propriétaire peut supprimer ses images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Explication :** Seul le propriétaire peut supprimer ses propres images.

---

### Politique 4 : Mise à jour par le propriétaire

```sql
-- Politique pour la mise à jour par le propriétaire
CREATE POLICY "Propriétaire peut mettre à jour ses images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🗂️ Structure des dossiers

Les images seront organisées comme suit dans le bucket :

```
store-images/
├── {userId}/
│   ├── store-logo/
│   │   └── 1698765432_abc123.png
│   ├── store-banner/
│   │   └── 1698765433_def456.jpg
│   ├── product-image/
│   │   └── 1698765434_ghi789.webp
│   └── product-gallery/
│       └── 1698765435_jkl012.jpg
```

---

## 📝 Étape 3 : Appliquer les politiques via SQL Editor

1. Dans Supabase Dashboard, allez dans **SQL Editor**
2. Créez un nouveau query
3. Copiez-collez les 4 politiques ci-dessus
4. Exécutez le script

---

## ✅ Étape 4 : Vérifier la configuration

Pour vérifier que tout fonctionne correctement :

1. Lancez l'application Payhuk
2. Connectez-vous
3. Allez dans **Boutique > Apparence**
4. Essayez d'uploader un logo ou une bannière
5. Vérifiez dans **Supabase Storage > store-images** que le fichier apparaît

---

## 🔧 Configuration alternative (via Dashboard UI)

Si vous préférez configurer les politiques via l'interface :

1. Allez dans **Storage > Policies**
2. Cliquez sur **"New policy"** pour le bucket `store-images`
3. Utilisez le **Policy editor** pour créer les 4 politiques manuellement

---

## 🚨 Dépannage

### Erreur : "Bucket does not exist"

➡️ Vérifiez que le bucket s'appelle exactement `store-images` (sans majuscules).

### Erreur : "Permission denied"

➡️ Vérifiez que les politiques RLS sont bien configurées et activées.

### Erreur : "File too large"

➡️ Augmentez la taille maximale dans les paramètres du bucket.

### Images non accessibles publiquement

➡️ Vérifiez que le bucket est bien configuré en **"Public"** et que la politique SELECT est active.

---

## 📚 Ressources supplémentaires

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Gestion des fichiers](https://supabase.com/docs/guides/storage/uploads)

---

## ✨ Types d'images supportés

| Type | Utilisation | Format recommandé | Taille max |
|------|-------------|-------------------|------------|
| `store-logo` | Logo de la boutique | Carré (500x500px) | 2MB |
| `store-banner` | Bannière de la boutique | Paysage (1920x640px) | 5MB |
| `product-image` | Image principale produit | Carré ou portrait | 3MB |
| `product-gallery` | Galerie produit | Variable | 3MB |
| `avatar` | Photo de profil | Carré (200x200px) | 1MB |

---

**✅ Configuration terminée !** Votre système d'upload d'images est maintenant opérationnel.

