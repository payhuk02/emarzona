# Configuration Vercel pour Payhuk
# Ce fichier contient les instructions pour configurer le déploiement

## 🚀 Déploiement sur Vercel

### 1. Variables d'environnement à configurer

Dans le dashboard Vercel, ajoutez ces variables d'environnement :

```
VITE_SUPABASE_URL=https://hbdnzajbyjakdhuavrvb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM
VITE_SUPABASE_PROJECT_ID=hbdnzajbyjakdhuavrvb
```

### 2. Configuration du build

Le fichier `vercel.json` est configuré pour :
- ✅ Build automatique avec Vite
- ✅ Service Worker pour PWA
- ✅ Headers de sécurité
- ✅ Cache optimisé
- ✅ Redirections SPA
- ✅ Variables d'environnement sécurisées

### 3. Commandes de déploiement

```bash
# Installation de Vercel CLI (optionnel)
npm i -g vercel

# Déploiement
vercel

# Déploiement en production
vercel --prod
```

### 4. Fonctionnalités PWA

Le projet est configuré comme PWA avec :
- Service Worker (`/sw.js`)
- Manifest (`/manifest.json`)
- Cache optimisé pour les assets
- Headers appropriés pour le service worker

### 5. Sécurité

Headers de sécurité configurés :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 6. Optimisations

- Cache des assets statiques (1 an)
- Cache du service worker (no-cache)
- URLs propres (sans trailing slash)
- Redirections optimisées

## 📋 Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] SSL activé automatiquement
- [ ] Build réussi
- [ ] Service Worker fonctionnel
- [ ] PWA installable
- [ ] Connexion Supabase testée

## 🎯 Résultat attendu

Après déploiement, votre application Payhuk sera accessible via :
- URL Vercel : `https://payhuk.vercel.app`
- PWA installable sur mobile/desktop
- Performance optimisée
- Sécurité renforcée
