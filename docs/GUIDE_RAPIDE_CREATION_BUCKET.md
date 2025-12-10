# 🚀 Guide Rapide : Création du Bucket "attachments"

**Date** : 1 Février 2025  
**Problème** : Le bucket "attachments" n'existe pas, empêchant l'upload de fichiers

---

## ⚡ Solution Rapide (5 minutes)

### ÉTAPE 1 : Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **"Payhuk"**
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### ÉTAPE 2 : Exécuter la Migration SQL

1. Dans l'éditeur SQL, cliquez sur **"New query"**
2. Ouvrez le fichier : `supabase/migrations/20250201_create_and_configure_attachments_bucket.sql`
3. **Copiez TOUT le contenu** du fichier
4. **Collez** dans l'éditeur SQL
5. Cliquez sur **"Run"** (ou `Ctrl+Enter`)

### ÉTAPE 3 : Vérifier le Résultat

Après l'exécution, vous devriez voir dans les messages :

```
✅ Bucket "attachments" créé avec succès
✅ Configuration complète et correcte !
```

Si vous voyez des ⚠️ ou ❌, lisez attentivement les messages pour identifier le problème.

### ÉTAPE 4 : Vérifier dans Supabase Dashboard

1. Allez dans **Storage** > **Buckets**
2. Vérifiez que **"attachments"** apparaît dans la liste
3. Cliquez sur **"attachments"**
4. Vérifiez que **"Public bucket"** est **activé** ✅
5. Vérifiez que **"Allowed MIME types"** est **vide** ou **"Any"**

### ÉTAPE 5 : Attendre et Tester

1. **Attendez 1-2 minutes** (délai de propagation Supabase)
2. **Rechargez votre application** (F5)
3. **Vérifiez que vous êtes connecté**
4. **Réessayez l'upload** d'un fichier image
5. **Surveillez les logs** dans la console

---

## ✅ Résultat Attendu

Après avoir exécuté la migration, le diagnostic devrait indiquer :

```
✅ Bucket "attachments":
   Existe: ✅ OUI
   Public: ✅ OUI
   Peut uploader: ✅ OUI
```

Et lors de l'upload, vous devriez voir :

```
[INFO] ✅ File verified in bucket after upload
[INFO] Message envoyé avec succès
```

---

## 🚨 Si le Problème Persiste

### Vérification 1 : Bucket Créé

- ✅ Vérifiez dans **Supabase Dashboard > Storage > Buckets** que "attachments" existe
- ✅ Si ce n'est pas le cas, réexécutez la migration SQL

### Vérification 2 : Bucket Public

- ✅ Vérifiez que **"Public bucket"** est activé
- ✅ Si ce n'est pas activé, activez et sauvegardez

### Vérification 3 : Restrictions MIME

- ✅ Vérifiez que **"Allowed MIME types"** est **vide**
- ✅ Si ce n'est pas vide, exécutez : `supabase/migrations/20250201_fix_attachments_mime_types.sql`

### Vérification 4 : Politiques RLS

- ✅ Vérifiez que **4 politiques** existent (SELECT, INSERT, UPDATE, DELETE)
- ✅ Si ce n'est pas le cas, réexécutez la migration SQL

---

## 📋 Fichiers de Migration

- **`20250201_create_and_configure_attachments_bucket.sql`** : Migration complète (CRÉE + CONFIGURE)
- **`20250201_fix_attachments_mime_types.sql`** : Supprime les restrictions MIME (si nécessaire)

---

## 💡 Points Importants

1. **Le bucket doit être créé** : C'est la première étape obligatoire
2. **Le bucket doit être public** : Sinon les uploads échoueront
3. **Pas de restrictions MIME** : Pour éviter l'erreur "mime type application/json is not supported"
4. **Attendre la propagation** : Supabase a besoin de 1-2 minutes après la création

---

**Dernière mise à jour** : 1 Février 2025  
**Migration SQL** : `supabase/migrations/20250201_create_and_configure_attachments_bucket.sql`

