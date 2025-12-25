# 🔧 Correction Problème Images Œuvres d'Artiste

**Date**: 1 Mars 2025  
**Problème**: Les images uploadées dans `product-images/artist/` ne sont pas accessibles publiquement  
**Statut**: ✅ Migration de correction créée  

---

## 📋 RÉSUMÉ DU PROBLÈME

Lors de l'upload d'images pour les œuvres d'artiste, les fichiers sont bien uploadés dans Supabase Storage mais les URLs publiques retournent du JSON au lieu des images. Cela est dû à un problème de configuration RLS (Row Level Security) sur le bucket `product-images`.

**Symptômes**:
- ✅ Upload réussi (fichier confirmé présent dans le bucket)
- ❌ URLs publiques retournent du JSON (status 200 mais contentType: 'application/json')
- ❌ URLs signées échouent également

**Cause**: Politiques RLS manquantes ou incorrectes pour permettre l'accès public aux fichiers du bucket `product-images`.

---

## ✅ SOLUTION

### Migration de Correction

Une migration consolidée a été créée pour corriger définitivement le problème :

**Fichier**: `supabase/migrations/20250301_final_fix_product_images_access.sql`

Cette migration :
1. ✅ S'assure que le bucket `product-images` existe et est public
2. ✅ Nettoie toutes les anciennes politiques RLS conflictuelles
3. ✅ Crée 4 politiques RLS correctes :
   - Upload pour utilisateurs authentifiés
   - **Lecture publique (critique pour l'affichage)**
   - Update pour utilisateurs authentifiés
   - Delete pour utilisateurs authentifiés
4. ✅ Vérifie automatiquement la configuration

### Workaround Temporaire Implémenté

Un workaround a été implémenté dans le code (`ArtistBasicInfoForm.tsx`) :
- Utilisation de blob URLs temporaires pour l'affichage immédiat
- Après 30 secondes, test automatique de l'URL publique
- Si l'URL publique fonctionne, passage automatique
- Si non, conservation du blob URL temporaire

**Note**: Le blob URL est local au navigateur et sera perdu au rechargement. La vraie solution est d'exécuter la migration.

---

## 🔧 INSTRUCTIONS DE CORRECTION

### Étape 1 : Exécuter la Migration

1. **Ouvrez le Dashboard Supabase**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet Payhuk

2. **Ouvrez le SQL Editor**
   - Menu latéral → **SQL Editor**
   - Cliquez sur **"New query"**

3. **Exécutez la Migration**
   - Ouvrez le fichier `supabase/migrations/20250301_final_fix_product_images_access.sql`
   - Copiez-collez tout le contenu dans le SQL Editor
   - Cliquez sur **"Run"** (ou `Ctrl+Enter`)
   - Vérifiez que toutes les étapes s'exécutent sans erreur

4. **Vérifier les Résultats**
   - La migration affichera automatiquement le résultat dans les NOTICE
   - Vous devriez voir : `✅ CONFIGURATION CORRECTE !`

### Étape 2 : Vérifier le Bucket dans le Dashboard

1. **Allez dans Storage → Buckets**
2. **Cliquez sur le bucket `product-images`**
3. **Vérifiez que "Public bucket" est activé** (toggle vert)
4. **Si ce n'est pas le cas, activez-le et sauvegardez**

### Étape 3 : Attendre la Propagation

- ⏰ **Attendez 2-3 minutes** après l'exécution de la migration
- Supabase a besoin de ce délai pour propager les changements de politiques RLS

### Étape 4 : Tester

1. **Dans votre application**
   - Allez dans la création d'une œuvre d'artiste
   - Uploadez une image (photo artiste ou image œuvre)
   - Vérifiez que l'image s'affiche correctement

2. **Test direct dans le navigateur** (optionnel)
   - Notez le chemin de l'image uploadée (ex: `artist/artist-photo_1234567890_abc123.png`)
   - Ouvrez dans votre navigateur :
     ```
     https://[votre-projet-ref].supabase.co/storage/v1/object/public/product-images/artist/artist-photo_1234567890_abc123.png
     ```
   - Vous devriez voir l'image, pas du JSON

---

## 🔍 VÉRIFICATION POST-CORRECTION

### Checklist

- [ ] Migration `20250301_final_fix_product_images_access.sql` exécutée sans erreur
- [ ] Bucket `product-images` marqué comme public dans le dashboard
- [ ] Attendu 2-3 minutes pour la propagation
- [ ] Test upload image artiste réussi
- [ ] Image affichée correctement dans l'application
- [ ] Test URL directe dans le navigateur réussi (optionnel)

### Si le Problème Persiste

1. **Vérifier les logs de la migration**
   - Regardez les messages NOTICE pour voir les résultats
   - Vérifiez s'il y a des erreurs

2. **Vérifier les politiques RLS manuellement**
   - Dashboard Supabase → Storage → Policies
   - Recherchez "product-images"
   - Vous devriez voir 4 politiques :
     - `product-images - Upload authenticated`
     - `product-images - Public read access` ← **Critique**
     - `product-images - Update authenticated`
     - `product-images - Delete authenticated`

3. **Vérifier que le bucket est public**
   - Dashboard Supabase → Storage → Buckets → `product-images`
   - Le toggle "Public bucket" doit être vert/activé

4. **Exécuter le script de diagnostic**
   - Exécutez `supabase/migrations/20250301_test_bucket_public_access.sql`
   - Il affichera un diagnostic détaillé

5. **Vérifier les URLs générées**
   - Dans les logs de l'application, vérifiez que les URLs générées sont correctes
   - Format attendu : `https://[projet].supabase.co/storage/v1/object/public/product-images/artist/[nom-fichier]`

---

## 📝 NOTES TECHNIQUES

### Politiques RLS Critiques

La politique la plus importante pour l'affichage des images est :

```sql
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

Cette politique permet à **tout le monde** (public) de lire les fichiers du bucket `product-images`.

### Pourquoi le Blob URL Temporaire ?

Le code utilise un blob URL temporaire car :
- Il permet l'affichage immédiat même si les URLs publiques ne fonctionnent pas encore
- Il fonctionne via l'API Supabase Storage qui a toujours accès (même si public ne fonctionne pas)
- Il se transforme automatiquement en URL publique après 30 secondes si possible

**Important**: Le blob URL est local au navigateur. Après rechargement de la page, il sera perdu. C'est pourquoi la vraie solution est la migration.

### Migration Idempotente

La migration est idempotente, ce qui signifie qu'elle peut être exécutée plusieurs fois sans problème :
- Elle supprime d'abord toutes les anciennes politiques
- Puis crée les nouvelles politiques
- Elle vérifie automatiquement la configuration

---

## ✅ VALIDATION FINALE

Après avoir exécuté la migration et attendu la propagation :

1. ✅ Les images uploadées doivent s'afficher immédiatement
2. ✅ Les URLs publiques doivent fonctionner dans le navigateur
3. ✅ Aucune erreur dans la console du navigateur
4. ✅ Les images doivent persister après rechargement de la page

**Si tous ces points sont validés, le problème est résolu !** 🎉

---

**Document créé le**: 1 Mars 2025  
**Dernière mise à jour**: 1 Mars 2025





