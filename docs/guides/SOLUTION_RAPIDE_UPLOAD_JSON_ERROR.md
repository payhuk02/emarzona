# 🚨 Solution Rapide : Erreur "Le serveur retourne du JSON au lieu du fichier"

**Date** : 1 Février 2025  
**Problème** : Les fichiers uploadés retournent du JSON au lieu du contenu du fichier

---

## ⚡ Solution Rapide (5 minutes)

### Étape 1 : Créer le Bucket (si nécessaire)

**Si le bucket "attachments" n'existe pas** :

1. Allez dans **Supabase Dashboard** > **Storage** > **Buckets**
2. Cliquez sur **"New bucket"**
3. Remplissez :
   - **Name** : `attachments`
   - **Public bucket** : ✅ **ACTIVEZ** (très important !)
4. Cliquez sur **"Create bucket"**

**OU exécutez la migration SQL** (plus rapide) :

### Étape 2 : Exécuter la Migration SQL pour Créer le Bucket

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Cliquez sur **"New query"**
3. **Si le bucket n'existe pas** : Ouvrez `supabase/migrations/20250201_create_attachments_bucket.sql`
4. **Si le bucket existe déjà** : Ouvrez `supabase/migrations/20250201_verify_and_fix_attachments_bucket.sql`
5. **Copiez tout le contenu** du fichier
6. **Collez-le dans l'éditeur SQL**
7. Cliquez sur **"Run"** (ou `Ctrl+Enter`)
8. **Lisez les messages** dans la console (NOTICE et WARNING)

### Étape 3 : Vérifier le Résultat

Après l'exécution, vous devriez voir dans la console :

```
✅ Bucket attachments configuré comme PUBLIC
✅ Configuration correcte !
```

Si vous voyez des ⚠️ ou ❌, suivez les instructions affichées.

### Étape 4 : Attendre la Propagation

- ⏱️ **Attendez 2-3 minutes** (délai de propagation Supabase)
- 🔄 **Rechargez votre application** (F5)
- ✅ **Réessayez l'upload**

---

## 🔍 Vérification Manuelle

Pour vérifier que tout fonctionne :

1. **Testez une URL publique** dans votre navigateur :

   ```
   https://[votre-projet].supabase.co/storage/v1/object/public/attachments/[chemin-fichier]
   ```

   - Si l'image s'affiche → ✅ Problème résolu
   - Si vous voyez du JSON → ❌ Le problème persiste

2. **Vérifiez les politiques RLS** :
   - Allez dans **Supabase Dashboard** > **Storage** > **Policies**
   - Cherchez les politiques pour le bucket **"attachments"**
   - Vous devriez voir :
     - ✅ "Anyone can view attachments" (SELECT, TO public)
     - ✅ "Authenticated users can upload attachments" (INSERT, TO authenticated)

---

## 🐛 Si le Problème Persiste

### Option 1 : Vérifier les Logs Supabase

1. Allez dans **Supabase Dashboard** > **Logs** > **Storage**
2. Cherchez les erreurs liées au bucket "attachments"
3. Notez les messages d'erreur

### Option 2 : Recréer le Bucket

Si rien ne fonctionne, vous pouvez recréer le bucket :

1. **Supprimez** le bucket "attachments" (⚠️ Attention : supprime tous les fichiers)
2. **Créez un nouveau bucket** nommé "attachments"
3. **Activez "Public bucket"** immédiatement
4. **Exécutez la migration SQL** à nouveau

### Option 3 : Contacter le Support

Si le problème persiste après toutes ces étapes :

- 📧 Email : support@emarzona.com
- 💬 Chat : Disponible dans le dashboard
- 📝 Incluez :
  - Les messages d'erreur complets
  - Les logs Supabase
  - Une capture d'écran de la configuration du bucket

---

## 📋 Checklist de Vérification

Avant de réessayer l'upload, vérifiez :

- [ ] Le bucket "attachments" existe
- [ ] Le bucket "attachments" est PUBLIC
- [ ] La migration SQL a été exécutée avec succès
- [ ] Les politiques RLS sont présentes
- [ ] Vous avez attendu 2-3 minutes après la migration
- [ ] Vous avez rechargé l'application

---

## 💡 Prévention

Pour éviter ce problème à l'avenir :

1. **Toujours créer les buckets comme PUBLIC** si les fichiers doivent être accessibles publiquement
2. **Exécuter les migrations SQL** dans l'ordre
3. **Vérifier la configuration** après chaque migration
4. **Tester les uploads** après chaque changement de configuration

---

**Dernière mise à jour** : 1 Février 2025
