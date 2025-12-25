# 📹 GUIDE - Utiliser Google Drive pour les vidéos de cours

**Date** : 27 octobre 2025  
**Nouveau** : Onglet Google Drive ajouté !

---

## 🎯 POURQUOI GOOGLE DRIVE ?

**Avantages** :
- ✅ Stockage gratuit (15 GB)
- ✅ Upload de grandes vidéos (jusqu'à 5 TB)
- ✅ Streaming direct
- ✅ Pas de limite de bande passante
- ✅ Gestion facile des fichiers

---

## 📋 COMMENT UTILISER

### ÉTAPE 1 : Uploader votre vidéo sur Google Drive

1. Aller sur https://drive.google.com
2. Cliquer sur **"Nouveau"** → **"Importer un fichier"**
3. Sélectionner votre vidéo
4. Attendre la fin de l'upload

### ÉTAPE 2 : Obtenir le lien de partage

1. **Clic droit** sur la vidéo → **"Obtenir le lien"**
2. Dans la fenêtre qui s'ouvre :
   - Cliquer sur **"Modifier"** 
   - Sélectionner **"Toute personne disposant du lien"**
   - Assurez-vous que le rôle est **"Lecteur"**
3. Cliquer sur **"Copier le lien"**

### ÉTAPE 3 : Ajouter le lien dans Payhuk

1. Dans le formulaire de création de leçon
2. Cliquer sur **"Ajouter une vidéo"**
3. Sélectionner l'onglet **"Drive"** (icône ☁️)
4. Coller le lien copié
5. Cliquer sur **"Ajouter la vidéo Google Drive"**

---

## 🔗 FORMATS D'URL ACCEPTÉS

### Format 1 : Lien de partage standard
```
https://drive.google.com/file/d/1abc123XYZ.../view?usp=sharing
```

### Format 2 : Lien d'ouverture
```
https://drive.google.com/open?id=1abc123XYZ...
```

**Les deux formats sont automatiquement convertis en URL d'intégration !**

---

## ⚙️ CONVERSION AUTOMATIQUE

Le système convertit automatiquement votre lien en format "preview" :

**Votre lien** :
```
https://drive.google.com/file/d/1abc123XYZ/view
```

**Converti en** :
```
https://drive.google.com/file/d/1abc123XYZ/preview
```

Cela permet l'intégration directe de la vidéo dans le lecteur.

---

## ✅ VÉRIFICATION DES PERMISSIONS

### ⚠️ IMPORTANT : Paramètres de partage

Pour que vos étudiants puissent voir la vidéo, assurez-vous que :

1. **Accès** : "Toute personne disposant du lien"
2. **Rôle** : "Lecteur" (viewer)
3. **Téléchargement** : Optionnel (vous pouvez l'empêcher)

### Comment vérifier :

1. Clic droit sur la vidéo → **"Partager"**
2. Vérifier en bas : **"Accès général"**
3. Doit afficher : **"Toute personne disposant du lien - Lecteur"**

---

## 🎬 EXEMPLE COMPLET

### 1. Upload sur Drive
```
📁 Mon cours React
  └── 📹 01-introduction.mp4 (150 MB) ✅ Uploadé
```

### 2. Paramètres de partage
```
Accès : Toute personne disposant du lien
Rôle  : Lecteur
```

### 3. Lien copié
```
https://drive.google.com/file/d/1abc123_exemple_XYZ/view?usp=sharing
```

### 4. Dans Payhuk
```
Onglet "Drive" → Coller le lien → Ajouter
✅ Vidéo Google Drive ajoutée
```

---

## 🆚 COMPARAISON DES OPTIONS

| Critère | Upload Supabase | YouTube | Vimeo | **Google Drive** |
|---------|----------------|---------|-------|------------------|
| Taille max | 500 MB | Illimité | 500 MB (gratuit) | **5 TB** |
| Bande passante | Limitée | Illimitée | Limitée | **Illimitée** |
| Contrôle | ✅ Total | ❌ Public | ✅ Privé | ✅ **Privé** |
| Coût | Gratuit (limité) | Gratuit | Payant (premium) | **Gratuit (15 GB)** |
| Qualité | HD | 4K | 4K | **HD/4K** |

---

## 💡 CONSEILS ET ASTUCES

### 1. Organisation des fichiers
```
Mon Drive/
└── Mes Cours/
    ├── Formation React/
    │   ├── 01-introduction.mp4
    │   ├── 02-composants.mp4
    │   └── 03-hooks.mp4
    └── Formation Node/
        └── ...
```

### 2. Nommage des fichiers
```
✅ BON : 01-introduction-react.mp4
❌ MAUVAIS : vidéo1.mp4
```

### 3. Empêcher le téléchargement (optionnel)
1. Clic droit sur la vidéo → Partager
2. Cliquer sur l'icône ⚙️ (Paramètres)
3. Décocher **"Les lecteurs peuvent télécharger"**

### 4. Utiliser un dossier dédié
Créez un dossier spécifique pour vos cours et organisez vos vidéos par section.

---

## ❌ RÉSOLUTION DES PROBLÈMES

### Problème 1 : "URL Google Drive invalide"
**Cause** : Le lien n'est pas au bon format  
**Solution** : 
- Utilisez le lien de partage depuis Google Drive
- Assurez-vous qu'il commence par `https://drive.google.com/`

### Problème 2 : "Impossible de lire la vidéo"
**Cause** : Permissions incorrectes  
**Solution** :
- Vérifier les paramètres de partage
- S'assurer que l'accès est "Toute personne disposant du lien"

### Problème 3 : "La vidéo est floue"
**Cause** : Compression de Google Drive  
**Solution** :
- Uploader en qualité HD ou 4K
- Google Drive maintient la qualité originale

---

## 🎯 LIMITATIONS À CONNAÎTRE

### Quotas Google Drive
- **Stockage gratuit** : 15 GB (partagé avec Gmail et Photos)
- **Upgrade** : Google One à partir de 1,99€/mois pour 100 GB
- **Lecture simultanée** : Pas de limite connue

### Formats vidéo supportés
- ✅ MP4
- ✅ AVI
- ✅ MOV
- ✅ WMV
- ✅ FLV
- ✅ WebM

---

## ✅ CHECKLIST

Avant d'ajouter une vidéo Google Drive :

- [ ] Vidéo uploadée sur Google Drive
- [ ] Paramètres de partage : "Toute personne disposant du lien"
- [ ] Rôle : Lecteur
- [ ] Lien copié
- [ ] Lien collé dans Payhuk onglet "Drive"
- [ ] Message de confirmation affiché

---

## 🎉 RÉSUMÉ

**4 options d'upload maintenant disponibles** :

1. 📤 **Upload direct** : Supabase Storage (500 MB)
2. 📺 **YouTube** : Vidéos publiques YouTube
3. 🎥 **Vimeo** : Vidéos Vimeo
4. ☁️ **Google Drive** : Vos vidéos privées (jusqu'à 5 TB)

**Choisissez l'option qui convient le mieux à vos besoins !**

---

**Développeur** : Intelli / payhuk02  
**Projet** : Payhuk SaaS Platform  
**Statut** : ✅ **GOOGLE DRIVE AJOUTÉ**

