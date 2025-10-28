# 📖 Guide d'Installation Payhula

Ce guide vous accompagnera pas à pas dans l'installation et la configuration de la plateforme Payhula.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Locale](#installation-locale)
3. [Configuration Supabase](#configuration-supabase)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Configuration des Services Externes](#configuration-des-services-externes)
6. [Premier Lancement](#premier-lancement)
7. [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Logiciels Requis

- **Node.js** : Version 20.x ou supérieure
  - [Télécharger Node.js](https://nodejs.org/)
  - Vérifier : `node --version`

- **npm** : Version 10.x ou supérieure (inclus avec Node.js)
  - Vérifier : `npm --version`

- **Git** : Pour cloner le repository
  - [Télécharger Git](https://git-scm.com/)
  - Vérifier : `git --version`

### Comptes Requis

- **Supabase** : [Créer un compte gratuit](https://supabase.com)
- **Vercel** (optionnel) : Pour le déploiement [Créer un compte](https://vercel.com)
- **PayDunya/Moneroo** : Pour les paiements
- **FedEx** (optionnel) : Pour le shipping

---

## 🚀 Installation Locale

### Étape 1 : Cloner le Repository

```bash
# Via HTTPS
git clone https://github.com/payhuk02/payhula.git

# OU via SSH
git clone git@github.com:payhuk02/payhula.git

# Entrer dans le dossier
cd payhula
```

### Étape 2 : Installer les Dépendances

```bash
npm install
```

Cette commande installera :
- React, TypeScript, Vite
- ShadCN UI et composants
- Supabase client
- TanStack Query
- Et toutes les autres dépendances

⏱️ **Temps estimé** : 2-3 minutes

### Étape 3 : Configurer les Variables d'Environnement

```bash
# Créer le fichier .env
cp .env.example .env
```

Ou créer manuellement un fichier `.env` à la racine :

```env
# === SUPABASE (REQUIS) ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# === PAIEMENTS (REQUIS) ===
VITE_PAYDUNYA_MASTER_KEY=your-paydunya-master-key
VITE_PAYDUNYA_PRIVATE_KEY=your-paydunya-private-key
VITE_PAYDUNYA_TOKEN=your-paydunya-token

VITE_MONEROO_API_KEY=your-moneroo-api-key
VITE_MONEROO_SITE_ID=your-moneroo-site-id

# === SHIPPING (OPTIONNEL) ===
VITE_FEDEX_API_KEY=your-fedex-api-key
VITE_FEDEX_SECRET_KEY=your-fedex-secret-key
VITE_FEDEX_ACCOUNT_NUMBER=your-account-number

# === ANALYTICS (OPTIONNEL) ===
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_FB_PIXEL_ID=your-facebook-pixel-id
VITE_TIKTOK_PIXEL_ID=your-tiktok-pixel-id

# === MONITORING (OPTIONNEL) ===
VITE_SENTRY_DSN=your-sentry-dsn

# === CRISP CHAT (OPTIONNEL) ===
VITE_CRISP_WEBSITE_ID=your-crisp-website-id
```

---

## 🗄️ Configuration Supabase

### Étape 1 : Créer un Projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Choisir un nom, mot de passe et région
4. Attendre la création (1-2 minutes)

### Étape 2 : Récupérer les Clés API

1. Aller dans **Settings** → **API**
2. Copier :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon/public` → `VITE_SUPABASE_ANON_KEY`

### Étape 3 : Exécuter les Migrations

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Exécuter les migrations
supabase db push
```

**OU** exécuter manuellement dans Supabase SQL Editor :

1. Aller dans **SQL Editor**
2. Exécuter chaque fichier de `supabase/migrations/` dans l'ordre
3. Vérifier qu'il n'y a pas d'erreurs

### Migrations Principales

1. `20250101_initial_schema.sql` - Tables de base
2. `20250115_digital_products.sql` - Produits digitaux
3. `20250115_physical_products.sql` - Produits physiques
4. `20250115_service_products.sql` - Services
5. `20250120_courses_complete.sql` - Cours en ligne
6. `20250122_advanced_features.sql` - Fonctionnalités avancées
7. Et tous les autres fichiers...

### Étape 4 : Configurer le Storage

Dans Supabase Dashboard :

1. Aller dans **Storage**
2. Créer les buckets suivants :
   - `products` (public)
   - `courses` (public)
   - `avatars` (public)
   - `documents` (private)
   - `chat-media` (private)

3. Configurer les politiques RLS pour chaque bucket

---

## 🔐 Configuration des Services Externes

### PayDunya

1. Créer un compte sur [PayDunya](https://paydunya.com)
2. Aller dans **Développeurs** → **API Keys**
3. Copier :
   - Master Key
   - Private Key
   - Token

### Moneroo

1. Créer un compte sur [Moneroo](https://moneroo.io)
2. Aller dans **Settings** → **API**
3. Générer une clé API
4. Copier l'API Key et le Site ID

### FedEx (Optionnel)

1. Créer un compte développeur [FedEx Developer](https://developer.fedex.com)
2. Créer une application
3. Copier :
   - API Key
   - Secret Key
   - Account Number

### Google Analytics

1. Créer une propriété GA4
2. Copier le Tracking ID (format : `G-XXXXXXXXXX`)

### Facebook Pixel

1. Créer un Pixel dans Facebook Events Manager
2. Copier le Pixel ID

### Sentry (Monitoring)

1. Créer un compte [Sentry](https://sentry.io)
2. Créer un nouveau projet React
3. Copier le DSN

---

## 🎬 Premier Lancement

### Lancer le Serveur de Développement

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:8080**

### Créer un Compte Admin

1. Aller sur http://localhost:8080/auth
2. S'inscrire avec un email
3. Dans Supabase :
   - Aller dans **Authentication** → **Users**
   - Trouver votre utilisateur
   - Modifier le rôle dans `profiles.role` → `'admin'`

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';
```

### Vérifications

✅ **Dashboard accessible** : http://localhost:8080/dashboard  
✅ **Création de produits** : Tester les 4 types  
✅ **Paiements** : Mode test activé  
✅ **Pas d'erreurs** : Vérifier la console

---

## 🧪 Lancer les Tests

### Installation Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Exécuter les Tests

```bash
# Tests E2E
npm run test:e2e

# Tests spécifiques
npm run test:e2e:auth
npm run test:e2e:products

# Mode interactif
npx playwright test --ui
```

---

## 🐛 Dépannage

### Problème : npm install échoue

**Solution** :
```bash
# Nettoyer le cache
npm cache clean --force

# Supprimer node_modules
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

### Problème : Erreur Supabase "Invalid API key"

**Solution** :
1. Vérifier que les clés dans `.env` sont correctes
2. S'assurer qu'il n'y a pas d'espaces avant/après les clés
3. Redémarrer le serveur de dev

### Problème : Migrations SQL échouent

**Solution** :
1. Exécuter les migrations une par une
2. Vérifier les erreurs dans Supabase Logs
3. S'assurer que les tables n'existent pas déjà

### Problème : Port 8080 déjà utilisé

**Solution** :
```bash
# Changer le port dans vite.config.ts
export default defineConfig({
  server: {
    port: 3000, // Ou un autre port
  },
});
```

### Problème : Build échoue

**Solution** :
```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Vérifier les erreurs ESLint
npm run lint

# Build en mode dev pour voir les erreurs
npm run build:dev
```

---

## 📚 Prochaines Étapes

Après l'installation :

1. ✅ Lire le [Guide Utilisateur](USER_GUIDE.md)
2. ✅ Consulter l'[Architecture](ARCHITECTURE.md)
3. ✅ Explorer la [Documentation API](API.md)
4. ✅ Préparer le [Déploiement](DEPLOYMENT.md)

---

## 💬 Besoin d'Aide ?

- 📧 Email : support@payhula.com
- 💬 Discord : [Rejoindre](https://discord.gg/payhula)
- 🐛 Issues : [GitHub Issues](https://github.com/payhuk02/payhula/issues)

---

**Installation complétée avec succès !** 🎉

