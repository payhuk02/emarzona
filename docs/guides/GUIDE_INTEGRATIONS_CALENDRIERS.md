# 📅 Guide : Intégrations Calendriers Externes

**Date** : 1 Février 2025  
**Version** : 1.0.0

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Configuration Google Calendar](#configuration-google-calendar)
3. [Configuration Outlook](#configuration-outlook)
4. [Configuration iCal](#configuration-ical)
5. [Synchronisation](#synchronisation)
6. [Gestion des Conflits](#gestion-des-conflits)
7. [Dépannage](#dépannage)

---

## 🎯 Introduction

Les intégrations calendriers permettent de synchroniser vos réservations de services avec vos calendriers externes (Google Calendar, Outlook, iCal). Cela évite les doubles réservations et garde votre planning à jour.

### Fonctionnalités

- ✅ **Synchronisation bidirectionnelle** : Import et export automatique
- ✅ **Création automatique d'événements** : Pour chaque réservation
- ✅ **Détection de conflits** : Alerte en cas de chevauchement
- ✅ **Synchronisation automatique** : À intervalles réguliers
- ✅ **Logs détaillés** : Historique des synchronisations

---

## 📅 Configuration Google Calendar

### Étape 1 : Obtenir les Credentials

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un existant
3. Activez l'API Google Calendar
4. Créez des credentials OAuth 2.0
5. Configurez les URI de redirection

### Étape 2 : Configurer l'Intégration

1. Allez dans **Dashboard** > **Services** > **Intégrations Calendriers**
2. Cliquez sur **"Nouvelle Intégration"**
3. Sélectionnez **"Google Calendar"**
4. Remplissez les informations :
   - **Calendar ID** : `primary` ou l'ID de votre calendrier
   - **Nom du calendrier** : Nom descriptif
   - **Email du calendrier** : Email associé

### Étape 3 : Autoriser l'Accès

1. Cliquez sur **"Autoriser Google Calendar"**
2. Connectez-vous avec votre compte Google
3. Autorisez l'accès au calendrier
4. L'intégration est créée

### Étape 4 : Configurer la Synchronisation

- **Direction** :
  - **Import uniquement** : Les événements Google → Emarzona
  - **Export uniquement** : Les réservations Emarzona → Google
  - **Bidirectionnelle** : Synchronisation dans les deux sens

- **Synchronisation automatique** :
  - Activez pour synchroniser automatiquement
  - Intervalle : 15, 30, 60 minutes

- **Création d'événements** :
  - **Pour les réservations** : Crée un événement pour chaque réservation
  - **Pour la disponibilité** : Crée des événements pour les créneaux disponibles

---

## 📧 Configuration Outlook

### Étape 1 : Obtenir les Credentials

1. Allez sur [Azure Portal](https://portal.azure.com/)
2. Créez une application Azure AD
3. Configurez les permissions Microsoft Graph
4. Créez un secret client

### Étape 2 : Configurer l'Intégration

1. Allez dans **Dashboard** > **Services** > **Intégrations Calendriers**
2. Cliquez sur **"Nouvelle Intégration"**
3. Sélectionnez **"Outlook"**
4. Remplissez les informations :
   - **Calendar ID** : ID du calendrier Outlook
   - **Email** : Email Outlook

### Étape 3 : Autoriser l'Accès

1. Cliquez sur **"Autoriser Outlook"**
2. Connectez-vous avec votre compte Microsoft
3. Autorisez l'accès
4. L'intégration est créée

---

## 🗓️ Configuration iCal

### Étape 1 : Obtenir l'URL iCal

1. Ouvrez votre application de calendrier (Apple Calendar, etc.)
2. Partagez le calendrier
3. Copiez l'URL iCal (format `.ics`)

### Étape 2 : Configurer l'Intégration

1. Allez dans **Dashboard** > **Services** > **Intégrations Calendriers**
2. Cliquez sur **"Nouvelle Intégration"**
3. Sélectionnez **"iCal"**
4. Collez l'URL iCal
5. Configurez la synchronisation

---

## 🔄 Synchronisation

### Synchronisation Manuelle

1. Allez dans **Intégrations Calendriers**
2. Cliquez sur **"Synchroniser"** pour une intégration
3. Choisissez le type :
   - **Complète** : Synchronise tous les événements
   - **Incrémentale** : Synchronise seulement les changements
   - **Manuelle** : Synchronise maintenant

### Synchronisation Automatique

La synchronisation automatique se fait à l'intervalle configuré :

- **15 minutes** : Pour les calendriers très actifs
- **30 minutes** : Recommandé pour la plupart des cas
- **60 minutes** : Pour les calendriers peu actifs

### Logs de Synchronisation

Consultez les logs pour voir :

- Nombre d'événements créés/mis à jour/supprimés
- Erreurs éventuelles
- Durée de la synchronisation
- Dernière synchronisation

---

## ⚠️ Gestion des Conflits

### Détection Automatique

Le système détecte automatiquement les conflits quand :

- Un événement externe chevauche une réservation
- Une réservation chevauche un événement externe
- Deux événements sont créés au même moment

### Résolution des Conflits

1. **Alerte** : Vous recevez une notification
2. **Vérification** : Consultez les détails du conflit
3. **Résolution** :
   - **Déplacer la réservation** : Choisir un autre créneau
   - **Annuler l'événement externe** : Si c'est un doublon
   - **Ignorer** : Si le conflit est acceptable

---

## 🔧 Dépannage

### Problème : Synchronisation échoue

**Solutions** :

1. Vérifiez que les credentials sont valides
2. Vérifiez que les tokens ne sont pas expirés
3. Vérifiez les permissions de l'application
4. Consultez les logs pour plus de détails

### Problème : Événements dupliqués

**Solutions** :

1. Vérifiez la direction de synchronisation
2. Désactivez temporairement la synchronisation automatique
3. Nettoyez les doublons manuellement
4. Réactivez la synchronisation

### Problème : Synchronisation lente

**Solutions** :

1. Réduisez l'intervalle de synchronisation
2. Utilisez la synchronisation incrémentale
3. Limitez le nombre d'événements synchronisés
4. Vérifiez votre connexion internet

---

## 💡 Bonnes Pratiques

### Sécurité

- ✅ **Ne partagez jamais vos credentials**
- ✅ **Utilisez des tokens avec expiration**
- ✅ **Révisez régulièrement les permissions**
- ✅ **Désactivez les intégrations inutilisées**

### Performance

- ✅ **Utilisez la synchronisation incrémentale** quand possible
- ✅ **Limitez l'intervalle de synchronisation** selon vos besoins
- ✅ **Nettoyez régulièrement les logs** anciens
- ✅ **Surveillez les erreurs** de synchronisation

### Organisation

- ✅ **Utilisez des calendriers séparés** pour différents services
- ✅ **Nommez clairement** vos intégrations
- ✅ **Documentez les configurations** importantes
- ✅ **Testez avant de mettre en production**

---

## ❓ FAQ

### Puis-je avoir plusieurs intégrations pour le même calendrier ?

Oui, mais cela peut créer des doublons. Il est recommandé d'avoir une seule intégration par calendrier.

### Que se passe-t-il si je supprime une intégration ?

Les événements déjà synchronisés restent dans votre calendrier externe, mais la synchronisation s'arrête.

### Les événements sont-ils supprimés si je supprime une réservation ?

Oui, si la synchronisation bidirectionnelle est activée et que l'événement a été créé par Emarzona.

### Puis-je synchroniser plusieurs calendriers ?

Oui, créez une intégration pour chaque calendrier.

---

## 🆘 Support

Pour toute question ou problème :

- 📧 Email : support@emarzona.com
- 💬 Chat : Disponible dans le dashboard
- 📚 Documentation : `/docs`

---

**Dernière mise à jour** : 1 Février 2025
