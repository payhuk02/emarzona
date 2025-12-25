# 📚 Guide Complet - Intégration Moneroo

**Version**: 1.0  
**Date**: Novembre 2025  
**Auteur**: Payhula Team

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Installation et Configuration](#installation-et-configuration)
3. [Architecture](#architecture)
4. [Utilisation](#utilisation)
5. [Gestion des Erreurs](#gestion-des-erreurs)
6. [Configuration Avancée](#configuration-avancée)
7. [Tests](#tests)
8. [Dépannage](#dépannage)

---

## 🎯 Introduction

Moneroo est un système de paiement intégré dans Payhula pour permettre aux utilisateurs d'effectuer des paiements sécurisés. Ce guide couvre l'utilisation complète de l'intégration Moneroo.

### Fonctionnalités

- ✅ Paiements sécurisés via Moneroo
- ✅ Retry automatique avec backoff exponentiel
- ✅ Rate limiting pour protéger l'API
- ✅ Cache pour les statistiques
- ✅ Validation des montants
- ✅ Gestion d'erreurs robuste
- ✅ Types TypeScript complets

---

## ⚙️ Installation et Configuration

### Prérequis

- Node.js 18+
- Supabase configuré
- Clés API Moneroo

### Configuration des Variables d'Environnement

```env
# Moneroo API
MONEROO_API_KEY=your_api_key_here

# Configuration Supabase (déjà configuré)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Configuration Moneroo (optionnel)
VITE_MONEROO_TIMEOUT_MS=30000        # Timeout en millisecondes (défaut: 30000)
VITE_MONEROO_MAX_RETRIES=3           # Nombre de tentatives (défaut: 3)
VITE_MONEROO_RETRY_BACKOFF_MS=1000   # Délai de base pour backoff (défaut: 1000)

# Rate Limiting (optionnel)
VITE_MONEROO_RATE_LIMIT_MAX=100      # Limite globale (défaut: 100)
VITE_MONEROO_RATE_LIMIT_USER_MAX=50  # Limite par utilisateur (défaut: 50)
VITE_MONEROO_RATE_LIMIT_STORE_MAX=200 # Limite par store (défaut: 200)
VITE_MONEROO_RATE_LIMIT_WINDOW_MS=60000 # Fenêtre en ms (défaut: 60000)

# Cache (optionnel)
VITE_MONEROO_CACHE_TTL_MS=300000    # TTL en millisecondes (défaut: 300000 = 5 min)
VITE_MONEROO_CACHE_MAX_SIZE=1000    # Taille max du cache (défaut: 1000)
```

### Configuration Supabase Edge Function

1. Déployer l'Edge Function `moneroo` dans Supabase Dashboard
2. Configurer le secret `MONEROO_API_KEY` dans Supabase Dashboard → Edge Functions → Secrets

---

## 🏗️ Architecture

### Structure des Fichiers

```
src/lib/
├── moneroo-client.ts          # Client principal Moneroo
├── moneroo-payment.ts          # Fonctions de paiement
├── moneroo-errors.ts           # Classes d'erreurs
├── moneroo-types.ts            # Types TypeScript
├── moneroo-config.ts           # Configuration centralisée
├── moneroo-retry.ts            # Système de retry
├── moneroo-rate-limiter.ts     # Rate limiting
├── moneroo-cache.ts            # Cache pour statistiques
├── moneroo-amount-validator.ts # Validation des montants
├── moneroo-lazy.ts             # Lazy loading
├── moneroo-stats.ts            # Statistiques
├── moneroo-webhook-validator.ts # Validation webhooks
└── moneroo-cancellation.ts     # Annulation de paiements

supabase/functions/
└── moneroo/
    └── index.ts                # Edge Function Moneroo
```

### Flux de Paiement

```
1. Utilisateur → Checkout Page
2. Checkout Page → initiateMonerooPayment()
3. initiateMonerooPayment() → Créer transaction dans Supabase
4. initiateMonerooPayment() → monerooClient.createCheckout()
5. monerooClient → Supabase Edge Function
6. Edge Function → API Moneroo
7. API Moneroo → Retourne checkout_url
8. Utilisateur → Redirigé vers Moneroo
9. Moneroo → Webhook vers Supabase
10. Webhook → Mise à jour transaction
11. Utilisateur → Redirigé vers /checkout/success
```

---

## 💻 Utilisation

### Initier un Paiement

```typescript
import { initiateMonerooPayment } from '@/lib/moneroo-payment';

const result = await initiateMonerooPayment({
  storeId: 'uuid-store-id',
  productId: 'uuid-product-id',
  amount: 10000, // En centimes (XOF)
  currency: 'XOF',
  description: 'Achat de produit',
  customerEmail: 'client@example.com',
  customerName: 'John Doe',
  customerPhone: '+226 XX XX XX XX',
  metadata: {
    // Métadonnées personnalisées
  },
});

// Rediriger vers l'URL de checkout
window.location.href = result.checkout_url;
```

### Vérifier le Statut d'une Transaction

```typescript
import { verifyTransactionStatus } from '@/lib/moneroo-payment';

const transaction = await verifyTransactionStatus('transaction-id');

if (transaction.status === 'completed') {
  // Paiement réussi
} else if (transaction.status === 'failed') {
  // Paiement échoué
} else {
  // Paiement en cours
}
```

### Rembourser un Paiement

```typescript
import { monerooClient } from '@/lib/moneroo-client';

const refund = await monerooClient.refundPayment({
  paymentId: 'payment-id',
  amount: 5000, // Montant partiel (optionnel)
  reason: 'Remboursement demandé par le client',
});
```

### Annuler un Paiement

```typescript
import { cancelMonerooPayment } from '@/lib/moneroo-payment';

const result = await cancelMonerooPayment({
  transactionId: 'transaction-id',
});

if (result.success) {
  // Annulation réussie
}
```

### Obtenir les Statistiques

```typescript
import { getAllMonerooStats } from '@/lib/moneroo-stats';

const stats = await getAllMonerooStats(
  new Date('2025-01-01'), // Date de début (optionnel)
  new Date('2025-12-31'), // Date de fin (optionnel)
  'store-id'              // Store ID (optionnel)
);

console.log(stats.payments);  // Statistiques de paiement
console.log(stats.revenue);   // Statistiques de revenus
console.log(stats.time);      // Statistiques de temps
```

---

## 🚨 Gestion des Erreurs

### Types d'Erreurs

```typescript
import {
  MonerooError,
  MonerooNetworkError,
  MonerooAPIError,
  MonerooTimeoutError,
  MonerooValidationError,
  MonerooAuthenticationError,
} from '@/lib/moneroo-errors';
```

### Exemple de Gestion d'Erreurs

```typescript
try {
  const result = await initiateMonerooPayment({...});
} catch (error) {
  if (error instanceof MonerooNetworkError) {
    // Erreur de réseau
    console.error('Problème de connexion:', error.message);
  } else if (error instanceof MonerooValidationError) {
    // Erreur de validation
    console.error('Données invalides:', error.message);
  } else if (error instanceof MonerooAPIError) {
    // Erreur API
    console.error('Erreur API:', error.message);
    console.error('Status:', error.statusCode);
  } else if (error instanceof MonerooError) {
    // Autre erreur Moneroo
    console.error('Erreur Moneroo:', error.message);
  } else {
    // Erreur inconnue
    console.error('Erreur inconnue:', error);
  }
}
```

### Messages d'Erreur

Les erreurs Moneroo incluent des messages détaillés avec :
- 💡 Conseils de dépannage
- 📋 Détails techniques
- 🔧 Solutions suggérées

---

## ⚙️ Configuration Avancée

### Rate Limiting

Le rate limiting est automatique mais peut être configuré :

```typescript
import { monerooRateLimiter } from '@/lib/moneroo-rate-limiter';

// Vérifier les statistiques
const stats = monerooRateLimiter.getStats('user-id');
console.log('Requêtes restantes:', stats.remaining);
console.log('Temps jusqu\'au reset:', stats.timeUntilReset);
```

### Cache

Le cache est automatique pour les statistiques :

```typescript
import { monerooStatsCache } from '@/lib/moneroo-cache';

// Vider le cache manuellement
monerooStatsCache.clear();

// Obtenir les statistiques du cache
const cacheStats = monerooStatsCache.getStats();
console.log('Taille du cache:', cacheStats.size);
```

### Retry

Le retry est automatique mais peut être configuré via les variables d'environnement.

---

## 🧪 Tests

### Tests Unitaires

```bash
npm test moneroo-amount-validator
npm test moneroo-retry
npm test moneroo-rate-limiter
```

### Tests E2E

```bash
npm run test:e2e checkout
```

---

## 🔧 Dépannage

### Problèmes Courants

#### 1. Erreur "Rate limit dépassé"

**Solution**: Attendre quelques secondes avant de réessayer, ou augmenter `VITE_MONEROO_RATE_LIMIT_MAX`.

#### 2. Erreur "Failed to fetch"

**Solution**: 
- Vérifier la connexion Internet
- Vérifier que l'Edge Function est déployée
- Vérifier les logs Supabase Edge Functions

#### 3. Erreur "Configuration API manquante"

**Solution**: 
- Vérifier que `MONEROO_API_KEY` est configuré dans Supabase Dashboard → Edge Functions → Secrets
- Vérifier que la clé est correcte

#### 4. Erreur "Montant invalide"

**Solution**: 
- Vérifier que le montant est dans les limites (voir `moneroo-amount-validator.ts`)
- Vérifier que le montant est un nombre entier (pas de décimales)

#### 5. Erreur de parsing

**Solution**: 
- Vérifier les logs Supabase Edge Functions
- Vérifier que l'API Moneroo répond correctement
- Vérifier la configuration de l'Edge Function

---

## 📚 Références

- [Documentation Moneroo](https://docs.moneroo.io/)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 🤝 Support

Pour toute question ou problème :
1. Consulter les logs Supabase Edge Functions
2. Vérifier la configuration
3. Consulter ce guide
4. Contacter l'équipe Payhula

---

**Dernière mise à jour**: Novembre 2025


