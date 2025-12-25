# 🚨 GUIDE RAPIDE - Correction Immédiate Problème Images Artistes

**Problème**: Erreur "mime type application/json is not supported" lors de l'upload d'images  
**Cause**: Les politiques RLS du bucket `product-images` bloquent l'accès public  
**Solution**: Exécuter la migration de correction  

---

## ⚡ SOLUTION EN 3 ÉTAPES (5 MINUTES)

### Étape 1 : Ouvrir le Dashboard Supabase

1. Allez sur https://app.supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **Payhuk**

### Étape 2 : Exécuter la Migration

1. Dans le menu latéral, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"** (ou ouvrez un nouvel onglet)
3. Ouvrez le fichier : `supabase/migrations/20250301_final_fix_product_images_access.sql`
4. **Copiez TOUT le contenu** du fichier
5. **Collez-le** dans l'éditeur SQL
6. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
7. **Vérifiez** que vous voyez dans les résultats : `✅ CONFIGURATION CORRECTE !`

### Étape 3 : Vérifier le Bucket est Public

1. Dans le menu latéral, cliquez sur **"Storage"** → **"Buckets"**
2. Cliquez sur le bucket **`product-images`**
3. Vérifiez que **"Public bucket"** est **activé** (toggle vert/bleu)
4. Si ce n'est pas le cas, **activez-le** et **sauvegardez**

### Étape 4 : Attendre et Tester

1. ⏰ **Attendez 2-3 minutes** (délai de propagation Supabase)
2. **Rechargez votre application** (F5 ou Ctrl+R)
3. **Essayez d'uploader une image** à nouveau
4. L'image devrait maintenant s'afficher correctement ! ✅

---

## 🔍 VÉRIFICATION RAPIDE

Après avoir exécuté la migration, vous devriez voir dans les résultats SQL :

```
✅ Bucket product-images est PUBLIC
✅ Politique lecture publique: EXISTE
✅ CONFIGURATION CORRECTE !
```

Si vous voyez des ❌ ou ⚠️, suivez les instructions affichées dans les résultats.

---

## ❌ SI ÇA NE MARCHE TOUJOURS PAS

### Option 1 : Exécuter le Script de Diagnostic

1. Dans le SQL Editor, exécutez : `supabase/migrations/20250301_test_bucket_public_access.sql`
2. Ce script affichera un diagnostic détaillé
3. Suivez les instructions affichées

### Option 2 : Vérification Manuelle

1. **Vérifiez les politiques RLS** :
   - Dashboard → Storage → Policies
   - Recherchez "product-images"
   - Vous devriez voir 4 politiques avec des noms commençant par "product-images -"

2. **Testez une URL directement** :
   - Uploadez une image
   - Notez le chemin (ex: `artist/artist-photo_1234567890_abc123.png`)
   - Ouvrez dans votre navigateur :
     ```
     https://[votre-projet-ref].supabase.co/storage/v1/object/public/product-images/artist/artist-photo_1234567890_abc123.png
     ```
   - Si vous voyez l'image → ✅ Ça marche !
   - Si vous voyez du JSON → ❌ Les politiques RLS bloquent encore

### Option 3 : Contacter le Support

Si rien ne fonctionne après avoir suivi toutes les étapes :
- Vérifiez les logs Supabase : Dashboard → Logs → Postgres Logs
- Vérifiez les erreurs réseau dans les DevTools du navigateur (F12 → Network)

---

## 📝 NOTE IMPORTANTE

Le code a été amélioré pour détecter cette erreur et afficher un message clair. Une fois la migration exécutée et les permissions corrigées, l'erreur disparaîtra automatiquement.

---

**Temps estimé total**: 5 minutes  
**Difficulté**: ⭐ Facile  
**Dernière mise à jour**: 1 Mars 2025





