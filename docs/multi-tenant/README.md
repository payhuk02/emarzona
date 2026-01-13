# 🏪 SYSTÈME MULTI-TENANT AVEC SOUS-DOMAINES

**Date** : 1 Février 2025  
**Version** : 1.0

---

## 🎯 OBJECTIF

Permettre à chaque vendeur d'avoir automatiquement une boutique accessible via :

```
https://nomboutique.myemarzona.shop
```

---

## 📁 FICHIERS CRÉÉS

### Base de Données

- ✅ `supabase/migrations/20250201000000_add_subdomain_support.sql`
  - Ajoute la colonne `subdomain` à la table `stores`
  - Crée les fonctions de validation
  - Crée le trigger de génération automatique

### Backend (Edge Functions)

- ✅ `supabase/functions/store-by-domain/index.ts`
  - Edge Function pour récupérer une boutique par sous-domaine
  - Gère les erreurs 404
  - Compatible Cloudflare

### Frontend

- ✅ `src/lib/subdomain-detector.ts`
  - Détecte le sous-domaine depuis `window.location.hostname`
  - Valide les sous-domaines
  - Liste des sous-domaines réservés

- ✅ `src/hooks/useStoreBySubdomain.ts`
  - Hook React Query pour récupérer une boutique par sous-domaine
  - Détection automatique du sous-domaine

- ✅ `src/components/multi-tenant/SubdomainMiddleware.tsx`
  - Middleware qui intercepte les requêtes sur sous-domaines
  - Charge automatiquement la boutique

- ✅ `src/components/multi-tenant/StoreNotFound.tsx`
  - Page 404 personnalisée pour boutiques inexistantes

### Scripts

- ✅ `scripts/validate-subdomain.ts`
  - Script de validation de sous-domaine
  - Usage : `tsx scripts/validate-subdomain.ts <subdomain>`

### Documentation

- ✅ `docs/multi-tenant/ARCHITECTURE_MULTI_TENANT_SUBDOMAINS.md`
  - Documentation complète de l'architecture
  - Configuration Cloudflare détaillée

- ✅ `docs/multi-tenant/GUIDE_DEPLOIEMENT_MULTI_TENANT.md`
  - Guide de déploiement étape par étape
  - Checklist complète

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Appliquer la Migration

```bash
# Via Supabase CLI
supabase migration up

# Ou via Dashboard
# SQL Editor → Coller le contenu de la migration → Run
```

### 2. Déployer l'Edge Function

```bash
supabase functions deploy store-by-domain
```

### 3. Configurer Cloudflare

1. Ajouter le domaine `myemarzona.shop`
2. Créer un enregistrement DNS wildcard :
   - Type : A
   - Name : \*
   - Content : IP de Vercel
   - Proxy : 🟠 Activé (orange cloud)
3. Configurer SSL/TLS : Full (strict)
4. Activer "Always Use HTTPS"

### 4. Tester

```bash
# Créer une boutique de test
# (via votre interface admin ou SQL)

# Valider un sous-domaine
tsx scripts/validate-subdomain.ts ma-boutique

# Accéder au sous-domaine
# https://ma-boutique.myemarzona.shop
```

---

## 📚 DOCUMENTATION

- [Architecture Complète](./ARCHITECTURE_MULTI_TENANT_SUBDOMAINS.md)
- [Guide de Déploiement](./GUIDE_DEPLOIEMENT_MULTI_TENANT.md)

---

## 🔒 SÉCURITÉ

- ✅ HTTPS obligatoire
- ✅ SSL wildcard automatique (Cloudflare)
- ✅ Validation des sous-domaines réservés
- ✅ Validation du format (RFC 1035)
- ✅ Isolation des données (RLS)
- ✅ Cookies sécurisés

---

## 🧪 VALIDATION

### Sous-domaines Réservés

Les sous-domaines suivants sont **interdits** :

- `www`, `admin`, `api`, `app`, `support`, `help`, `my`, `mail`
- `dashboard`, `account`, `auth`, `login`, `signup`
- `checkout`, `cart`, `order`, `product`, `category`
- Et bien d'autres... (voir la liste complète dans `subdomain-detector.ts`)

### Format Valide

- Lettres minuscules uniquement
- Chiffres autorisés
- Tirets autorisés (mais pas au début/fin)
- Maximum 63 caractères (RFC 1035)

---

## 🆘 SUPPORT

En cas de problème, consulter :

1. [Troubleshooting](./ARCHITECTURE_MULTI_TENANT_SUBDOMAINS.md#troubleshooting)
2. [Guide de Déploiement](./GUIDE_DEPLOIEMENT_MULTI_TENANT.md)

---

**Dernière mise à jour** : 1 Février 2025
