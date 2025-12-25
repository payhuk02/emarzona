# 📦 Guide : Gestion des Versions de Produits Digitaux

**Date** : 1 Février 2025  
**Version** : 1.0.0

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Créer une Nouvelle Version](#créer-une-nouvelle-version)
3. [Upload de Fichiers](#upload-de-fichiers)
4. [Gérer les Versions](#gérer-les-versions)
5. [Notifications Automatiques](#notifications-automatiques)
6. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🎯 Introduction

Le système de versions permet de gérer les différentes versions de vos produits digitaux (logiciels, templates, eBooks, etc.). Chaque version peut contenir plusieurs fichiers et les clients sont automatiquement notifiés des nouvelles versions.

### Fonctionnalités Principales

- ✅ **Upload de fichiers multiples** : Ajoutez plusieurs fichiers à chaque version
- ✅ **Numérotation sémantique** : Format major.minor.patch (ex: 1.2.3)
- ✅ **Versions beta** : Marquez les versions en test
- ✅ **Notifications automatiques** : Les clients sont notifiés des nouvelles versions
- ✅ **Historique complet** : Consultez toutes les versions publiées

---

## 🆕 Créer une Nouvelle Version

### Étape 1 : Accéder à la Gestion des Versions

1. Allez dans **Dashboard** > **Produits Digitaux**
2. Sélectionnez un produit digital
3. Cliquez sur **"Gestion des Versions"** ou accédez à `/dashboard/digital/products/[productId]/versions`

### Étape 2 : Créer la Version

1. Cliquez sur **"Nouvelle Version"**
2. Remplissez le formulaire :
   - **Numéro de version** : Format `major.minor.patch` (ex: `2.0.0`)
   - **Nom de la version** : Nom descriptif (ex: "Version 2.0 - Nouveau Design")
   - **Notes de version** : Description des changements
   - **Version courante** : Cochez si c'est la version principale
   - **Version beta** : Cochez si c'est une version de test

### Étape 3 : Uploader les Fichiers

1. Cliquez sur **"Sélectionner des fichiers"**
2. Choisissez un ou plusieurs fichiers (max 500MB par fichier)
3. Les fichiers s'affichent avec leur progression
4. Attendez que tous les fichiers soient uploadés (barre de progression)

### Étape 4 : Finaliser

1. Vérifiez que tous les fichiers sont bien uploadés (badge vert "Uploadé")
2. Cliquez sur **"Créer la version"**
3. La version apparaît dans l'historique

---

## 📤 Upload de Fichiers

### Formats Supportés

- **Archives** : ZIP, RAR, 7Z
- **Documents** : PDF, DOCX, XLSX
- **Médias** : MP4, MP3, Images
- **Code** : JS, TS, PY, etc.

### Limites

- **Taille maximale par fichier** : 500MB
- **Nombre de fichiers** : Illimité (dans la limite de la taille totale)
- **Compression** : Les images sont automatiquement compressées (sauf pour les produits digitaux)

### Gestion des Erreurs

Si un fichier ne peut pas être uploadé :

1. Vérifiez la taille du fichier (max 500MB)
2. Vérifiez votre connexion internet
3. Réessayez en cliquant sur le fichier en erreur
4. Si le problème persiste, contactez le support

---

## 🔧 Gérer les Versions

### Consulter l'Historique

L'historique affiche toutes les versions avec :
- Numéro de version
- Statut (Active, Beta, Dépréciée)
- Date de publication
- Nombre de téléchargements
- Taille totale des fichiers

### Modifier une Version

1. Cliquez sur le menu **⋮** à droite de la version
2. Sélectionnez **"Modifier"**
3. Modifiez les informations
4. Sauvegardez

### Supprimer une Version

⚠️ **Attention** : La suppression est définitive !

1. Cliquez sur le menu **⋮** à droite de la version
2. Sélectionnez **"Supprimer"**
3. Confirmez la suppression

### Marquer comme Version Courante

Quand vous créez une nouvelle version et cochez **"Version courante"** :
- Toutes les autres versions perdent ce statut
- Les clients voient cette version comme la principale
- Les notifications sont envoyées automatiquement

---

## 🔔 Notifications Automatiques

### Quand les Notifications sont Envoyées

Les clients reçoivent une notification quand :
- Une nouvelle version est marquée comme **"Version courante"**
- Ils ont acheté le produit précédemment
- La commande est complétée

### Types de Notifications

- **Email** : Email automatique avec les détails de la mise à jour
- **In-App** : Notification dans le dashboard client
- **Les deux** : Email + notification in-app

### Désactiver les Notifications

Les notifications sont activées par défaut. Pour les désactiver :
1. Allez dans les paramètres du produit
2. Décochez **"Notifications automatiques"**

---

## 💡 Bonnes Pratiques

### Numérotation Sémantique

Utilisez le format `major.minor.patch` :

- **Major** (1.0.0 → 2.0.0) : Changements majeurs, incompatibilités
- **Minor** (1.0.0 → 1.1.0) : Nouvelles fonctionnalités, compatibilité maintenue
- **Patch** (1.0.0 → 1.0.1) : Corrections de bugs, petites améliorations

### Notes de Version

Rédigez des notes claires avec :
- ✅ Liste des nouvelles fonctionnalités
- 🐛 Corrections de bugs
- ⚠️ Notes de migration (si nécessaire)
- 📝 Améliorations de performance

### Gestion des Fichiers

- **Nommez clairement** vos fichiers (ex: `mon-produit-v2.0.0.zip`)
- **Testez avant de publier** : Téléchargez et testez la version
- **Versionnez vos fichiers** : Incluez le numéro de version dans le nom

### Versions Beta

Utilisez les versions beta pour :
- Tester avec un groupe restreint de clients
- Recueillir des retours avant la version finale
- Corriger les bugs avant la publication

---

## ❓ FAQ

### Puis-je modifier les fichiers d'une version après publication ?

Non, une fois publiée, une version ne peut pas être modifiée. Créez une nouvelle version (patch) pour corriger les problèmes.

### Les clients peuvent-ils télécharger d'anciennes versions ?

Oui, les clients peuvent accéder à toutes les versions qu'ils ont achetées dans leur espace de téléchargement.

### Que se passe-t-il si j'upload un mauvais fichier ?

Vous pouvez supprimer la version et en créer une nouvelle avec les bons fichiers.

### Les notifications sont-elles envoyées immédiatement ?

Oui, dès qu'une version est marquée comme "Version courante", les notifications sont envoyées dans les minutes qui suivent.

---

## 🆘 Support

Pour toute question ou problème :
- 📧 Email : support@emarzona.com
- 💬 Chat : Disponible dans le dashboard
- 📚 Documentation : `/docs`

---

**Dernière mise à jour** : 1 Février 2025

