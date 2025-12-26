# 🔧 Solution - Erreur "Le serveur retourne du JSON au lieu du fichier"

**Date**: 1 Février 2025  
**Problème**: Les fichiers sont uploadés avec succès mais l'URL publique retourne du JSON au lieu du fichier

---

## 🔍 Diagnostic

D'après les logs :

- ✅ **Image compressée** : La compression fonctionne
- ✅ **Fichier vérifié dans le bucket** : `✅ File verified in bucket after upload`
- ❌ **URL publique retourne du JSON** : `Public URL returns JSON instead of file`

**Conclusion** : Le fichier existe dans le bucket, mais les **politiques RLS bloquent l'accès public**.

---

## ✅ Solution : Exécuter la Migration SQL

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**

### Étape 2 : Exécuter la Migration

1. Ouvrez le fichier : `supabase/migrations/20250201_verify_and_fix_attachments_bucket.sql`
2. Copiez tout le contenu
3. Collez-le dans le SQL Editor de Supabase
4. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`

### Étape 3 : Vérifier les Résultats

La migration affichera :

- ✅ Bucket attachments public: ✅ OUI
- ✅ Politique lecture publique: ✅ EXISTE
- ✅ Politique upload authentifié: ✅ EXISTE

Si vous voyez des ❌, la migration indiquera ce qui manque.

---

## 🔍 Vérification Manuelle

### 1. Vérifier que le bucket est public

Dans Supabase Dashboard :

1. **Storage** > **Buckets**
2. Cliquez sur **"attachments"**
3. Vérifiez que **"Public bucket"** est activé (icône de globe 🌐)

### 2. Vérifier les politiques RLS

Dans Supabase Dashboard :

1. **Storage** > **Policies**
2. Filtrez par bucket **"attachments"**
3. Vérifiez que ces politiques existent :

   **"Anyone can view attachments"** :
   - Operation: `SELECT`
   - Target roles: `public`
   - USING: `bucket_id = 'attachments'`

   **"Authenticated users can upload attachments"** :
   - Operation: `INSERT`
   - Target roles: `authenticated`
   - WITH CHECK: `bucket_id = 'attachments'`

---

## 🧪 Test après Correction

### Test 1 : Dans le navigateur

Ouvrez la console (F12) et testez :

```javascript
// Remplacer par votre URL Supabase et un chemin de fichier réel
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const filePath = 'vendor-message-attachments/[conversation-id]/[filename]';
const testUrl = `${supabaseUrl}/storage/v1/object/public/attachments/${filePath}`;

fetch(testUrl)
  .then(response => {
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    return response.blob();
  })
  .then(blob => {
    console.log('✅ Fichier chargé avec succès, taille:', blob.size, 'bytes');
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
  });
```

**Résultat attendu** :

- Status: `200`
- Content-Type: `image/png` ou `image/jpeg` (pas `application/json`)
- Blob size > 0

### Test 2 : Dans l'application

1. Rechargez la page (`F5`)
2. Essayez d'envoyer une nouvelle image
3. Vérifiez que l'image s'affiche correctement

---

## ⚠️ Délai de Propagation

**Important** : Après avoir exécuté la migration, attendez **2-3 minutes** pour que Supabase propage les changements de politiques RLS.

---

## 📋 Checklist de Vérification

- [ ] Migration SQL exécutée avec succès
- [ ] Bucket "attachments" est PUBLIC (icône de globe)
- [ ] Politique "Anyone can view attachments" existe avec `TO public`
- [ ] Politique "Authenticated users can upload attachments" existe
- [ ] Attente de 2-3 minutes après la migration
- [ ] Test dans le navigateur : URL retourne l'image (pas du JSON)
- [ ] Test dans l'application : Upload et affichage fonctionnent

---

## 🔧 Si le Problème Persiste

### Vérifier les Logs Supabase

1. Allez dans **Logs** > **Postgres Logs**
2. Cherchez les erreurs liées à `storage.objects` et `attachments`
3. Vérifiez s'il y a des erreurs de permissions

### Vérifier les Politiques Manuellement

Exécutez cette requête SQL dans Supabase :

```sql
-- Vérifier toutes les politiques pour attachments
SELECT
  policyname,
  cmd,
  roles::text,
  qual::text,
  with_check::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%attachment%'
    OR qual::text LIKE '%attachment%'
    OR with_check::text LIKE '%attachment%'
  );
```

### Vérifier le Statut du Bucket

```sql
SELECT
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id = 'attachments';
```

Le champ `public` doit être `true`.

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Collectez ces informations** :
   - Résultat de la migration SQL
   - Résultat des requêtes de vérification ci-dessus
   - Screenshot du Supabase Dashboard (bucket et politiques)

2. **Vérifiez** :
   - Que toutes les migrations ont été exécutées
   - Que le bucket est bien public dans le dashboard
   - Que les politiques RLS sont actives (pas désactivées)

---

**Dernière mise à jour** : 1 Février 2025
