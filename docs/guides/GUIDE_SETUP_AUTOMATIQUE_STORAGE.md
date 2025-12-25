# 🤖 GUIDE - Configuration Automatique du Storage

**Date** : 27 octobre 2025  
**Durée** : 2 minutes

---

## 🎯 OBJECTIF

Créer automatiquement le bucket "videos" et le dossier "course-videos" via un script.

---

## 📋 ÉTAPE 1 : Exécuter le script

### Dans le terminal PowerShell :

```bash
node scripts/setup-storage.js
```

---

## ✅ RÉSULTAT ATTENDU

```
🚀 Démarrage de la configuration du Storage...

📦 Création du bucket "videos"...
✅ Bucket "videos" créé avec succès

📁 Création du dossier "course-videos"...
✅ Dossier "course-videos" créé

✅ CONFIGURATION TERMINÉE AVEC SUCCÈS !

📋 Résumé :
  ✅ Bucket "videos" : configuré
  ✅ Taille max : 500 MB par fichier
  ✅ Types acceptés : MP4, WebM, OGG, MOV, AVI
  ✅ Accès public : activé
  ✅ Dossier "course-videos" : créé

⚠️  IMPORTANT :
  Les politiques RLS doivent être créées via le Dashboard Supabase.
  Suivez le guide : GUIDE_CREATION_POLITIQUES_STORAGE.md

🎯 Prochaines étapes :
  1. Aller sur https://supabase.com/dashboard/project/your-project-id/storage/buckets/videos
  2. Cliquer sur l'onglet "Policies"
  3. Créer les 4 politiques (voir guide)

🎉 Vous pouvez maintenant uploader des vidéos !
```

---

## 📋 ÉTAPE 2 : Créer les politiques (Dashboard)

**⚠️ Les politiques ne peuvent PAS être créées via script.**

Vous devez les créer manuellement :

1. Aller sur : https://supabase.com/dashboard/project/your-project-id/storage/buckets/videos
2. Cliquer sur l'onglet **"Policies"**
3. Créer les 4 politiques selon le guide : `GUIDE_CREATION_POLITIQUES_STORAGE.md`

---

## 🔐 POLITIQUES À CRÉER

### 1. INSERT (Upload)
```
Nom: Authenticated users can upload videos
Opération: INSERT
Rôle: authenticated
WITH CHECK: bucket_id = 'videos' AND (storage.foldername(name))[1] = 'course-videos'
```

### 2. SELECT (Lecture)
```
Nom: Anyone can view videos
Opération: SELECT
Rôle: public
USING: bucket_id = 'videos'
```

### 3. UPDATE (Modification)
```
Nom: Users can update their own videos
Opération: UPDATE
Rôle: authenticated
USING: bucket_id = 'videos' AND owner = auth.uid()
WITH CHECK: bucket_id = 'videos' AND owner = auth.uid()
```

### 4. DELETE (Suppression)
```
Nom: Users can delete their own videos
Opération: DELETE
Rôle: authenticated
USING: bucket_id = 'videos' AND owner = auth.uid()
```

---

## ✅ VÉRIFICATION

### Dans Supabase Dashboard

1. **Menu Storage** → Bucket **"videos"** visible ✅
2. **Cliquer sur "videos"** → Dossier **"course-videos"** visible ✅
3. **Onglet "Policies"** → **4 politiques** créées ✅

---

## 🧪 TEST RAPIDE

### Test d'upload depuis l'application

1. Aller sur http://localhost:8082
2. Se connecter
3. Aller dans **Dashboard** → **Produits** → **Nouveau produit**
4. Sélectionner **"Cours en ligne"**
5. Remplir les étapes 1 et 2
6. Ajouter une leçon
7. Cliquer sur **"Ajouter une vidéo"**
8. Tester l'upload d'une petite vidéo (< 50 MB)

**Résultat attendu** :
- ✅ Barre de progression affichée
- ✅ Upload réussi
- ✅ Preview de la vidéo affichée

---

## ❌ EN CAS D'ERREUR

### Erreur : "Cannot find module '@supabase/supabase-js'"
**Solution** : Le package est déjà installé dans le projet. Si l'erreur persiste :
```bash
npm install @supabase/supabase-js
```

### Erreur : "Bucket already exists"
**Solution** : C'est normal ! Le script détectera le bucket existant et mettra à jour ses paramètres.

### Erreur upload dans l'app : "Access denied"
**Solution** : Les politiques ne sont pas créées. Suivez l'étape 2 pour les créer via le Dashboard.

---

## 🎯 ORDRE D'EXÉCUTION

```
1. ✅ Exécuter le script : node scripts/setup-storage.js
2. ✅ Créer les politiques via le Dashboard
3. ✅ Tester l'upload dans l'application
```

---

**Statut** : ✅ **SCRIPT PRÊT À L'EMPLOI**

Exécutez maintenant : `node scripts/setup-storage.js` 🚀

