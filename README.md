# 🛍️ Emarzona - Plateforme de ecommerce et marketing

> **Plateforme E-commerce SaaS Haut de Gamme Multi-Produits**  
> Solution professionnelle pour la vente de produits digitaux, physiques, services et cours en ligne

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8_Strict-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/tests-50%2B-green)](./tests)
[![Security](https://img.shields.io/badge/security-95%2F100-success)](SECURITY.md)
[![Code Quality](https://img.shields.io/badge/quality-98%2F100-brightgreen)](TYPESCRIPT_STRICT_COMPLETE.md)
[![Audit](https://img.shields.io/badge/audit-2025--10--30-informational)](docs/audits/AUDIT_COMPLET_PAYHULA_2025_PROFESSIONNEL.md)

---

## 📋 Table des Matières

- [Présentation](#-présentation)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Documentation](#-documentation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Architecture](#-architecture)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 🎯 Présentation

**Emarzona** est une plateforme SaaS e-commerce moderne et complète permettant aux entrepreneurs et entreprises de vendre **4 types de produits différents** :

1. 📦 **Produits Digitaux** - eBooks, logiciels, templates, etc.
2. 🚚 **Produits Physiques** - Avec gestion d'inventaire et shipping
3. 💼 **Services** - Consultations, prestations avec système de réservation
4. 🎓 **Cours en Ligne** - Plateforme LMS complète avec progression et certificats

### ✨ Points Forts

- ✅ **Multi-produits** : 4 types de produits dans une seule plateforme
- ✅ **Paiements Avancés** : Acompte, paiement sécurisé (escrow), PayDunya/Moneroo
- ✅ **Shipping Professionnel** : Intégration FedEx pour calcul et suivi en temps réel
- ✅ **Messaging Intégré** : Chat vendor-client avec upload de médias
- ✅ **Système de Litiges** : Gestion professionnelle des disputes
- ✅ **Affiliation** : Programme d'affiliation avec commissions personnalisées
- ✅ **SEO Optimisé** : Meta tags, sitemaps, optimisation mobile
- ✅ **Reviews & Ratings** : Système d'avis clients complet
- ✅ **Analytics** : Google Analytics, Facebook Pixel, TikTok Pixel
- ✅ **Tests E2E** : 50+ tests Playwright pour garantir la qualité

---

## 🚀 Fonctionnalités

### 🛒 E-commerce Core

- [x] Gestion multi-produits (Digital, Physical, Services, Courses)
- [x] Panier d'achat intelligent
- [x] Processus de checkout fluide
- [x] Gestion des commandes
- [x] Facturation automatique (PDF)
- [x] Historique des achats

### 💳 Paiements

- [x] Intégration PayDunya & Moneroo
- [x] Paiement intégral
- [x] Paiement par acompte (%)
- [x] Paiement sécurisé (escrow)
- [x] Gestion des remboursements
- [x] Dashboard paiements

### 📦 Produits Digitaux

- [x] Upload de fichiers
- [x] Système de licences
- [x] Protection des téléchargements
- [x] Gestion des accès
- [x] Analytics par produit

### 🚚 Produits Physiques

- [x] Gestion d'inventaire avancée
- [x] Variants (taille, couleur, etc.)
- [x] Tracking de stock
- [x] Alertes stock faible
- [x] Intégration FedEx shipping
- [x] Calcul de frais de port en temps réel
- [x] Génération d'étiquettes
- [x] Tracking des colis

### 💼 Services

- [x] Système de réservation
- [x] Calendrier moderne (react-big-calendar)
- [x] Gestion de disponibilité
- [x] Staff assignment
- [x] Notifications de rendez-vous

### 🎓 Cours en Ligne

- [x] Éditeur de curriculum
- [x] Upload vidéos (YouTube, Vimeo, Google Drive)
- [x] Système de progression
- [x] Quizzes & examens
- [x] Certificats de fin de cours
- [x] Dashboard apprenant
- [x] Espace instructeur

### 🤝 Fonctionnalités Avancées

- [x] Programme d'affiliation
- [x] Reviews & ratings avec modération
- [x] SEO optimization (meta tags, FAQs)
- [x] Google Analytics integration
- [x] Facebook & TikTok Pixels
- [x] Messaging vendor-client
- [x] Système de litiges
- [x] Export CSV
- [x] Notifications multi-canaux
- [x] Multi-langue (i18n)
- [x] Mode sombre

### 🔒 Sécurité & Admin

- [x] Row Level Security (RLS) Supabase
- [x] Validation des inputs
- [x] Protection CSRF
- [x] Gestion des rôles (customer, vendor, admin)
- [x] Logs d'activité
- [x] Dashboard admin

---

## 🛠️ Stack Technique

### Frontend

- **Framework** : React 18.3 + TypeScript 5.8
- **Build Tool** : Vite 5.4
- **Routing** : React Router DOM 6.30
- **State Management** : TanStack Query (React Query 5.83)
- **UI Library** : ShadCN UI + Radix UI
- **Styling** : TailwindCSS 3.4
- **Forms** : React Hook Form + Zod validation
- **Animations** : Framer Motion 12.23

### Backend & Database

- **BaaS** : Supabase (PostgreSQL)
- **Authentication** : Supabase Auth
- **Storage** : Supabase Storage
- **Real-time** : Supabase Realtime subscriptions

### Paiements & Services Externes

- **Paiements** : PayDunya, Moneroo
- **Shipping** : FedEx API
- **Analytics** : Google Analytics, Facebook Pixel, TikTok Pixel
- **Chat** : Crisp
- **Monitoring** : Sentry

### Tests

- **E2E Testing** : Playwright 1.40
- **Unit Testing** : Vitest 4.0
- **Test Library** : Testing Library

### DevOps

- **Hosting** : Vercel
- **CI/CD** : GitHub Actions
- **Version Control** : Git + GitHub

---

## 📦 Installation

### Prérequis

- Node.js 20+
- npm ou yarn
- Compte Supabase
- Compte Vercel (pour déploiement)

### Installation Locale

```bash
# 1. Cloner le repo
git clone https://github.com/payhuk02/payhula.git
cd payhula
# Note: Le nom du dépôt peut être renommé ultérieurement

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 4. Lancer le dev server
npm run dev
```

Le site sera accessible sur `http://localhost:8080`

### Variables d'Environnement

Créer un fichier `.env` à la racine :

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paiements (⚠️ IMPORTANT: Configuré dans Supabase Edge Functions)
# ❌ NE PAS mettre les clés API PayDunya/Moneroo ici - elles sont dans Supabase
# Les clés API doivent être configurées dans Supabase Dashboard:
# Settings → Edge Functions → Secrets (pas dans ce fichier .env)
# Voir: MIGRATION_CLES_API_VERS_SUPABASE.md pour la migration
# Voir: GUIDE_CONFIGURATION_SUPABASE_EDGE_FUNCTIONS.md pour la configuration complète

# Shipping
VITE_FEDEX_API_KEY=your_fedex_key

# Analytics
VITE_GA_TRACKING_ID=your_ga_id
VITE_FB_PIXEL_ID=your_fb_pixel_id
VITE_TIKTOK_PIXEL_ID=your_tiktok_pixel_id

# Sentry
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## 📚 Documentation

- [📖 Guide d'Installation](docs/INSTALLATION.md)
- [👤 Guide Utilisateur](docs/USER_GUIDE.md)
- [🏗️ Architecture](docs/ARCHITECTURE.md)
- [🔌 Documentation API](docs/API.md)
- [🚀 Guide de Déploiement](docs/DEPLOYMENT.md)
- [🧪 Guide des Tests](tests/README.md)
- [📝 Changelog](CHANGELOG.md)

---

## 🧪 Tests

### Exécuter les tests

```bash
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Tests E2E par module
npm run test:e2e:auth
npm run test:e2e:products
npm run test:e2e:marketplace

# Tests avec UI interactive
npx playwright test --ui

# Tests en mode debug
npx playwright test --debug
```

### Couverture des Tests

- ✅ **50+ tests E2E** avec Playwright
- ✅ Authentification (9 tests)
- ✅ Produits (23 tests)
- ✅ Achats & Paiements (7 tests)
- ✅ Shipping (8 tests)
- ✅ Messaging (8 tests)

Voir [tests/README.md](tests/README.md) pour plus de détails.

---

## 🚀 Déploiement

### Déploiement Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Production
vercel --prod
```

### Build Production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`.

---

## 🏗️ Architecture

### Structure du Projet

```
emarzona/
├── src/
│   ├── components/          # Composants React
│   │   ├── digital/         # Composants produits digitaux
│   │   ├── physical/        # Composants produits physiques
│   │   ├── services/        # Composants services
│   │   ├── courses/         # Composants cours en ligne
│   │   ├── shared/          # Composants partagés
│   │   └── ui/              # ShadCN UI components
│   ├── hooks/               # Custom React hooks
│   │   ├── digital/         # Hooks produits digitaux
│   │   ├── physical/        # Hooks produits physiques
│   │   ├── services/        # Hooks services
│   │   └── courses/         # Hooks cours
│   ├── lib/                 # Utilitaires & config
│   │   ├── supabase.ts      # Client Supabase
│   │   └── utils.ts         # Helper functions
│   ├── pages/               # Pages de l'application
│   ├── types/               # Types TypeScript
│   └── App.tsx              # Composant racine
├── supabase/
│   └── migrations/          # Migrations DB
├── tests/                   # Tests E2E Playwright
│   ├── auth/               # Tests authentification
│   ├── products/           # Tests produits
│   └── e2e/                # Tests end-to-end
├── docs/                    # Documentation
└── scripts/                 # Scripts utilitaires
```

### Base de Données

**11 tables principales** pour les cours :

- `online_courses`
- `course_modules`
- `course_lessons`
- `course_enrollments`
- `course_progress`
- `course_reviews`
- `course_quizzes`
- `quiz_questions`
- `quiz_attempts`
- `course_certificates`
- `course_instructors`

**6 tables pour les produits digitaux** :

- `digital_products`
- `digital_product_files`
- `digital_licenses`
- `digital_downloads`
- `digital_licenses_history`
- `digital_product_analytics`

**Tables physiques, services, affiliation, reviews, etc.**

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le schéma complet.

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Règles de Contribution

- ✅ Code TypeScript typé
- ✅ Tests E2E pour les nouvelles fonctionnalités
- ✅ Documentation à jour
- ✅ Suivre les conventions de code du projet
- ✅ Commits descriptifs

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Emarzona Team** - Développement principal
- **Contributeurs** - Voir [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

## 🙏 Remerciements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Playwright](https://playwright.dev/)

---

## 📞 Support

- 📧 Email: support@emarzona.com
- 💬 Discord: [Rejoindre notre communauté](https://discord.gg/emarzona)
- 📝 Issues: [GitHub Issues](https://github.com/payhuk02/payhula/issues)
- 📚 Docs: [documentation.emarzona.com](https://documentation.emarzona.com)

---

<div align="center">

**Fait avec ❤️ par l'équipe Emarzona**

[Site Web](https://emarzona.com) • [Documentation](https://docs.emarzona.com) • [Demo](https://demo.emarzona.com)

</div>
