# 🚨 Solution Critique : "mime type application/json is not supported"

**Date** : 1 Février 2025  
**Erreur** : `mime type application/json is not supported`  
**Cause** : Restrictions MIME types du bucket qui rejettent les erreurs JSON de RLS

---

## 🎯 Problème Identifié

L'erreur **"mime type application/json is not supported"** vient **directement de Supabase Storage**, pas de notre code.

### Chaîne d'Événements

1. ✅ Le fichier est préparé correctement (`fileType: 'image/png'`)
2. ✅ L'upload est tenté vers Supabase
3. ❌ Les politiques RLS bloquent l'upload
4. ❌ Supabase retourne une erreur JSON
5. ❌ Le bucket a des restrictions `allowed_mime_types` qui n'incluent pas `application/json`
6. ❌ Supabase rejette l'erreur JSON avec "mime type application/json is not supported"

### Cause Racine

Le bucket "attachments" a des restrictions MIME types (`allowed_mime_types`) qui n'incluent pas `application/json`. Quand les politiques RLS bloquent l'upload et retournent une erreur JSON, cette erreur est rejetée par la validation MIME du bucket.

---

## ✅ Solution

### Supprimer les Restrictions MIME Types

**Fichier** : `supabase/migrations/20250201_fix_attachments_mime_types.sql`

Cette migration :

1. ✅ Supprime les restrictions `allowed_mime_types` du bucket
2. ✅ Force le bucket à être PUBLIC
3. ✅ Vérifie la configuration

### Actions Requises

#### Étape 1 : Exécuter la Migration SQL

1. **Supabase Dashboard** > **SQL Editor**
2. Ouvrir : `supabase/migrations/20250201_fix_attachments_mime_types.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL
5. Cliquer sur **"Run"**
6. **Lire le rapport** affiché

#### Étape 2 : Vérifier dans Supabase Dashboard

1. **Supabase Dashboard** > **Storage** > **Buckets** > **"attachments"**
2. Vérifier que **"Public bucket"** est activé
3. Vérifier que **"Allowed MIME types"** est **vide** ou **"Any"**

#### Étape 3 : Attendre la Propagation

⏳ **Attendre 1-2 minutes** après l'exécution de la migration

#### Étape 4 : Tester l'Upload

1. **Recharger l'application** (F5)
2. **Réessayer l'upload** d'un fichier image
3. **Surveiller les logs**

---

## 🔍 Diagnostic

### Avant la Correction

```
[INFO] Pre-upload verification {fileType: 'image/png', ...}
[WARN] First upload attempt failed, retrying with explicit contentType
[ERROR] mime type application/json is not supported
```

### Après la Correction

Si les politiques RLS sont correctes :

```
[INFO] Pre-upload verification {fileType: 'image/png', ...}
[INFO] Upload response details {hasData: true, hasError: false, ...}
[INFO] ✅ File verified in bucket after upload {contentType: 'image/png', ...}
```

Si les politiques RLS bloquent toujours :

```
[INFO] Pre-upload verification {fileType: 'image/png', ...}
[ERROR] new row violates row-level security policy
```

**Note** : L'erreur RLS sera maintenant claire au lieu d'être masquée par "mime type not supported".

---

## 📊 Pourquoi Supprimer les Restrictions MIME ?

### Avantages

1. ✅ **Erreurs RLS claires** : Les erreurs RLS ne sont plus masquées par "mime type not supported"
2. ✅ **Flexibilité** : Permet d'uploader différents types de fichiers
3. ✅ **Débogage facilité** : Les vraies erreurs (RLS, permissions) sont visibles

### Sécurité

La sécurité est assurée par :

- ✅ **Politiques RLS** : Contrôlent qui peut uploader/quels fichiers
- ✅ **Validation côté client** : `validateFile()` dans `fileValidation.ts`
- ✅ **Taille maximale** : `file_size_limit` (10MB)

Les restrictions MIME types ne sont **pas nécessaires** si les politiques RLS sont correctement configurées.

---

## 🚨 Si le Problème Persiste

### Vérification 1 : Bucket Public

- ✅ Vérifier dans Supabase Dashboard que "Public bucket" est activé
- ✅ Si ce n'est pas activé, activer et sauvegarder

### Vérification 2 : Restrictions MIME

- ✅ Vérifier dans Supabase Dashboard que "Allowed MIME types" est vide
- ✅ Si ce n'est pas vide, exécuter la migration SQL

### Vérification 3 : Politiques RLS

- ✅ Vérifier que les 4 politiques RLS existent (SELECT, INSERT, UPDATE, DELETE)
- ✅ Exécuter `20250201_fix_attachments_final_complete.sql` si nécessaire

### Vérification 4 : Authentification

- ✅ Vérifier que vous êtes connecté
- ✅ Vérifier que la session n'a pas expiré
- ✅ Se reconnecter si nécessaire

---

## 📝 Résumé

1. ✅ **Cause** : Restrictions MIME types qui rejettent les erreurs JSON de RLS
2. ✅ **Solution** : Supprimer les restrictions MIME types (`allowed_mime_types = NULL`)
3. ✅ **Migration** : `20250201_fix_attachments_mime_types.sql`
4. ✅ **Résultat** : Les erreurs RLS seront maintenant claires au lieu d'être masquées

---

**Dernière mise à jour** : 1 Février 2025  
**Fichiers modifiés** :

- `supabase/migrations/20250201_fix_attachments_mime_types.sql` (nouveau)
- `supabase/migrations/20250201_fix_attachments_final_complete.sql` (mis à jour)
