# Variables d'Environnement - Emarzona

Ce document liste toutes les variables d'environnement nécessaires pour configurer l'application Emarzona.

## 📋 Quick Start

1. Créer un fichier `.env.local` à la racine du projet
2. Copier les variables ci-dessous
3. Remplir les valeurs selon votre configuration
4. Voir `src/lib/env-validator.ts` pour la validation complète

## 🔴 Variables Requises

### Supabase

```env
# URL de votre projet Supabase
VITE_SUPABASE_URL=https://votre-project-id.supabase.co

# Clé publique (anon key) de Supabase
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Où trouver ces valeurs** :
- Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
- Allez dans Settings > API
- Copiez l'URL du projet et la clé `anon public`

## 🟡 Variables Optionnelles

### Moneroo (Paiements)

```env
# URL de l'API Moneroo
VITE_MONEROO_API_URL=https://api.moneroo.com

# Timeout en millisecondes (défaut: 30000)
VITE_MONEROO_TIMEOUT_MS=30000

# Nombre maximum de tentatives (défaut: 3)
VITE_MONEROO_MAX_RETRIES=3

# Délai d'attente entre tentatives en ms (défaut: 1000)
VITE_MONEROO_RETRY_BACKOFF_MS=1000

# Durée de vie du cache en ms (défaut: 300000)
VITE_MONEROO_CACHE_TTL_MS=300000

# Taille maximale du cache (défaut: 100)
VITE_MONEROO_CACHE_MAX_SIZE=100

# Limite de taux - Maximum global (défaut: 100)
VITE_MONEROO_RATE_LIMIT_MAX=100

# Fenêtre de temps pour la limite de taux en ms (défaut: 60000)
VITE_MONEROO_RATE_LIMIT_WINDOW_MS=60000

# Limite de taux par utilisateur (défaut: 10)
VITE_MONEROO_RATE_LIMIT_USER_MAX=10

# Limite de taux par store (défaut: 50)
VITE_MONEROO_RATE_LIMIT_STORE_MAX=50
```

### PayDunya (Paiements alternatifs)

```env
# Clés d'API PayDunya
VITE_PAYDUNYA_MASTER_KEY=votre_master_key
VITE_PAYDUNYA_PRIVATE_KEY=votre_private_key
VITE_PAYDUNYA_PUBLIC_KEY=votre_public_key
VITE_PAYDUNYA_TOKEN=votre_token
```

### Sentry (Monitoring d'erreurs)

```env
# DSN Sentry pour le tracking des erreurs
VITE_SENTRY_DSN=https://votre-dsn@sentry.io/project-id

# Organisation Sentry (pour upload source maps)
VITE_SENTRY_ORG=votre-org

# Projet Sentry
VITE_SENTRY_PROJECT=emarzona

# Token d'authentification Sentry (pour upload source maps en production)
# ⚠️ NE PAS COMMITER CE TOKEN - Utiliser les secrets Vercel
SENTRY_AUTH_TOKEN=votre_sentry_auth_token
```

**Où trouver ces valeurs** :
- Connectez-vous à [Sentry Dashboard](https://sentry.io)
- Allez dans Settings > Projects > [Votre Projet] > Client Keys (DSN)
- Pour le token : Settings > Account > Auth Tokens

### Crisp (Chat en direct)

```env
# ID du site Crisp
VITE_CRISP_WEBSITE_ID=votre_crisp_website_id
```

**Où trouver cette valeur** :
- Connectez-vous à [Crisp Dashboard](https://app.crisp.chat)
- Allez dans Settings > Website Settings
- Copiez le Website ID

### Feature Flags

```env
# Activer le nouveau système de checkout
VITE_FEATURE_NEW_CHECKOUT=false

# Activer les analytics avancés
VITE_FEATURE_ADVANCED_ANALYTICS=false
```

## 🔒 Sécurité

### ⚠️ Important

- **Ne jamais commiter** le fichier `.env.local` avec des valeurs réelles
- Utiliser les **secrets Vercel** pour la production
- Les variables `VITE_*` sont exposées côté client (ne pas y mettre de secrets)
- Le token `SENTRY_AUTH_TOKEN` ne doit jamais être dans le code source

### Variables sensibles

Les variables suivantes contiennent des secrets et doivent être protégées :
- `VITE_SUPABASE_PUBLISHABLE_KEY` (exposée mais nécessaire côté client)
- `VITE_PAYDUNYA_*` (clés d'API)
- `SENTRY_AUTH_TOKEN` (token d'authentification)

## 🧪 Validation

L'application valide automatiquement les variables d'environnement au démarrage via `src/lib/env-validator.ts`.

En **développement** : Les erreurs de validation affichent des avertissements mais n'empêchent pas l'application de démarrer.

En **production** : Les erreurs de validation empêchent l'application de démarrer pour garantir la sécurité.

## 📚 Références

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Moneroo](https://moneroo.com/docs)
- [Documentation Sentry](https://docs.sentry.io)
- [Documentation Crisp](https://docs.crisp.chat)

---

*Dernière mise à jour : 2025-01-30*


