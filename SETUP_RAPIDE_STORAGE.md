# ⚡ SETUP RAPIDE - Storage Vidéos (1 minute)

---

## 🎯 ÉTAPE UNIQUE

### 1. Ouvrir Supabase Dashboard

Aller sur : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new

### 2. Copier-Coller le script

1. Ouvrir le fichier : **`supabase/migrations/SETUP_COMPLET_STORAGE_VIDEOS.sql`**
2. **Copier TOUT** le contenu (Ctrl+A puis Ctrl+C)
3. **Coller** dans l'éditeur SQL de Supabase
4. Cliquer sur **"Run"** (ou Ctrl+Enter)

### 3. Vérifier le résultat

Vous devriez voir dans les messages :

```
✅ Bucket "videos" créé/mis à jour avec succès
✅ Nombre de politiques créées : 4
🎉 CONFIGURATION COMPLÈTE RÉUSSIE !

📋 Résumé :
  ✅ Bucket "videos" : configuré
  ✅ Taille max : 500 MB par fichier
  ✅ Types acceptés : MP4, WebM, OGG, MOV, AVI
  ✅ Politiques RLS : 4 politiques actives

🎯 Prochaines étapes :
  1. Créer le dossier "course-videos" dans Storage
  2. Tester l'upload depuis votre application

🚀 Vous pouvez maintenant uploader des vidéos !
```

---

## ✅ VÉRIFICATION

### Dans le Dashboard Supabase

1. **Menu Storage** (gauche) → Vous devriez voir le bucket **"videos"** ✅
2. **Cliquer sur "videos"** → Onglet **"Policies"** → **4 politiques** visibles ✅

---

## 📁 CRÉER LE DOSSIER course-videos

1. Cliquer sur le bucket **"videos"**
2. Cliquer sur **"Create folder"**
3. Nom : `course-videos`
4. Cliquer sur **"Create"**

---

## 🧪 TESTER L'APPLICATION

1. Aller sur http://localhost:8082
2. Se connecter
3. **Dashboard** → **Produits** → **Nouveau produit**
4. Sélectionner **"Cours en ligne"**
5. Remplir les étapes 1 et 2
6. Ajouter une leçon
7. Cliquer sur **"Ajouter une vidéo"**
8. Tester l'upload d'une petite vidéo (< 50 MB)

**Résultat attendu** :
- ✅ Barre de progression affichée
- ✅ Upload réussi en quelques secondes
- ✅ Preview de la vidéo affichée
- ✅ Durée calculée automatiquement

---

## 📊 CE QUI A ÉTÉ CRÉÉ

### Bucket "videos"
- **Public** : ✅ Oui
- **Taille max** : 500 MB par fichier
- **Types acceptés** : MP4, WebM, OGG, MOV, AVI

### Politiques RLS (4)
1. **INSERT** : Les utilisateurs authentifiés peuvent uploader
2. **SELECT** : Tout le monde peut voir les vidéos (public)
3. **UPDATE** : Les propriétaires peuvent modifier leurs vidéos
4. **DELETE** : Les propriétaires peuvent supprimer leurs vidéos

---

## ✅ C'EST TERMINÉ !

**Temps total** : ⏱️ **1 minute**

Vous pouvez maintenant :
- ✅ Uploader vos propres vidéos
- ✅ Intégrer des vidéos YouTube
- ✅ Intégrer des vidéos Vimeo
- ✅ Créer des cours complets avec vidéos

---

**🎉 BRAVO ! Le système de Storage est opérationnel !** 🎉

