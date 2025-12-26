# 🔍 Analyse Complète et Approfondie du Système d'Affiliation

**Date**: 28 Janvier 2025  
**Auteur**: Analyse Automatisée  
**Version**: 1.0  
**Statut**: ✅ Production

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture de la Base de Données](#architecture-de-la-base-de-données)
3. [Flux de Travail Complets](#flux-de-travail-complets)
4. [Composants Frontend](#composants-frontend)
5. [Hooks et Services](#hooks-et-services)
6. [Fonctionnalités Détaillées](#fonctionnalités-détaillées)
7. [Sécurité et RLS](#sécurité-et-rls)
8. [Points Forts](#points-forts)
9. [Points d'Amélioration](#points-damélioration)
10. [Recommandations](#recommandations)

---

## 🎯 Vue d'Ensemble

### Description

Le système d'affiliation d'Emarzona permet aux vendeurs de définir des taux de commission personnalisés pour leurs produits, et aux affiliés de promouvoir ces produits en générant des liens de suivi uniques. Le système tracke les clics, les conversions, calcule automatiquement les commissions et gère les paiements.

### Objectifs

- ✅ Permettre aux vendeurs d'activer l'affiliation par produit
- ✅ Générer des liens de tracking uniques pour chaque affilié
- ✅ Tracker les clics et attribuer les commissions aux bonnes ventes
- ✅ Gérer les commissions (approbation, paiement, retrait)
- ✅ Fournir des statistiques détaillées pour affiliés et vendeurs
- ✅ Support des liens courts pour un partage facile

### Portée Fonctionnelle

- **6 tables principales** : affiliates, affiliate_links, affiliate_clicks, affiliate_commissions, affiliate_withdrawals, product_affiliate_settings
- **1 table secondaire** : affiliate_short_links
- **9 hooks React** dédiés
- **9 composants UI** spécialisés
- **6 pages complètes** (dashboard affilié, gestion vendeur, admin)
- **Tracking par cookie** avec durée personnalisable

---

## 🗄️ Architecture de la Base de Données

### Tables Principales

#### 1. `affiliates` - Profils des Affiliés

```sql
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),

  -- Informations personnelles
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,

  -- Identifiant unique
  affiliate_code TEXT NOT NULL UNIQUE,  -- Ex: "JOHN25", "MARIE25001"

  -- Statistiques agrégées
  total_clicks INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_commission_earned NUMERIC DEFAULT 0,
  total_commission_paid NUMERIC DEFAULT 0,
  pending_commission NUMERIC DEFAULT 0,

  -- Paiement
  payment_method TEXT,  -- mobile_money, bank_transfer, paypal
  payment_details JSONB,

  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
```

**Caractéristiques**:

- ✅ Code affilié auto-généré unique (`generate_affiliate_code()`)
- ✅ Peut exister sans compte utilisateur (`user_id` nullable)
- ✅ Statistiques agrégées pour performance
- ✅ Support multi-méthodes de paiement

#### 2. `product_affiliate_settings` - Configuration par Produit

```sql
CREATE TABLE public.product_affiliate_settings (
  id UUID PRIMARY KEY,
  product_id UUID UNIQUE REFERENCES products(id),
  store_id UUID REFERENCES stores(id),

  -- Activation
  affiliate_enabled BOOLEAN DEFAULT false,

  -- Commission
  commission_rate NUMERIC CHECK (0-100),  -- Pourcentage
  commission_type TEXT CHECK (IN ('percentage', 'fixed')),
  fixed_commission_amount NUMERIC,
  max_commission_per_sale NUMERIC,
  min_order_amount NUMERIC DEFAULT 0,

  -- Tracking
  cookie_duration_days INTEGER DEFAULT 30,

  -- Restrictions
  allow_self_referral BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT false,

  -- Contenu
  terms_and_conditions TEXT,
  promotional_materials JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Caractéristiques**:

- ✅ Configuration granulaire par produit
- ✅ Support commission fixe ou pourcentage
- ✅ Durée de cookie personnalisable (7, 30, 60, 90 jours)
- ✅ Limites de commission (min/max)
- ✅ Matériel promotionnel stockable (JSONB)

#### 3. `affiliate_links` - Liens d'Affiliation

```sql
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),

  -- Lien unique
  link_code TEXT NOT NULL UNIQUE,  -- Ex: "ABC123DEF456"
  full_url TEXT NOT NULL,  -- URL complète avec paramètres

  -- Statistiques
  total_clicks INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,

  -- Tracking UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  custom_parameters JSONB,

  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,

  UNIQUE(affiliate_id, product_id)  -- Un lien par produit par affilié
);
```

**Caractéristiques**:

- ✅ Code de lien unique généré (`generate_affiliate_link_code()`)
- ✅ Support paramètres UTM personnalisés
- ✅ Statistiques par lien
- ✅ Un seul lien actif par produit par affilié

#### 4. `affiliate_clicks` - Tracking des Clics

```sql
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id),
  affiliate_id UUID REFERENCES affiliates(id),
  product_id UUID REFERENCES products(id),

  -- Informations visiteur
  ip_address INET,
  user_agent TEXT,
  referer_url TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,

  -- Cookie tracking
  tracking_cookie TEXT NOT NULL,  -- Cookie unique
  cookie_expires_at TIMESTAMPTZ NOT NULL,

  -- Conversion
  converted BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id),
  converted_at TIMESTAMPTZ,

  clicked_at TIMESTAMPTZ DEFAULT now()
);
```

**Caractéristiques**:

- ✅ Tracking détaillé (IP, user agent, géolocalisation)
- ✅ Cookie unique pour attribution précise
- ✅ Marque les conversions avec `order_id`
- ✅ Index optimisé pour recherche rapide

#### 5. `affiliate_commissions` - Commissions

```sql
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id),
  affiliate_link_id UUID REFERENCES affiliate_links(id),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  order_id UUID REFERENCES orders(id),
  payment_id UUID REFERENCES payments(id),

  -- Montants
  order_total NUMERIC NOT NULL,
  commission_base NUMERIC NOT NULL,  -- Après commission plateforme
  commission_rate NUMERIC NOT NULL,
  commission_type TEXT,
  commission_amount NUMERIC NOT NULL,

  -- Statut workflow
  status TEXT DEFAULT 'pending' CHECK (IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Paiement
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  payment_method TEXT,
  payment_reference TEXT,
  payment_proof_url TEXT,

  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Caractéristiques**:

- ✅ Workflow complet : pending → approved → paid
- ✅ Traçabilité complète (qui a approuvé, payé)
- ✅ Base de commission calculée (après commission plateforme 10%)
- ✅ Support rejet avec raison

#### 6. `affiliate_withdrawals` - Retraits

```sql
CREATE TABLE public.affiliate_withdrawals (
  id UUID PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id),

  -- Montant
  amount NUMERIC CHECK (amount > 0),
  currency TEXT DEFAULT 'XOF',

  -- Méthode
  payment_method TEXT CHECK (IN ('mobile_money', 'bank_transfer', 'paypal', 'stripe')),
  payment_details JSONB,

  -- Workflow
  status TEXT DEFAULT 'pending' CHECK (IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  proof_url TEXT,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Caractéristiques**:

- ✅ Workflow complet de retrait
- ✅ Support multiple méthodes de paiement
- ✅ Traçabilité des échecs
- ✅ Preuves de paiement (proof_url)

#### 7. `affiliate_short_links` - Liens Courts (Optionnel)

```sql
CREATE TABLE public.affiliate_short_links (
  id UUID PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id),
  affiliate_id UUID REFERENCES affiliates(id),

  short_code TEXT NOT NULL UNIQUE,  -- Ex: "ABC123"
  target_url TEXT NOT NULL,
  custom_alias TEXT,  -- Alias personnalisé
  expires_at TIMESTAMPTZ,

  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
```

**Caractéristiques**:

- ✅ Format court : `emarzona.com/aff/ABC123`
- ✅ Alias personnalisables
- ✅ Expiration optionnelle
- ✅ Statistiques séparées

### Relations et Intégrité

```
affiliates
├── affiliate_links (1:N)
│   ├── affiliate_clicks (1:N)
│   │   └── orders (1:1 via order_id)
│   └── affiliate_short_links (1:N)
├── affiliate_commissions (1:N)
└── affiliate_withdrawals (1:N)

products
└── product_affiliate_settings (1:1)
    └── affiliate_links (1:N)
```

### Indexes Clés

- ✅ `idx_affiliates_code` - Recherche rapide par code
- ✅ `idx_affiliate_links_link_code` - Recherche par code de lien
- ✅ `idx_affiliate_clicks_tracking_cookie` - Attribution de commission
- ✅ `idx_affiliate_commissions_order_id` - Liens avec commandes
- ✅ `idx_affiliate_withdrawals_status` - Filtrage par statut
- ✅ `idx_orders_affiliate_tracking_cookie` - Attribution précise

### Fonctions SQL Principales

1. **`generate_affiliate_code(first_name, last_name)`**
   - Génère un code unique (ex: "JOHN25", "MARIE25001")
   - Format : `PRENOM` + `ANNEE` + `SUFFIXE`

2. **`generate_affiliate_link_code(affiliate_code, product_slug)`**
   - Génère un hash unique de 12 caractères
   - Utilise SHA256

3. **`track_affiliate_click(link_code, ip, user_agent, referer)`**
   - Enregistre un clic
   - Crée le cookie de tracking
   - Retourne les données pour le navigateur

4. **`calculate_affiliate_commission()` (TRIGGER)**
   - Déclenché sur INSERT dans `orders`
   - Cherche le cookie de tracking
   - Calcule et crée la commission
   - Met à jour les statistiques

5. **`generate_short_link_code(length)`**
   - Génère un code court alphanumérique
   - Évite les caractères ambigus (0, O, I, 1)

### Vues Utiles

1. **`top_affiliates`** - Classement des meilleurs affiliés
2. **`affiliate_products`** - Produits disponibles avec stats
3. **`affiliate_short_links_stats`** - Statistiques des liens courts

---

## 🔄 Flux de Travail Complets

### 1. Inscription d'un Affilié

```
Utilisateur
  ↓
Remplit formulaire d'inscription
  ↓
useAffiliates.registerAffiliate()
  ↓
generate_affiliate_code() [RPC]
  ↓
INSERT INTO affiliates
  ↓
Retour : Affiliate avec code unique
  ↓
Notification : "Votre code affilié : JOHN25"
```

**Fichiers impliqués**:

- `src/hooks/useAffiliates.ts` - Hook d'inscription
- `src/components/affiliate/RegistrationDialog.tsx` - UI
- `supabase/migrations/20251025_affiliate_system_complete.sql` - Fonction SQL

### 2. Configuration Affiliation Produit (Vendeur)

```
Vendeur
  ↓
Ouvre paramètres produit
  ↓
Active "Affiliation"
  ↓
Configure :
  - Taux commission (ex: 20%)
  - Type (pourcentage/fixe)
  - Durée cookie (ex: 30 jours)
  - Min commande
  ↓
useProductAffiliateSettings.save()
  ↓
INSERT/UPDATE product_affiliate_settings
  ↓
Produit disponible pour affiliation
```

**Fichiers impliqués**:

- `src/components/products/ProductAffiliateSettings.tsx`
- `src/hooks/useProductAffiliateSettings.ts`
- Types spéciaux : `DigitalAffiliateSettings`, `PhysicalAffiliateSettings`, `ServiceAffiliateSettings`, `CourseAffiliateSettings`

### 3. Création d'un Lien d'Affiliation

```
Affilié connecté
  ↓
Sélectionne produit avec affiliation activée
  ↓
useAffiliateLinks.createLink()
  ↓
Vérifie :
  - Affilié actif ?
  - Produit a affiliation activée ?
  - Lien existe déjà ?
  ↓
generate_affiliate_link_code() [RPC]
  ↓
INSERT INTO affiliate_links
  - link_code unique
  - full_url avec paramètres
  ↓
Retour : AffiliateLink
  ↓
Affiché dans dashboard avec bouton copier
```

**Fichiers impliqués**:

- `src/hooks/useAffiliateLinks.ts`
- `src/components/affiliate/CreateAffiliateLinkDialog.tsx`
- `src/pages/AffiliateDashboard.tsx`

### 4. Clic sur Lien d'Affiliation

```
Visiteur clique sur lien
  ↓
URL: emarzona.com/products/formation-react?aff=ABC123DEF456
  ↓
Page produit charge
  ↓
AffiliateLinkTracker détecte paramètre ?aff=
  ↓
track_affiliate_click(link_code) [RPC]
  ↓
Fonction SQL :
  1. Vérifie lien actif
  2. Vérifie produit a affiliation activée
  3. Génère tracking_cookie unique
  4. Calcule expiration (cookie_duration_days)
  5. INSERT INTO affiliate_clicks
  6. UPDATE affiliate_links.total_clicks++
  7. UPDATE affiliates.total_clicks++
  ↓
Retour : { tracking_cookie, expires_at }
  ↓
setAffiliateCookie(tracking_cookie) [Frontend]
  ↓
Cookie stocké dans navigateur
```

**Fichiers impliqués**:

- `src/components/affiliate/AffiliateLinkTracker.tsx` - Détection automatique
- `src/lib/affiliation-tracking.ts` - Service de tracking
- `supabase/migrations/20251025_affiliate_system_complete.sql` - Fonction `track_affiliate_click()`

### 5. Commande avec Cookie d'Affiliation

```
Client finalise commande
  ↓
Checkout récupère cookie d'affiliation
  ↓
getAffiliateCookie() [Frontend]
  ↓
Cookie présent ? → affiliate_tracking_cookie
  ↓
INSERT INTO orders
  - affiliate_tracking_cookie = cookie_value
  - ... autres champs
  ↓
TRIGGER : calculate_affiliate_commission()
  ↓
Fonction SQL :
  1. Récupère affiliate_tracking_cookie depuis NEW
  2. Cherche affiliate_clicks avec ce cookie
  3. Vérifie cookie non expiré
  4. Vérifie clic non encore converti
  5. Récupère product_affiliate_settings
  6. Vérifie min_order_amount
  7. Calcule commission_base = order_total * 0.90 (après 10% plateforme)
  8. Calcule commission_amount selon type
  9. Applique max_commission_per_sale si défini
  10. INSERT INTO affiliate_commissions (status='pending')
  11. UPDATE affiliate_clicks (converted=true, order_id)
  12. UPDATE affiliate_links (total_sales++, total_revenue, total_commission)
  13. UPDATE affiliates (total_sales++, total_revenue, total_commission_earned, pending_commission)
  ↓
Commission créée en statut 'pending'
```

**Fichiers impliqués**:

- `src/lib/affiliation-tracking.ts` - Récupération cookie
- `supabase/migrations/20251124_update_affiliate_trigger_with_cookie.sql` - Trigger amélioré
- `supabase/migrations/20251124_add_affiliate_tracking_to_orders.sql` - Colonne dans orders

### 6. Approbation de Commission (Vendeur)

```
Vendeur ouvre StoreAffiliateManagement
  ↓
Onglet "Commissions"
  ↓
Liste des commissions 'pending' pour ses produits
  ↓
Vendeur examine :
  - Commande
  - Affilié
  - Montant
  - Produit
  ↓
Approuve commission
  ↓
useStoreAffiliates.approveCommission()
  ↓
UPDATE affiliate_commissions
  - status = 'approved'
  - approved_at = now()
  - approved_by = user_id
  ↓
Notification à l'affilié
  ↓
Commission visible dans dashboard affilié
```

**Fichiers impliqués**:

- `src/pages/dashboard/StoreAffiliateManagement.tsx`
- `src/components/affiliate/StoreAffiliateDashboard.tsx`
- `src/hooks/useStoreAffiliates.ts`
- `src/lib/commission-notifications.ts` - Notifications

### 7. Retrait de Commission (Affilié)

```
Affilié accumule commissions 'approved'
  ↓
Ouvre AffiliateDashboard
  ↓
Onglet "Retraits"
  ↓
Voir solde disponible (pending_commission)
  ↓
Crée demande de retrait
  ↓
useAffiliateWithdrawals.requestWithdrawal()
  ↓
Validation :
  - Montant >= min_withdrawal_amount (depuis platform_settings)
  - Solde suffisant
  ↓
INSERT INTO affiliate_withdrawals
  - amount
  - payment_method
  - payment_details (JSONB)
  - status = 'pending'
  ↓
Notification admin
  ↓
Admin traite dans AdminAffiliates
  ↓
Admin approuve
  ↓
UPDATE affiliate_withdrawals
  - status = 'approved'
  - approved_at = now()
  ↓
Admin effectue virement
  ↓
Admin marque comme complété
  ↓
UPDATE affiliate_withdrawals
  - status = 'completed'
  - transaction_reference
  - proof_url
  ↓
UPDATE affiliates
  - total_commission_paid += amount
  - pending_commission -= amount
  ↓
Notification affilié : "Votre retrait a été traité"
```

**Fichiers impliqués**:

- `src/pages/AffiliateDashboard.tsx`
- `src/hooks/useAffiliateWithdrawals.ts`
- `src/pages/admin/AdminAffiliates.tsx`
- `src/lib/commission-payment-service.ts`

---

## 🎨 Composants Frontend

### Pages Principales

#### 1. `AffiliateDashboard.tsx` - Dashboard Affilié

**Route**: `/dashboard/affiliate`  
**Rôle**: Interface principale pour les affiliés

**Sections**:

- 📊 **Statistiques** : Clics, ventes, revenus, commissions
- 🔗 **Mes Liens** : Liste des liens d'affiliation avec statistiques
- 💰 **Commissions** : Historique des commissions (pending, approved, paid)
- 💵 **Retraits** : Demandes de retrait et historique
- 🔗 **Liens Courts** : Gestion des liens courts

**Fonctionnalités**:

- ✅ Création de nouveaux liens
- ✅ Copie rapide des liens
- ✅ Filtres et pagination
- ✅ Graphiques de performance (si implémentés)

**Hooks utilisés**:

- `useCurrentAffiliate()` - Profil affilié connecté
- `useAffiliateLinks()` - Gestion des liens
- `useAffiliateCommissions()` - Commissions
- `useAffiliateWithdrawals()` - Retraits
- `useAffiliateBalance()` - Solde disponible

#### 2. `StoreAffiliateManagement.tsx` - Gestion Vendeur

**Route**: `/dashboard/store-affiliates`  
**Rôle**: Interface pour les vendeurs pour gérer leurs affiliés

**Sections**:

- 👥 **Affiliés** : Liste des affiliés qui promeuvent leurs produits
- 🔗 **Liens d'Affiliation** : Tous les liens créés pour leurs produits
- 💰 **Commissions** : Commissions à approuver/rejeter
- 📊 **Statistiques** : Vue d'ensemble de l'affiliation

**Fonctionnalités**:

- ✅ Approuver/rejeter affiliés (si require_approval)
- ✅ Approuver/rejeter commissions
- ✅ Voir statistiques par affilié
- ✅ Exporter données

**Hooks utilisés**:

- `useStore()` - Store du vendeur
- `useStoreAffiliates()` - Gestion complète

#### 3. `AdminAffiliates.tsx` - Administration

**Route**: `/admin/affiliates`  
**Rôle**: Panel d'administration global

**Sections**:

- 👥 **Tous les Affiliés** : Liste complète
- 💰 **Commissions** : Toutes les commissions
- 💵 **Retraits** : Toutes les demandes de retrait
- 📊 **Statistiques Globales** : Vue plateforme

**Fonctionnalités**:

- ✅ Suspendre/réactiver affiliés
- ✅ Approuver/rejeter retraits
- ✅ Gérer tous les paiements
- ✅ Exports CSV/Excel
- ✅ Audit complet

### Composants Spécialisés

#### 1. `CreateAffiliateLinkDialog.tsx`

- Modal pour créer un nouveau lien
- Sélection de produit
- Paramètres UTM optionnels

#### 2. `ProductAffiliateSettings.tsx`

- Configuration affiliation par produit
- Taux, type, durée cookie
- Validation des valeurs

#### 3. `StoreAffiliateDashboard.tsx`

- Dashboard intégré dans StoreAffiliateManagement
- Statistiques par store
- Liste des affiliés avec actions

#### 4. `AffiliateLinkTracker.tsx`

- Composant invisible qui détecte `?aff=` dans l'URL
- Déclenche automatiquement le tracking
- Gère le cookie

#### 5. `ShortLinkManager.tsx`

- Gestion des liens courts
- Création avec alias personnalisé
- Statistiques par lien court

#### 6. `AffiliateStatsCards.tsx`

- Cartes de statistiques réutilisables
- Formatage des montants
- Animations

---

## 🪝 Hooks et Services

### Hooks Disponibles

#### 1. `useAffiliates.ts`

**Responsabilité**: CRUD complet des affiliés

**Fonctions**:

- `fetchAffiliates()` - Liste avec filtres/pagination
- `registerAffiliate()` - Inscription
- `updateAffiliate()` - Mise à jour profil
- `suspendAffiliate()` - Suspension (admin)
- `getAffiliateStats()` - Statistiques d'un affilié

**Utilisé dans**:

- `AffiliateDashboard.tsx`
- `AdminAffiliates.tsx`
- `RegistrationDialog.tsx`

#### 2. `useCurrentAffiliate.ts`

**Responsabilité**: Affilié connecté actuellement

**Retourne**:

- `affiliate` - Profil complet
- `loading` - État de chargement
- `isAffiliate` - Boolean
- `refetch()` - Rafraîchir

**Utilisé dans**:

- `AffiliateDashboard.tsx`
- Vérification d'accès

#### 3. `useAffiliateLinks.ts`

**Responsabilité**: Gestion des liens d'affiliation

**Fonctions**:

- `fetchLinks()` - Liste avec pagination
- `createLink()` - Créer un lien
- `updateLink()` - Modifier (UTM, statut)
- `deleteLink()` - Supprimer (soft delete)

**Utilisé dans**:

- `AffiliateDashboard.tsx`
- `CreateAffiliateLinkDialog.tsx`

#### 4. `useAffiliateCommissions.ts`

**Responsabilité**: Gestion des commissions

**Fonctions**:

- `fetchCommissions()` - Liste avec filtres
- `approveCommission()` - Approuver (vendeur/admin)
- `rejectCommission()` - Rejeter avec raison
- `payCommission()` - Marquer comme payé
- `getStats()` - Statistiques agrégées

**Utilisé dans**:

- `AffiliateDashboard.tsx`
- `StoreAffiliateManagement.tsx`
- `AdminAffiliates.tsx`

#### 5. `useAffiliateWithdrawals.ts`

**Responsabilité**: Gestion des retraits

**Fonctions**:

- `fetchWithdrawals()` - Liste des retraits
- `requestWithdrawal()` - Créer demande
- `cancelWithdrawal()` - Annuler (si pending)
- `getBalance()` - Solde disponible
- `getPendingWithdrawals()` - Retraits en attente

**Utilisé dans**:

- `AffiliateDashboard.tsx`
- `AdminAffiliates.tsx`

#### 6. `useStoreAffiliates.ts`

**Responsabilité**: Vue vendeur sur les affiliés

**Fonctions**:

- `fetchAffiliates()` - Affiliés qui promeuvent leurs produits
- `fetchLinks()` - Liens pour leurs produits
- `fetchCommissions()` - Commissions à approuver
- `approveAffiliate()` - Approuver un affilié
- `approveCommission()` - Approuver commission
- `rejectCommission()` - Rejeter commission

**Utilisé dans**:

- `StoreAffiliateManagement.tsx`
- `StoreAffiliateDashboard.tsx`

#### 7. `useProductAffiliateSettings.ts`

**Responsabilité**: Configuration affiliation par produit

**Fonctions**:

- `getSettings(productId)` - Récupérer config
- `saveSettings(productId, settings)` - Sauvegarder
- `enableAffiliate(productId)` - Activer rapidement
- `disableAffiliate(productId)` - Désactiver

**Utilisé dans**:

- `ProductAffiliateSettings.tsx`
- Formulaires de création produit

#### 8. `useAffiliateShortLinks.ts`

**Responsabilité**: Gestion des liens courts

**Fonctions**:

- `createShortLink()` - Créer lien court
- `fetchShortLinks()` - Liste des liens courts
- `updateShortLink()` - Modifier (alias, expiration)
- `deleteShortLink()` - Supprimer

**Utilisé dans**:

- `ShortLinkManager.tsx`
- `AffiliateDashboard.tsx`

#### 9. `useAffiliateTracking.ts`

**Responsabilité**: Tracking côté frontend

**Fonctions**:

- `trackClick()` - Déclencher tracking
- `getTrackingCookie()` - Récupérer cookie
- `setTrackingCookie()` - Définir cookie

**Utilisé dans**:

- `AffiliateLinkTracker.tsx`
- Checkout

### Services

#### 1. `affiliation-tracking.ts`

**Fichier**: `src/lib/affiliation-tracking.ts`

**Fonctions principales**:

- `getAffiliateCookie()` - Lire cookie navigateur
- `setAffiliateCookie()` - Écrire cookie
- `trackAffiliateClick()` - Tracker un clic
- `getAffiliateInfo()` - Infos depuis cookie
- `createAffiliateCommission()` - Créer commission (fallback)

**Constantes**:

- `AFFILIATE_COOKIE_NAME = 'emarzona_affiliate'`
- `AFFILIATE_COOKIE_EXPIRY_DAYS = 30`

#### 2. `commission-payment-service.ts`

**Fichier**: `src/lib/commission-payment-service.ts`

**Fonctions principales**:

- `createCommissionPaymentRequest()` - Créer demande retrait
- `approveCommissionPayment()` - Approuver (admin)
- `processCommissionPayment()` - Traiter paiement
- `rejectCommissionPayment()` - Rejeter

**Validation**:

- Montant minimum depuis `platform_settings`
- Vérification solde disponible
- Vérification commissions approuvées

#### 3. `commission-notifications.ts`

**Fichier**: `src/lib/commission-notifications.ts`

**Fonctions principales**:

- `notifyCommissionApproved()` - Notification approbation
- `notifyCommissionRejected()` - Notification rejet
- `notifyPaymentRequestApproved()` - Notification retrait approuvé
- `notifyPaymentCompleted()` - Notification paiement complété

**Intégration**:

- Système de notifications global
- Emails (si configuré)
- Notifications in-app

---

## ⚙️ Fonctionnalités Détaillées

### 1. Calcul de Commission

#### Logique de Calcul

```
Si commission_type = 'percentage':
  commission_base = order_total * 0.90  (après 10% plateforme)
  commission_amount = commission_base * (commission_rate / 100)

Si commission_type = 'fixed':
  commission_amount = fixed_commission_amount

Si max_commission_per_sale défini:
  commission_amount = MIN(commission_amount, max_commission_per_sale)

Si min_order_amount défini:
  Si order_total < min_order_amount:
    Pas de commission
```

#### Exemple Concret

```
Produit: Formation React (50 000 XOF)
Settings:
  - commission_rate: 20%
  - commission_type: percentage
  - min_order_amount: 0
  - max_commission_per_sale: NULL

Client commande via lien affilié:
  order_total = 50 000 XOF
  commission_base = 50 000 * 0.90 = 45 000 XOF
  commission_amount = 45 000 * 0.20 = 9 000 XOF

Répartition finale:
  - Plateforme: 5 000 XOF (10%)
  - Affilié: 9 000 XOF (20% du montant vendeur)
  - Vendeur: 36 000 XOF (72% du total)
  Total: 50 000 XOF ✅
```

### 2. Attribution par Cookie

#### Durée de Cookie

Le cookie est valide pendant `cookie_duration_days` définis dans `product_affiliate_settings`.

**Options courantes**:

- 7 jours - Court terme
- 30 jours - Standard (par défaut)
- 60 jours - Long terme
- 90 jours - Très long terme

#### Mécanisme

1. **Clic initial** : Cookie créé avec expiration
2. **Navigation** : Cookie suivi sur toutes les pages
3. **Commande** : Cookie lu lors du checkout
4. **Attribution** : Commission attribuée si cookie valide

#### Fallback

Si le cookie n'est pas disponible (navigateur privé, suppression), le système utilise le dernier clic non converti pour le produit (méthode moins précise).

### 3. Liens Courts

#### Format

```
Lien long:
https://emarzona.com/products/formation-react?aff=ABC123DEF456&utm_source=youtube

Lien court:
https://emarzona.com/aff/XYZ789
```

#### Avantages

- ✅ Plus facile à partager (réseaux sociaux)
- ✅ Alias personnalisables ("youtube", "facebook")
- ✅ Statistiques séparées
- ✅ Expiration optionnelle

#### Génération

- Code aléatoire 4-10 caractères
- Évite caractères ambigus (0, O, I, 1)
- Unicité garantie

### 4. Workflow de Commission

```
┌─────────────────┐
│   Commande      │
│   créée         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TRIGGER        │
│  calculate_     │
│  affiliate_     │
│  commission()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Commission     │
│  créée          │
│  status:        │
│  'pending'      │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Vendeur        │  │  Admin peut     │
│  approuve       │  │  aussi          │
│                 │  │  approuver      │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
         ┌─────────────────┐
         │  status:        │
         │  'approved'     │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Affilié peut   │
         │  demander       │
         │  retrait        │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Admin traite   │
         │  retrait        │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  status:        │
         │  'paid'         │
         └─────────────────┘
```

### 5. Statistiques Agrégées

#### Niveau Affilié

Les statistiques sont stockées directement dans la table `affiliates` pour performance :

- `total_clicks` - Total de clics
- `total_sales` - Nombre de ventes
- `total_revenue` - Revenus générés
- `total_commission_earned` - Commissions gagnées
- `total_commission_paid` - Commissions payées
- `pending_commission` - Commissions en attente

**Mise à jour** :

- Automatique via triggers SQL
- Lors de chaque clic/vente/paiement

#### Niveau Lien

Chaque `affiliate_link` a ses propres statistiques :

- `total_clicks`
- `total_sales`
- `total_revenue`
- `total_commission`

**Utilité** : Permet de comparer la performance des différents liens d'un même affilié.

### 6. Filtres et Recherche

#### Affiliés

- Par statut (active, suspended, pending)
- Par recherche (email, nom, code)
- Par date d'inscription
- Par performance (min ventes, min revenus)

#### Commissions

- Par statut (pending, approved, paid, rejected)
- Par affilié
- Par produit
- Par store
- Par montant (min/max)
- Par période

#### Retraits

- Par statut (pending, processing, completed, failed)
- Par affilié
- Par méthode de paiement
- Par montant
- Par période

---

## 🔒 Sécurité et RLS

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des politiques granulaires.

#### Table `affiliates`

```sql
-- Affiliés peuvent voir leurs propres données
CREATE POLICY "Affiliates can view their own data"
  ON affiliates FOR SELECT
  USING (auth.uid() = user_id);

-- Affiliés peuvent mettre à jour leurs propres données
CREATE POLICY "Affiliates can update their own data"
  ON affiliates FOR UPDATE
  USING (auth.uid() = user_id);

-- Inscription ouverte
CREATE POLICY "Anyone can register as affiliate"
  ON affiliates FOR INSERT
  WITH CHECK (true);

-- Admins peuvent tout voir/gérer
CREATE POLICY "Admins can view all affiliates"
  ON affiliates FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

#### Table `affiliate_commissions`

```sql
-- Affiliés peuvent voir leurs propres commissions
CREATE POLICY "Affiliates can view their own commissions"
  ON affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_commissions.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Vendeurs peuvent voir commissions pour leurs produits
CREATE POLICY "Store owners can view commissions for their products"
  ON affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = affiliate_commissions.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Vendeurs peuvent approuver/rejeter
CREATE POLICY "Store owners can approve/reject commissions"
  ON affiliate_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = affiliate_commissions.store_id
      AND stores.user_id = auth.uid()
    )
  );
```

### Validation Côté Serveur

- ✅ Tous les calculs de commission se font en SQL (pas de manipulation côté client)
- ✅ Les fonctions SQL sont `SECURITY DEFINER` pour contrôler les permissions
- ✅ Les triggers garantissent la cohérence des données
- ✅ Validation des montants (min/max)
- ✅ Vérification des statuts avant transitions

### Protection contre la Fraude

1. **Cookie unique** : Impossible de dupliquer un cookie valide
2. **Expiration** : Cookies expirés ne génèrent pas de commissions
3. **Conversion unique** : Un clic ne peut être converti qu'une fois
4. **Min order amount** : Protection contre les micro-commandes
5. **Approbation vendeur** : Contrôle avant paiement
6. **Audit trail** : Toutes les actions sont tracées (approved_by, paid_by, etc.)

---

## ✅ Points Forts

### 1. Architecture Solide

- ✅ **Séparation des responsabilités** : Tables bien définies, relations claires
- ✅ **Triggers automatiques** : Calcul de commission automatique, pas d'intervention manuelle
- ✅ **Statistiques agrégées** : Performance optimale avec colonnes calculées
- ✅ **Indexes optimisés** : Recherche rapide sur tous les champs critiques

### 2. Flexibilité

- ✅ **Configuration par produit** : Chaque produit peut avoir ses propres règles
- ✅ **Multi-types de commission** : Pourcentage ou montant fixe
- ✅ **Durée cookie personnalisable** : Adaptable selon le produit
- ✅ **Paramètres UTM** : Tracking marketing avancé

### 3. Expérience Utilisateur

- ✅ **Dashboard complet** : Toutes les infos en un seul endroit
- ✅ **Liens courts** : Partage facile
- ✅ **Copie rapide** : Un clic pour copier le lien
- ✅ **Notifications** : Informations en temps réel

### 4. Traçabilité

- ✅ **Audit complet** : Qui a fait quoi, quand
- ✅ **Historique des modifications** : `updated_at` sur toutes les tables
- ✅ **Logs détaillés** : Tracking des clics avec métadonnées
- ✅ **Preuves de paiement** : `proof_url` pour les retraits

### 5. Sécurité

- ✅ **RLS complet** : Isolation des données par utilisateur
- ✅ **Validation serveur** : Calculs en SQL uniquement
- ✅ **Protection fraude** : Multiples vérifications
- ✅ **Workflow d'approbation** : Contrôle avant paiement

---

## ⚠️ Points d'Amélioration

### 1. Performance

#### Problème : Requêtes N+1

Les composants font parfois plusieurs requêtes séquentielles au lieu d'une seule.

**Exemple** :

```typescript
// ❌ Actuel : Multiple requêtes
const affiliate = await getAffiliate();
const links = await getLinks(affiliate.id);
const commissions = await getCommissions(affiliate.id);

// ✅ Mieux : Requête jointe
const data = await getAffiliateDashboardData(affiliate.id);
```

**Recommandation** : Créer des vues SQL ou fonctions RPC qui retournent des données agrégées.

#### Problème : Pas de Cache

Les statistiques sont recalculées à chaque chargement.

**Recommandation** : Implémenter un système de cache (Redis) ou des vues matérialisées pour les statistiques.

### 2. Fonctionnalités Manquantes

#### a) Graphiques de Performance

Les dashboards affichent des chiffres mais pas de graphiques temporels.

**Recommandation** : Ajouter des graphiques (Recharts, Chart.js) :

- Évolution des clics sur 30 jours
- Évolution des ventes
- Répartition par produit
- Taux de conversion

#### b) Export de Données

Pas de fonctionnalité d'export CSV/Excel pour les affiliés.

**Recommandation** : Ajouter bouton "Exporter" dans les tableaux :

- Export des commissions
- Export des liens avec statistiques
- Export pour déclaration fiscale

#### c) Notifications Push

Les notifications sont uniquement in-app, pas de push notifications.

**Recommandation** : Intégrer un service de push notifications (OneSignal, Firebase) :

- Notification quand commission approuvée
- Notification quand retrait traité
- Rappel de solde disponible

#### d) Système de Niveaux

Pas de système de récompenses ou de niveaux pour motiver les affiliés.

**Recommandation** : Créer un système de badges/niveaux :

- Bronze : 0-10 ventes
- Argent : 10-50 ventes
- Or : 50+ ventes
- Bonus commission selon niveau

### 3. UX/UI

#### a) Processus d'Onboarding

Pas de guide d'utilisation pour nouveaux affiliés.

**Recommandation** : Créer un onboarding interactif :

1. Tour guidé du dashboard
2. Tutoriel création de premier lien
3. Vidéo explicative

#### b) Recherche de Produits

Dans `CreateAffiliateLinkDialog`, la recherche de produits pourrait être améliorée.

**Recommandation** :

- Autocomplete avec debounce
- Filtres (catégorie, prix, store)
- Vue en grille avec images

#### c) Mobile Responsive

Certaines pages ne sont pas optimisées pour mobile.

**Recommandation** : Audit mobile et améliorations :

- Tableaux scrollables horizontalement
- Cartes au lieu de tableaux sur mobile
- Actions rapides (swipe)

### 4. Gestion des Erreurs

#### Problème : Messages d'Erreur Génériques

Certaines erreurs affichent "Erreur inconnue" au lieu de messages explicites.

**Recommandation** : Améliorer la gestion d'erreurs :

- Messages spécifiques pour chaque cas
- Codes d'erreur standardisés
- Guide de résolution de problèmes

### 5. Tests

#### Absence de Tests Automatisés

Pas de tests unitaires ou d'intégration pour le système d'affiliation.

**Recommandation** : Créer une suite de tests :

- Tests unitaires pour les hooks
- Tests d'intégration pour les workflows
- Tests E2E pour les scénarios critiques

### 6. Documentation

#### Documentation Technique Incomplète

Certaines fonctions SQL ne sont pas documentées.

**Recommandation** : Documenter :

- Toutes les fonctions SQL avec exemples
- API des hooks (JSDoc complet)
- Diagrammes de séquence pour les workflows

---

## 📊 Recommandations Prioritaires

### 🔴 Priorité Haute (Court Terme)

1. **Améliorer les Requêtes** - Créer des vues/fonctions SQL pour éviter N+1
2. **Graphiques de Performance** - Ajouter des graphiques dans les dashboards
3. **Export CSV** - Permettre l'export des données
4. **Messages d'Erreur** - Améliorer les messages utilisateur

### 🟡 Priorité Moyenne (Moyen Terme)

1. **Onboarding Interactif** - Guide pour nouveaux affiliés
2. **Notifications Push** - Alertes en temps réel
3. **Tests Automatisés** - Suite de tests complète
4. **Optimisation Mobile** - Responsive design amélioré

### 🟢 Priorité Basse (Long Terme)

1. **Système de Niveaux** - Gamification avec badges
2. **Cache Redis** - Performance pour statistiques
3. **Documentation Complète** - Guides détaillés
4. **API Publique** - API REST pour intégrations tierces

---

## 📈 Métriques de Succès

### KPIs à Suivre

1. **Taux de Conversion**
   - Clics → Ventes
   - Cible : > 5%

2. **Nombre d'Affiliés Actifs**
   - Affiliés avec au moins 1 vente par mois
   - Cible : Croissance de 20% / mois

3. **Revenus Générés**
   - Total des ventes via affiliation
   - Cible : 30% du CA total

4. **Temps de Traitement**
   - Délai approbation commission
   - Cible : < 48h

5. **Satisfaction Affiliés**
   - NPS (Net Promoter Score)
   - Cible : > 50

---

## 🔗 Fichiers Clés du Système

### Migrations SQL

- `supabase/migrations/20251025_affiliate_system_complete.sql` - Migration principale
- `supabase/migrations/20250131_affiliate_short_links.sql` - Liens courts
- `supabase/migrations/20251124_update_affiliate_trigger_with_cookie.sql` - Trigger amélioré
- `supabase/migrations/20251124_add_affiliate_tracking_to_orders.sql` - Colonne tracking

### Types TypeScript

- `src/types/affiliate.ts` - Tous les types d'affiliation

### Hooks

- `src/hooks/useAffiliates.ts` - CRUD affiliés
- `src/hooks/useCurrentAffiliate.ts` - Affilié connecté
- `src/hooks/useAffiliateLinks.ts` - Gestion liens
- `src/hooks/useAffiliateCommissions.ts` - Commissions
- `src/hooks/useAffiliateWithdrawals.ts` - Retraits
- `src/hooks/useStoreAffiliates.ts` - Vue vendeur
- `src/hooks/useProductAffiliateSettings.ts` - Config produit
- `src/hooks/useAffiliateShortLinks.ts` - Liens courts
- `src/hooks/useAffiliateTracking.ts` - Tracking

### Services

- `src/lib/affiliation-tracking.ts` - Service de tracking
- `src/lib/commission-payment-service.ts` - Service paiement
- `src/lib/commission-notifications.ts` - Notifications

### Composants

- `src/components/affiliate/CreateAffiliateLinkDialog.tsx`
- `src/components/affiliate/StoreAffiliateDashboard.tsx`
- `src/components/affiliate/AffiliateLinkTracker.tsx`
- `src/components/affiliate/ShortLinkManager.tsx`
- `src/components/products/ProductAffiliateSettings.tsx`

### Pages

- `src/pages/AffiliateDashboard.tsx` - Dashboard affilié
- `src/pages/dashboard/StoreAffiliateManagement.tsx` - Gestion vendeur
- `src/pages/admin/AdminAffiliates.tsx` - Administration

---

## 🎓 Conclusion

Le système d'affiliation d'Emarzona est **bien architecturé, sécurisé et fonctionnel**. Il offre une base solide pour gérer un programme d'affiliation à grande échelle.

**Points clés** :

- ✅ Architecture modulaire et extensible
- ✅ Sécurité robuste avec RLS
- ✅ Workflow complet de bout en bout
- ✅ Statistiques détaillées
- ✅ Interface utilisateur complète

**Prochaines étapes recommandées** :

1. Optimiser les performances (requêtes, cache)
2. Ajouter des graphiques de performance
3. Améliorer l'UX (onboarding, mobile)
4. Implémenter des tests automatisés

Le système est prêt pour la production, avec des améliorations progressives possibles selon les besoins métier.

---

**Document généré le** : 28 Janvier 2025  
**Dernière mise à jour** : 28 Janvier 2025  
**Version** : 1.0
