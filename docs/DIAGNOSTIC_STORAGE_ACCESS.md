# 🔍 Diagnostic - Problème d'accès aux images Supabase Storage

## Problème

Les images uploadées dans le bucket `product-images` (notamment dans `artist/`) ne se chargent pas, même si :
- ✅ L'upload semble réussir
- ✅ Le fichier est confirmé présent dans le bucket
- ✅ Les URLs publiques et signées sont générées correctement

**Erreur observée** : Les URLs retournent du JSON avec un status 200 au lieu des images.

## Causes possibles

1. **Politiques RLS non configurées** : Les politiques RLS du bucket bloquent l'accès public
2. **Bucket non public** : Le bucket n'est pas configuré comme public
3. **Délai de propagation** : Supabase prend quelques minutes pour rendre les fichiers accessibles après modification des politiques
4. **Migration non exécutée** : La migration `20250301_fix_product_images_artist_access.sql` n'a pas été exécutée

## Solutions

### Étape 1 : Vérifier la configuration du bucket

1. Ouvrez le **Dashboard Supabase** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Storage** > **Buckets**
4. Cliquez sur le bucket **`product-images`**
5. Vérifiez que **"Public bucket"** est activé (coché ✅)

### Étape 2 : Vérifier les politiques RLS

1. Dans le bucket **`product-images`**, allez dans l'onglet **"Policies"**
2. Vérifiez qu'il existe une politique nommée **"product-images - Public read access"** avec :
   - **Operation** : `SELECT`
   - **Target roles** : `public` (ou `anon`)
   - **USING expression** : `bucket_id = 'product-images'`

3. Si cette politique n'existe pas, créez-la :
   ```sql
   CREATE POLICY "product-images - Public read access"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'product-images');
   ```

### Étape 3 : Exécuter la migration de correction

Exécutez la migration dans le **SQL Editor** de Supabase :

```bash
# Via Supabase CLI (si configuré)
supabase db push

# Ou copiez-collez le contenu du fichier dans le SQL Editor :
supabase/migrations/20250301_fix_product_images_artist_access.sql
```

### Étape 4 : Vérifier avec le script de diagnostic

Exécutez le script de diagnostic :

```bash
node scripts/diagnose-storage-access.js
```

Ce script va :
- ✅ Vérifier si le bucket existe et est public
- ✅ Lister les fichiers dans `artist/`
- ✅ Tester l'accès HTTP à un fichier
- ✅ Vérifier les politiques RLS (si possible)

### Étape 5 : Vérifier avec SQL

Exécutez la migration de vérification dans le **SQL Editor** :

```bash
supabase/migrations/20250301_verify_product_images_rls.sql
```

Cette migration affichera :
- ✅ Si le bucket est public
- ✅ Les politiques RLS existantes
- ✅ Le nombre de fichiers dans `artist/`
- ✅ Des instructions de diagnostic

### Étape 6 : Test manuel

1. Upload une image dans votre application
2. Notez le chemin retourné (ex: `artist/artist-photo_1234567890_abc123.png`)
3. Testez l'URL directement dans votre navigateur :
   ```
   https://[votre-projet].supabase.co/storage/v1/object/public/product-images/artist/artist-photo_1234567890_abc123.png
   ```

**Si vous voyez du JSON** : Les politiques RLS bloquent l'accès → Suivez l'étape 2

**Si vous voyez l'image** : Le problème est côté client → Vérifiez les logs de la console

## Solution temporaire (workaround)

Le code a été amélioré pour utiliser un **blob URL temporaire** lorsque les URLs publiques ne fonctionnent pas :

1. Après l'upload, le fichier est téléchargé via l'API Supabase Storage (qui fonctionne toujours)
2. Un blob URL est créé pour l'affichage immédiat
3. Après 30 secondes, le code teste si l'URL publique fonctionne maintenant
4. Si oui, passage à l'URL publique (plus efficace)
5. Sinon, conservation du blob URL temporaire

**Note** : Les blob URLs sont locaux au navigateur et seront perdus au rechargement de la page. La vraie solution est de corriger les politiques RLS.

## Vérifications finales

- [ ] Le bucket `product-images` est public
- [ ] La politique "product-images - Public read access" existe et permet SELECT pour `public`
- [ ] La migration `20250301_fix_product_images_artist_access.sql` a été exécutée
- [ ] Vous avez attendu 2-3 minutes après la modification des politiques (délai de propagation)
- [ ] Un test d'URL directe dans le navigateur fonctionne

## Logs utiles

Si le problème persiste, vérifiez les logs de la console :

- `✅ Fichier confirmé présent dans le bucket` : Le fichier existe bien
- `✅ Fichier téléchargé avec succès, blob URL créée` : Workaround activé
- `⚠️ URL publique retourne un contenu non-image` : Problème de politiques RLS
- `❌ Erreur chargement photo artiste` : Problème de chargement d'image

## Support

Si le problème persiste après avoir suivi toutes les étapes :

1. Vérifiez les logs Supabase : Dashboard > Logs > Postgres Logs
2. Vérifiez les erreurs réseau dans les DevTools du navigateur (onglet Network)
3. Contactez le support Supabase si les politiques RLS ne peuvent pas être créées





