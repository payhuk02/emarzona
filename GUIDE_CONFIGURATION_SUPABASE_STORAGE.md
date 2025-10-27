# 📦 GUIDE - Configuration Supabase Storage pour les Vidéos

**Date** : 27 octobre 2025  
**Phase** : Phase 3 - Upload de vidéos  
**Durée** : 5-10 minutes

---

## 🎯 OBJECTIF

Configurer le bucket Supabase Storage "videos" pour permettre aux enseignants d'uploader leurs vidéos de cours.

---

## 📋 ÉTAPES D'INSTALLATION

### ÉTAPE 1 : Se connecter à Supabase

1. Aller sur https://supabase.com
2. Se connecter avec votre compte
3. Sélectionner votre projet : `hbdnzajbyjakdhuavrvb`

### ÉTAPE 2 : Exécuter la migration SQL

1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New query"**
3. Copier le contenu du fichier `supabase/migrations/20251027_storage_videos_bucket.sql`
4. Coller dans l'éditeur SQL
5. Cliquer sur **"Run"** (ou Ctrl+Enter)

### ÉTAPE 3 : Vérifier la création du bucket

1. Dans le menu de gauche, cliquer sur **"Storage"**
2. Vous devriez voir un bucket nommé **"videos"**
3. Cliquer sur le bucket "videos"
4. Vérifier les paramètres :
   - ✅ Public : **true**
   - ✅ Taille max : **500 MB**
   - ✅ Types MIME acceptés : **video/mp4, video/webm, video/ogg, video/quicktime, video/x-msvideo**

### ÉTAPE 4 : Vérifier les politiques RLS

1. Dans le bucket "videos", cliquer sur **"Policies"**
2. Vous devriez voir 4 politiques :

| Politique | Type | Description |
|-----------|------|-------------|
| `Authenticated users can upload videos` | INSERT | Permet aux utilisateurs connectés d'uploader |
| `Anyone can view videos` | SELECT | Permet à tous de voir les vidéos |
| `Users can update their own videos` | UPDATE | Permet de modifier ses propres vidéos |
| `Users can delete their own videos` | DELETE | Permet de supprimer ses propres vidéos |

---

## ✅ VALIDATION

### Test 1 : Créer un dossier de test

1. Dans le bucket "videos", cliquer sur **"Create folder"**
2. Nom du dossier : `course-videos`
3. Cliquer sur **"Create"**
4. Le dossier devrait apparaître

### Test 2 : Upload manuel d'un fichier de test

1. Entrer dans le dossier `course-videos`
2. Cliquer sur **"Upload file"**
3. Sélectionner une petite vidéo de test (< 10 MB)
4. Cliquer sur **"Upload"**
5. Le fichier devrait apparaître dans la liste

### Test 3 : Récupérer l'URL publique

1. Cliquer sur le fichier uploadé
2. Copier l'URL publique
3. Ouvrir l'URL dans un nouvel onglet
4. La vidéo devrait se charger et être visible

---

## 🔍 RÉSOLUTION DES PROBLÈMES

### Problème 1 : "Bucket already exists"

**Solution** : Le bucket existe déjà. C'est normal si vous avez déjà exécuté la migration.

### Problème 2 : "Policy already exists"

**Solution** : Les politiques existent déjà. La migration utilise `IF NOT EXISTS`, donc c'est sans danger.

### Problème 3 : "Insufficient permissions"

**Solution** : 
1. Vérifier que vous êtes bien connecté avec un compte admin
2. Vérifier que vous avez sélectionné le bon projet

### Problème 4 : Upload échoue depuis l'application

**Solution** :
1. Vérifier que l'utilisateur est bien authentifié
2. Vérifier que le fichier est bien une vidéo
3. Vérifier que le fichier ne dépasse pas 500 MB
4. Regarder les logs dans la console du navigateur

---

## 📊 STRUCTURE DU BUCKET

```
videos/
└── course-videos/
    ├── 1730038800000-abc123.mp4
    ├── 1730038801000-def456.webm
    └── 1730038802000-ghi789.mov
```

---

## 🔐 SÉCURITÉ

### Politiques RLS

- ✅ **Upload** : Seuls les utilisateurs authentifiés peuvent uploader
- ✅ **Lecture** : Tout le monde peut voir les vidéos (public)
- ✅ **Modification** : Seul le propriétaire peut modifier ses vidéos
- ✅ **Suppression** : Seul le propriétaire peut supprimer ses vidéos

### Limitations

- ✅ **Taille max** : 500 MB par fichier
- ✅ **Types acceptés** : MP4, WebM, OGG, MOV, AVI
- ✅ **Dossier obligatoire** : `course-videos/`

---

## 🚀 PROCHAINES ÉTAPES

Une fois la configuration terminée :

1. ✅ Tester l'upload depuis l'application
2. ✅ Vérifier que les vidéos sont bien stockées
3. ✅ Tester la lecture des vidéos
4. ✅ Tester la suppression des vidéos

---

## 📝 COMMANDES UTILES

### Lister tous les fichiers d'un bucket (SQL)

```sql
SELECT *
FROM storage.objects
WHERE bucket_id = 'videos'
ORDER BY created_at DESC;
```

### Supprimer tous les fichiers d'un dossier (SQL)

```sql
DELETE FROM storage.objects
WHERE bucket_id = 'videos'
  AND (storage.foldername(name))[1] = 'course-videos';
```

### Obtenir la taille totale utilisée (SQL)

```sql
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects
WHERE bucket_id = 'videos'
GROUP BY bucket_id;
```

---

## ✅ CHECKLIST FINALE

- [ ] Bucket "videos" créé
- [ ] Politiques RLS configurées
- [ ] Dossier "course-videos" créé
- [ ] Upload de test réussi
- [ ] URL publique fonctionne
- [ ] Vidéo visible dans le navigateur

**Statut** : ✅ **CONFIGURATION COMPLÈTE**

---

**Développeur** : Intelli / payhuk02  
**Projet** : Payhuk SaaS Platform  
**Module** : Cours en ligne - Storage  
**Statut** : ✅ **PRÊT POUR L'UPLOAD**

