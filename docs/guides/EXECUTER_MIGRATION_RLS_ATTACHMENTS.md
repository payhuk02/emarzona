# 🚀 Exécuter la Migration RLS pour les Attachments

**Date** : 31 Janvier 2025  
**Problème** : Images retournent HTTP 200 avec `Content-Type: application/json` au lieu d'images  
**Solution** : Migration SQL pour corriger les politiques RLS du bucket `attachments`

---

## ⚠️ IMPORTANT

Cette migration corrige les problèmes d'accès aux fichiers dans le bucket `attachments`, qui peuvent causer :
- Images ne s'affichant pas (HTTP 200 mais Content-Type JSON)
- Erreurs 403 (Forbidden)
- Erreurs 404 (Not Found) même si le fichier existe

---

## 📋 MÉTHODE 1 : Via Supabase Dashboard (Recommandé)

### Étape 1 : Accéder au SQL Editor

1. Ouvrez [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **"New query"** (Nouvelle requête)

### Étape 2 : Exécuter la Migration

**Si vous avez l'erreur "policy already exists"**, utilisez le script de correction forcée :

1. Ouvrez le fichier : `supabase/migrations/20250230_force_fix_attachments_rls.sql`
2. **Copiez TOUT le contenu** du fichier
3. **Collez-le** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)

**Sinon**, utilisez le script standard :

1. Ouvrez le fichier : `supabase/migrations/20250230_fix_attachments_rls_policies.sql`
2. **Copiez TOUT le contenu** du fichier
3. **Collez-le** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)

### Étape 3 : Vérifier le Résultat

Vous devriez voir dans les logs :
```
✅ Bucket "attachments" est public
✅ 4 politiques RLS créées pour le bucket "attachments"
Success. No rows returned
```

---

## 📋 MÉTHODE 2 : Via Supabase CLI

Si vous avez Supabase CLI installé :

```bash
# 1. Naviguer vers le dossier du projet
cd /chemin/vers/emarzona

# 2. Vérifier les migrations en attente
supabase migration list

# 3. Exécuter toutes les migrations en attente
supabase db push

# OU exécuter uniquement cette migration
supabase db execute -f supabase/migrations/20250230_fix_attachments_rls_policies.sql
```

---

## ✅ VÉRIFICATION POST-MIGRATION

### Script de Vérification SQL

Exécutez cette requête dans Supabase SQL Editor pour vérifier que la migration a fonctionné :

```sql
-- 1. Vérifier que le bucket est public
SELECT 
  id,
  name,
  public,
  CASE 
    WHEN public THEN '✅ Public'
    ELSE '❌ Privé (PROBLÈME!)'
  END as status
FROM storage.buckets
WHERE id = 'attachments';

-- 2. Vérifier que les politiques RLS existent
SELECT 
  policyname,
  cmd,
  qual,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%bucket_id%attachments%' THEN '✅ Lecture publique'
    WHEN cmd = 'INSERT' THEN '✅ Upload authentifié'
    WHEN cmd = 'UPDATE' THEN '✅ Mise à jour authentifiée'
    WHEN cmd = 'DELETE' THEN '✅ Suppression authentifiée'
    ELSE '⚠️ Politique suspecte'
  END as description
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%attachments%'
ORDER BY cmd;

-- Résultat attendu : 4 politiques
-- - "Anyone can view attachments" (SELECT)
-- - "Authenticated users can upload attachments" (INSERT)
-- - "Users can update their own attachments" (UPDATE)
-- - "Users can delete their own attachments" (DELETE)
```

### Vérification Manuelle dans le Dashboard

1. Allez dans **Storage** > **Buckets**
2. Cliquez sur le bucket **"attachments"**
3. Vérifiez que **"Public bucket"** est activé (coche verte)
4. Allez dans **Storage** > **Policies**
5. Filtrez par bucket **"attachments"**
6. Vérifiez que vous voyez 4 politiques :
   - ✅ "Anyone can view attachments" (SELECT)
   - ✅ "Authenticated users can upload attachments" (INSERT)
   - ✅ "Users can update their own attachments" (UPDATE)
   - ✅ "Users can delete their own attachments" (DELETE)

---

## 🔍 TESTER APRÈS LA MIGRATION

### Test 1 : Tester avec une Image Existante

1. Ouvrez la console du navigateur (F12)
2. Allez sur une page avec des messages contenant des images
3. Vérifiez qu'il n'y a plus d'erreurs dans la console
4. Les images devraient s'afficher correctement

### Test 2 : Uploader une Nouvelle Image

1. Allez sur la page de messagerie
2. Envoyez une nouvelle image
3. Vérifiez que l'image s'affiche immédiatement après l'envoi
4. Rechargez la page et vérifiez que l'image est toujours visible

### Test 3 : Script de Test dans la Console

```javascript
// Tester une URL d'image directement
async function testImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.status === 200 && response.headers.get('content-type')?.startsWith('image/')) {
      console.log('✅ Image accessible et Content-Type correct');
    } else if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
      console.error('❌ HTTP 200 mais Content-Type JSON - La migration n\'a peut-être pas fonctionné');
      const fullResponse = await fetch(url);
      const json = await fullResponse.json();
      console.error('Erreur JSON:', json);
    } else {
      console.error('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
}

// Utilisation : coller l'URL d'une image qui ne s'affiche pas
// testImageUrl('https://xxx.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/xxx.png');
```

---

## 🐛 PROBLÈMES COURANTS

### Problème 1 : "Bucket not found"

**Solution** : Exécutez d'abord la migration de création du bucket :
```sql
-- Fichier: supabase/migrations/20250230_create_attachments_storage_bucket.sql
```

### Problème 2 : "Permission denied" lors de l'exécution

**Solution** : 
1. Vérifiez que vous êtes connecté en tant qu'administrateur du projet
2. Ou exécutez via Supabase CLI avec les bonnes permissions

### Problème 3 : Les politiques existent mais les images ne s'affichent toujours pas

**Solutions** :
1. Vérifiez que le bucket est bien **public** (pas seulement les politiques RLS)
2. Vérifiez que les fichiers existent réellement dans le bucket
3. Vérifiez les logs de la console du navigateur pour voir l'erreur exacte
4. Utilisez le script de test ci-dessus pour diagnostiquer

### Problème 4 : "policy already exists"

**Solution** : Utilisez le script de correction forcée qui supprime toutes les variantes de politiques avant de les recréer :

1. Ouvrez le fichier : `supabase/migrations/20250230_force_fix_attachments_rls.sql`
2. **Copiez TOUT le contenu** du fichier
3. **Collez-le** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"**

Ce script :
- Supprime toutes les politiques existantes (y compris avec des noms légèrement différents)
- Recrée les politiques avec la bonne configuration
- Vérifie que tout est correct après la création

---

## 📝 NOTES TECHNIQUES

### Ce que fait la migration

1. **Met le bucket en public** : `UPDATE storage.buckets SET public = true WHERE id = 'attachments'`
2. **Supprime les anciennes politiques** : Pour éviter les conflits
3. **Crée 4 nouvelles politiques RLS** :
   - SELECT : Lecture publique (tout le monde peut voir)
   - INSERT : Upload pour utilisateurs authentifiés
   - UPDATE : Mise à jour pour utilisateurs authentifiés
   - DELETE : Suppression pour utilisateurs authentifiés

### Pourquoi cette migration est nécessaire

Les politiques RLS peuvent être corrompues ou mal configurées, causant :
- Des réponses JSON d'erreur au lieu d'images (HTTP 200 avec `Content-Type: application/json`)
- Des erreurs 403 même si le fichier existe
- Des erreurs 404 même si le fichier est dans le bucket

Cette migration force la réapplication des politiques correctes.

---

## ✅ CHECKLIST FINALE

Après avoir exécuté la migration, vérifiez :

- [ ] La migration s'est exécutée sans erreur
- [ ] Le bucket "attachments" est public dans Supabase Dashboard
- [ ] Les 4 politiques RLS existent et sont actives
- [ ] Les images existantes s'affichent correctement
- [ ] Les nouveaux uploads fonctionnent
- [ ] Aucune erreur dans la console du navigateur

Si tous les points sont cochés, la migration est réussie ! 🎉

