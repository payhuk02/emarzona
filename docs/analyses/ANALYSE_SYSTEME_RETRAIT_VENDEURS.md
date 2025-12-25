# 📊 ANALYSE - SYSTÈME DE RETRAIT POUR VENDEURS

**Date :** 2025-01-31  
**Objectif :** Vérifier l'existence d'un système complet de retrait pour les vendeurs (mobile money et carte bancaire)

---

## ✅ SYSTÈME EXISTANT : AFFILIÉS

### Fonctionnalités disponibles
- ✅ Table `affiliate_withdrawals` dans la base de données
- ✅ Hook `useAffiliateWithdrawals` pour gérer les retraits
- ✅ Page `AffiliateDashboard` avec interface de retrait
- ✅ Support des méthodes de paiement :
  - `mobile_money`
  - `bank_transfer`
  - `paypal`
  - `stripe`
- ✅ Workflow complet :
  - Demande de retrait par l'affilié
  - Approbation par l'admin
  - Traitement et complétion
  - Suivi des statuts (pending, processing, completed, failed, cancelled)

### Structure de données
```sql
CREATE TABLE public.affiliate_withdrawals (
  id UUID PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  payment_method TEXT CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'paypal', 'stripe')),
  payment_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  -- ... autres champs
);
```

---

## ❌ SYSTÈME MANQUANT : VENDEURS

### Problème identifié
**Il n'existe PAS de système de retrait pour les vendeurs (propriétaires de stores).**

### Éléments manquants

#### 1. Table de base de données
- ❌ Pas de table `store_withdrawals` ou `vendor_withdrawals`
- ❌ Pas de table pour stocker les revenus disponibles des vendeurs
- ❌ Pas de calcul automatique du solde disponible (revenus - retraits)

#### 2. Hooks et services
- ❌ Pas de hook `useStoreWithdrawals` ou `useVendorWithdrawals`
- ❌ Pas de service pour calculer le solde disponible du vendeur
- ❌ Pas de fonction pour créer des demandes de retrait

#### 3. Interface utilisateur
- ❌ Pas de page `/dashboard/withdrawals` pour les vendeurs
- ❌ Pas de composant pour afficher le solde disponible
- ❌ Pas de formulaire pour demander un retrait
- ❌ Pas de liste des retraits passés

#### 4. Calcul des revenus
- ⚠️ Les revenus sont calculés à partir des `orders` (statut `completed`)
- ⚠️ Mais il n'y a pas de système pour :
  - Calculer le solde disponible (revenus - commission plateforme - retraits)
  - Stocker le solde disponible
  - Gérer les retraits

---

## 📋 FONCTIONNALITÉS NÉCESSAIRES

### 1. Base de données

#### Table `store_withdrawals`
```sql
CREATE TABLE public.store_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Montant
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Méthode de paiement
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('mobile_money', 'bank_card', 'bank_transfer')
  ),
  payment_details JSONB NOT NULL,  -- {phone: "...", card_number: "...", etc}
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  
  -- Approbation
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Traitement
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  proof_url TEXT,
  
  -- Échec
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  -- Métadonnées
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### Table `store_earnings` (optionnel - pour tracking)
```sql
CREATE TABLE public.store_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Revenus
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  
  -- Commission plateforme
  platform_commission_rate NUMERIC DEFAULT 0.10, -- 10%
  total_platform_commission NUMERIC NOT NULL DEFAULT 0,
  
  -- Métadonnées
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 2. Hooks et services

#### Hook `useStoreWithdrawals`
- `fetchWithdrawals()` - Récupérer les retraits
- `requestWithdrawal()` - Créer une demande de retrait
- `cancelWithdrawal()` - Annuler un retrait en attente

#### Hook `useStoreEarnings`
- `fetchEarnings()` - Récupérer le solde disponible
- `calculateAvailableBalance()` - Calculer le solde (revenus - retraits - commission)

### 3. Interface utilisateur

#### Page `/dashboard/withdrawals`
- Affichage du solde disponible
- Formulaire de demande de retrait
- Liste des retraits passés avec statuts
- Support pour :
  - Mobile Money (Orange Money, MTN Mobile Money, Moov Money)
  - Carte bancaire
  - Virement bancaire

#### Composants nécessaires
- `WithdrawalRequestDialog` - Formulaire de demande
- `WithdrawalsList` - Liste des retraits
- `EarningsBalance` - Affichage du solde

### 4. Méthodes de paiement

#### Mobile Money
- Orange Money (Burkina Faso, Côte d'Ivoire, etc.)
- MTN Mobile Money
- Moov Money
- Champs requis : `phone`, `operator`, `country`

#### Carte bancaire
- Numéro de carte
- Nom du titulaire
- Date d'expiration
- CVV (stocké de manière sécurisée)

#### Virement bancaire
- Numéro de compte
- Nom de la banque
- IBAN (si applicable)

---

## 🎯 RECOMMANDATIONS

### Priorité 1 : Créer le système de base
1. Créer la table `store_withdrawals`
2. Créer la table `store_earnings` (ou fonction de calcul)
3. Créer le hook `useStoreWithdrawals`
4. Créer le hook `useStoreEarnings`

### Priorité 2 : Interface utilisateur
1. Créer la page `/dashboard/withdrawals`
2. Créer les composants de formulaire
3. Ajouter le lien dans le sidebar

### Priorité 3 : Administration
1. Créer la page admin pour gérer les retraits
2. Système d'approbation/rejet
3. Upload de preuves de paiement

### Priorité 4 : Intégrations
1. Intégration avec les APIs Mobile Money
2. Intégration avec les processeurs de paiement pour cartes
3. Notifications automatiques

---

## 📝 CONCLUSION

**Le système de retrait pour les vendeurs n'existe PAS actuellement.**

Seul le système d'affiliation dispose d'un système complet de retrait. Il est nécessaire de créer un système similaire pour les vendeurs afin qu'ils puissent retirer leurs revenus de ventes par mobile money ou carte bancaire.

**Estimation :** 2-3 jours de développement pour créer le système complet.

