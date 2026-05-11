# 📝 Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-10-28

### 🎉 Version Majeure - Plateforme E-commerce Complète

### ✨ Ajouts (Added)

#### Tests & Qualité

- **Tests E2E Playwright** : Suite complète de 50+ tests automatisés
  - Tests d'authentification (9 tests)
  - Tests produits digitaux (6 tests)
  - Tests produits physiques (5 tests)
  - Tests services (5 tests)
  - Tests cours en ligne (7 tests)
  - Tests flux d'achat E2E (7 tests)
  - Tests shipping & tracking (8 tests)
  - Tests messaging & paiements (8 tests)
- **CI/CD GitHub Actions** : Workflow automatisé pour tests
- **Global setup/teardown** : Configuration tests Playwright
- **Test helpers & fixtures** : Utilitaires de test réutilisables

#### Shipping & Logistics

- **Intégration FedEx API** : Calcul de frais de port en temps réel
- **Génération d'étiquettes** : Création automatique d'étiquettes d'expédition
- **Tracking de colis** : Suivi en temps réel des expéditions
- **Timeline de tracking** : Historique complet des événements d'expédition
- **Dashboard Inventory** : Gestion professionnelle de l'inventaire
  - Vue d'ensemble du stock
  - Alertes stock faible
  - Filtres avancés
  - Export CSV
  - Mise à jour de stock en masse

#### Paiements Avancés

- **Paiement par acompte** : Option de paiement en pourcentage
- **Paiement sécurisé (Escrow)** : Système de séquestre pour transactions
- **Gestion des versements** : Dashboard de gestion des paiements multiples
- **Messagerie order** : Chat vendor-client intégré aux commandes
- **Upload de médias** : Partage de fichiers dans les conversations
- **Système de litiges** : Gestion professionnelle des disputes
  - Ouverture de litiges
  - Réponses et historique
  - Intervention admin
  - Résolution avec preuve

#### Pages & UI

- **PhysicalProductDetail** : Page détaillée pour produits physiques
- **ServiceDetail** : Page détaillée pour services
- **PayBalance** : Page de paiement du solde pour achats
- **OrderMessaging** : Interface de messagerie pour commandes
- **PaymentManagement** : Dashboard de gestion des paiements
- **DisputeDetail** : Page de détails et gestion des litiges
- **ServiceCalendar** : Calendrier moderne avec react-big-calendar

#### Composants

- **ProductImages** : Galerie d'images professionnelle avec zoom
- **StaffCard** : Carte d'affichage du personnel
- **PaymentOptionsForm** : Formulaire de configuration des options de paiement
- **OrderDetailDialog** : Dialog amélioré avec actions avancées

### 🔄 Modifications (Changed)

#### Wizards V2

- **CreateDigitalProductWizard_v2** : Wizard amélioré avec 6 étapes
  - Ajout SEO & FAQs
  - Meilleure validation
  - Upload d'images multiples
- **CreatePhysicalProductWizard_v2** : Wizard complet avec inventory
  - Gestion des variants
  - Options de paiement
  - Configuration shipping
- **CreateServiceWizard_v2** : Wizard professionnel services
  - Disponibilité avancée
  - Gestion du personnel
  - Options de réservation

#### Hooks

- **useCreatePhysicalOrder** : Support des paiements avancés
- **useCreateServiceOrder** : Gestion escrow et messaging
- **useShipping** : Intégration FedEx complète
- **useInventory** : Gestion avancée de l'inventaire
- **useAdvancedPayments** : Gestion des paiements multiples
- **useMessaging** : Système de messagerie order
- **useDisputes** : Gestion des litiges

#### Base de Données

- **Migration payment_options** : Colonne `payment_options` sur products
- **Migration advanced_payments** : Tables `secured_payments`, `payment_installments`
- **Migration messaging** : Tables `order_conversations`, `conversation_messages`
- **Migration disputes** : Tables `disputes`, `dispute_responses`
- **Migration inventory** : Amélioration tables inventaire

### 🐛 Corrections (Fixed)

#### Erreurs de Build

- Correction import malformé dans `useInventory.ts`
- Correction import React Query dans hooks
- Correction imports Supabase (8 fichiers)
- Correction import Input dans `PhysicalVariantsBuilder.tsx`
- Correction "React is not defined" dans wizards

#### Erreurs Fonctionnelles

- Correction sauvegarde produits digitaux (mapping files)
- Correction création de licences (après achat uniquement)
- Correction calcul de taille de fichiers
- Correction routes intégrées dans App.tsx
- Correction props manquants dans wizards V2

### 🗑️ Suppressions (Removed)

- Fichiers temporaires de test
- Fichiers de documentation obsolètes
- Migrations SQL dupliquées
- Composants non utilisés (DigitalProductsGrid, DigitalLicensesGrid)

---

## [1.5.0] - 2025-10-20

### ✨ Ajouts

#### Parité avec Cours en Ligne

- **Affiliation** pour Digital, Physical, Services
- **Reviews & Ratings** système complet
- **SEO avancé** : Meta tags, FAQs
- **Pixels** : Google Analytics, Facebook, TikTok
- **Analytics basiques** : Dashboard par type de produit

### 🔄 Modifications

- Activation wizards V2 pour Physical et Services
- Amélioration `ProductCreationRouter`
- Intégration callbacks et navigation

---

## [1.0.0] - 2025-10-15

### 🎉 Version Initiale

#### Fonctionnalités Core

- Authentification Supabase
- Dashboard utilisateur
- Gestion de profil
- 4 types de produits :
  - Produits digitaux
  - Produits physiques
  - Services
  - Cours en ligne

#### Produits Digitaux

- Création et gestion
- Upload de fichiers
- Système de licences
- Téléchargements sécurisés

#### Produits Physiques

- Gestion d'inventaire
- Variants (taille, couleur)
- Stock tracking
- Alertes stock faible

#### Services

- Système de réservation
- Calendrier de disponibilité
- Gestion du personnel
- Notifications

#### Cours en Ligne (LMS)

- Éditeur de curriculum
- Modules et leçons
- Vidéos (YouTube, Vimeo, Google Drive)
- Système de progression
- Quizzes et examens
- Certificats de fin de cours
- Dashboard instructeur

#### Paiements

- Intégration PayDunya
- Intégration Moneroo
- Checkout sécurisé
- Facturation PDF

#### Fonctionnalités Avancées

- Programme d'affiliation
- Reviews & ratings
- SEO optimization
- Analytics (GA, FB, TikTok)
- Notifications multi-canaux
- Chat support (Crisp)
- Monitoring (Sentry)

---

## 🔮 À Venir (Roadmap)

### [2.1.0] - Prévu

- [ ] Système de coupons et promotions
- [ ] Intégration Stripe
- [ ] Marketplace multi-vendeurs
- [ ] Application mobile (React Native)
- [ ] Support multi-devises
- [ ] Traductions supplémentaires
- [ ] Dashboard analytics avancé
- [ ] A/B testing intégré
- [ ] Recommandations AI

---

## 📊 Statistiques

### Version 2.0.0

- **Fichiers ajoutés** : 45+
- **Fichiers modifiés** : 120+
- **Lignes de code** : +15,000
- **Tests E2E** : 50+
- **Migrations DB** : 15+
- **Nouvelles pages** : 8
- **Nouveaux composants** : 20+
- **Nouveaux hooks** : 15+

---

## 🏆 Contributors

- **Intelli / Emarzona Team** - Lead Developer
- **Community** - Bug reports and feedback

---

## 📝 Notes de Version

### Migration de 1.x vers 2.0

1. **Base de données** : Exécuter toutes les nouvelles migrations
2. **Variables d'environnement** : Ajouter clés FedEx
3. **Dépendances** : `npm install` pour Playwright
4. **Tests** : `npx playwright install` pour browsers

### Breaking Changes

- ❗ Nouveau schéma de paiements (incompatible avec 1.x)
- ❗ Nouvelle structure wizards (activation manuelle requise)
- ❗ Nouvelles tables messaging (migration obligatoire)

---

**Pour plus d'informations** :

- 📚 [Documentation](docs/)
- 🐛 [Issues](https://github.com/emarzona/emarzona/issues)
- 💬 [Discussions](https://github.com/emarzona/emarzona/discussions)
