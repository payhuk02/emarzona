# 🧪 GUIDE DE TEST - PHASE 3 : UPLOAD DE VIDÉOS

**Date** : 27 octobre 2025  
**Phase** : Phase 3 - Upload de vidéos  
**Durée des tests** : 20-30 minutes

---

## 🎯 OBJECTIF DES TESTS

Valider que le système d'upload de vidéos fonctionne correctement avec les 3 méthodes :
1. ✅ Upload direct vers Supabase Storage
2. ✅ Intégration de vidéos YouTube
3. ✅ Intégration de vidéos Vimeo

---

## 📋 PRÉREQUIS

Avant de commencer les tests :

1. ✅ **Application démarrée** : `npm run dev`
2. ✅ **Utilisateur connecté** avec une boutique
3. ✅ **Supabase Storage configuré** (voir `GUIDE_CONFIGURATION_SUPABASE_STORAGE.md`)
4. ✅ **Migration SQL exécutée** : `20251027_storage_videos_bucket.sql`

---

## 🧪 TEST 1 : UPLOAD DIRECT (SUPABASE STORAGE)

### Étape 1 : Créer un cours
1. Aller sur `/dashboard/products/new`
2. Sélectionner **"Cours en ligne"**
3. Remplir l'étape 1 (Informations de base)
4. Cliquer sur **"Suivant"**

### Étape 2 : Ajouter une section
1. Cliquer sur **"Ajouter une section"**
2. Titre : "Introduction au cours"
3. Description : "Première section de test"
4. Enregistrer

### Étape 3 : Ajouter une leçon
1. Cliquer sur **"Ajouter une leçon"**
2. Un formulaire d'édition s'affiche

### Étape 4 : Configurer la leçon
1. **Titre** : "Leçon 1 - Test upload"
2. **Description** : "Test de l'upload de vidéo"
3. Cliquer sur **"Ajouter une vidéo"**

### Étape 5 : Uploader une vidéo
1. Le composant VideoUploader s'affiche
2. Par défaut, l'onglet **"Upload"** est sélectionné
3. Cliquer sur **"Sélectionner une vidéo"**
4. Choisir un fichier vidéo (MP4, WebM, OGG, MOV - max 500 MB)
5. Cliquer sur **"Uploader"**

### ✅ Résultats attendus
- ✅ Barre de progression affichée (0% → 100%)
- ✅ Message de succès : "✅ Vidéo uploadée !"
- ✅ Preview de la vidéo affichée
- ✅ Durée calculée automatiquement
- ✅ Bouton "Changer de vidéo" disponible

### ✅ Vérification Supabase
1. Aller sur Supabase Dashboard → Storage → videos
2. Entrer dans le dossier `course-videos`
3. ✅ Le fichier vidéo est présent
4. ✅ Le nom du fichier est au format : `timestamp-random.ext`
5. ✅ L'URL publique fonctionne

---

## 🧪 TEST 2 : INTÉGRATION YOUTUBE

### Étape 1 : Créer une nouvelle leçon
1. Dans la même section, cliquer sur **"Ajouter une leçon"**
2. Titre : "Leçon 2 - Test YouTube"
3. Cliquer sur **"Ajouter une vidéo"**

### Étape 2 : Sélectionner YouTube
1. Cliquer sur l'onglet **"YouTube"**
2. Entrer une URL YouTube valide :
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
3. Cliquer sur **"Ajouter la vidéo YouTube"**

### ✅ Résultats attendus
- ✅ Message de succès : "✅ Vidéo YouTube ajoutée"
- ✅ L'URL est sauvegardée
- ✅ Le thumbnail YouTube est généré automatiquement
- ✅ Le type vidéo est "youtube"

### ❌ Test d'erreur
1. Entrer une URL invalide : `https://example.com/video`
2. Cliquer sur **"Ajouter la vidéo YouTube"**
3. ✅ Erreur affichée : "URL YouTube invalide"

---

## 🧪 TEST 3 : INTÉGRATION VIMEO

### Étape 1 : Créer une nouvelle leçon
1. Cliquer sur **"Ajouter une leçon"**
2. Titre : "Leçon 3 - Test Vimeo"
3. Cliquer sur **"Ajouter une vidéo"**

### Étape 2 : Sélectionner Vimeo
1. Cliquer sur l'onglet **"Vimeo"**
2. Entrer une URL Vimeo valide :
   ```
   https://vimeo.com/123456789
   ```
3. Cliquer sur **"Ajouter la vidéo Vimeo"**

### ✅ Résultats attendus
- ✅ Message de succès : "✅ Vidéo Vimeo ajoutée"
- ✅ L'URL est sauvegardée
- ✅ Le type vidéo est "vimeo"

### ❌ Test d'erreur
1. Entrer une URL invalide : `https://example.com/video`
2. Cliquer sur **"Ajouter la vidéo Vimeo"**
3. ✅ Erreur affichée : "URL Vimeo invalide"

---

## 🧪 TEST 4 : VALIDATION DES FICHIERS

### Test 4.1 : Type de fichier invalide
1. Créer une nouvelle leçon
2. Cliquer sur **"Ajouter une vidéo"**
3. Sélectionner un fichier non-vidéo (ex: image.png, document.pdf)
4. ✅ Erreur affichée : "Format vidéo non supporté. Utilisez MP4, WebM, OGG ou MOV."

### Test 4.2 : Fichier trop volumineux
1. Essayer d'uploader un fichier > 500 MB
2. ✅ Erreur affichée : "Le fichier est trop volumineux. Maximum : 500 MB"

---

## 🧪 TEST 5 : MODIFICATION DE VIDÉO

### Étape 1 : Modifier une leçon existante
1. Cliquer sur le bouton **"Éditer"** d'une leçon
2. Cliquer sur **"Modifier la vidéo"**

### Étape 2 : Changer de type
1. Si la vidéo actuelle est un upload, passer à YouTube
2. Entrer une nouvelle URL YouTube
3. Cliquer sur **"Ajouter la vidéo YouTube"**

### ✅ Résultats attendus
- ✅ La vidéo est remplacée
- ✅ Le type de vidéo est mis à jour
- ✅ L'ancienne URL est remplacée

---

## 🧪 TEST 6 : AFFICHAGE DES LEÇONS

### Vérification visuelle
1. Retourner à la vue normale (non-édition)
2. ✅ Chaque leçon affiche :
   - Icône PlayCircle
   - Titre de la leçon
   - Badge "Aperçu gratuit" si `is_preview` = true
   - Nombre de leçons par section

---

## 🧪 TEST 7 : PUBLICATION DU COURS

### Étape 1 : Compléter le cours
1. Remplir l'étape 3 (Configuration)
2. Aller à l'étape 4 (Révision)

### Étape 2 : Vérifier le résumé
1. ✅ Le nombre de sections est correct
2. ✅ Le nombre de leçons est correct
3. ✅ Les vidéos sont listées

### Étape 3 : Publier
1. Cliquer sur **"Publier le cours"**
2. ✅ Toast de succès
3. ✅ Redirection vers `/dashboard/products`

### Étape 4 : Vérifier Supabase
```sql
-- Vérifier les leçons
SELECT 
  cl.id,
  cl.title,
  cl.video_type,
  cl.video_url,
  cl.video_duration_seconds,
  cl.is_preview
FROM course_lessons cl
JOIN courses c ON c.id = cl.course_id
ORDER BY cl.created_at DESC
LIMIT 10;
```

✅ Résultats attendus :
- ✅ Les 3 leçons sont créées
- ✅ Chaque leçon a le bon `video_type` (upload, youtube, vimeo)
- ✅ Chaque leçon a une `video_url` valide
- ✅ Les durées sont enregistrées

---

## 🧪 TEST 8 : PERFORMANCE

### Test de charge (optionnel)
1. Upload d'une grande vidéo (200-400 MB)
2. ✅ La barre de progression se met à jour en temps réel
3. ✅ Pas de freeze de l'interface
4. ✅ Upload réussi en moins de 5 minutes

---

## 📊 CHECKLIST FINALE

### Fonctionnalités
- [ ] Upload direct vers Supabase Storage
- [ ] Intégration YouTube avec validation URL
- [ ] Intégration Vimeo avec validation URL
- [ ] Barre de progression d'upload
- [ ] Calcul automatique de la durée
- [ ] Validation des types de fichiers
- [ ] Validation de la taille des fichiers
- [ ] Modification de vidéo
- [ ] Preview de la vidéo uploadée
- [ ] Sauvegarde correcte en base de données

### UX
- [ ] Messages d'erreur clairs
- [ ] Messages de succès informatifs
- [ ] Indicateurs de chargement
- [ ] Interface intuitive
- [ ] Boutons désactivés pendant upload
- [ ] Annulation possible

### Sécurité
- [ ] Upload limité aux utilisateurs authentifiés
- [ ] Taille de fichier limitée
- [ ] Types de fichiers restreints
- [ ] Politiques RLS actives

---

## ❌ RÉSOLUTION DES PROBLÈMES

### Problème 1 : Upload échoue
**Causes possibles** :
- Bucket "videos" non créé
- Politiques RLS non configurées
- Fichier trop volumineux
- Type de fichier non supporté

**Solution** :
1. Vérifier la configuration Supabase Storage
2. Regarder la console du navigateur pour les erreurs
3. Vérifier les logs Supabase

### Problème 2 : Barre de progression ne bouge pas
**Causes possibles** :
- Problème réseau
- Fichier corrompu

**Solution** :
1. Rafraîchir la page
2. Essayer avec un autre fichier
3. Vérifier la connexion internet

### Problème 3 : Vidéo uploadée mais URL non accessible
**Causes possibles** :
- Bucket non public
- Politique SELECT manquante

**Solution** :
1. Vérifier que le bucket est public
2. Vérifier la politique "Anyone can view videos"

---

## 🎯 CRITÈRES DE SUCCÈS

✅ **Phase 3 réussie si** :
- Upload direct fonctionne (100% de réussite)
- YouTube intégration fonctionne
- Vimeo intégration fonctionne
- Validation des fichiers fonctionne
- Données sauvegardées correctement en BDD
- Aucune erreur de console
- UX fluide et intuitive

---

## 🚀 PROCHAINE PHASE

Une fois la Phase 3 validée :
- **Phase 4** : Page de détail du cours avec lecteur vidéo
- **Phase 5** : Progression utilisateur et tracking
- **Phase 6** : Quiz et certificats

---

**Statut** : ⏳ **EN TEST**  
**Développeur** : Intelli / payhuk02  
**Projet** : Payhuk SaaS Platform

