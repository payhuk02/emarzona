# Payhuk Mobile App

Application mobile React Native pour Payhuk.

## 📱 Structure du Projet

```
mobile/
├── src/
│   ├── components/      # Composants réutilisables
│   ├── screens/         # Écrans de l'application
│   ├── navigation/      # Configuration de navigation
│   ├── hooks/           # Hooks personnalisés
│   ├── services/        # Services API
│   ├── utils/           # Utilitaires
│   ├── types/           # Types TypeScript
│   └── constants/       # Constantes
├── android/             # Configuration Android
├── ios/                 # Configuration iOS
├── package.json
└── tsconfig.json
```

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# iOS
cd ios && pod install && cd ..

# Démarrer Metro bundler
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
```

## 📦 Dépendances Principales

- **React Native** - Framework mobile
- **React Navigation** - Navigation
- **React Query** - Gestion des données
- **Supabase** - Backend
- **React Native Paper** - UI Components
- **React Native Reanimated** - Animations
- **React Native Gesture Handler** - Gestures

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` :

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
API_URL=your_api_url
```

## 📱 Fonctionnalités

- ✅ Authentification
- ✅ Dashboard
- ✅ Produits (Digital, Physical, Services)
- ✅ Commandes
- ✅ Paiements
- ✅ Notifications
- ✅ Profil utilisateur
- ✅ Gamification
- ✅ Analytics

## 🏗️ Architecture

L'application suit une architecture modulaire avec :
- **Screens** : Écrans principaux
- **Components** : Composants réutilisables
- **Services** : Logique métier et API
- **Hooks** : Logique réutilisable
- **Navigation** : Gestion de la navigation

## 📝 Notes

Cette application mobile est en cours de développement. La structure de base est prête pour l'implémentation complète.

