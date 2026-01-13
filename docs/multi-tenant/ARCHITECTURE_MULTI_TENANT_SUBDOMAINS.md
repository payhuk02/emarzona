# 🏗️ ARCHITECTURE MULTI-TENANT AVEC SOUS-DOMAINES

**Date** : 1 Février 2025  
**Version** : 1.0  
**Auteur** : Équipe Emarzona

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Configuration Cloudflare](#configuration-cloudflare)
4. [Base de données](#base-de-données)
5. [Backend (Edge Functions)](#backend-edge-functions)
6. [Frontend (React SPA)](#frontend-react-spa)
7. [Sécurité](#sécurité)
8. [Déploiement](#déploiement)
9. [Tests](#tests)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 VUE D'ENSEMBLE

### Objectif

**Séparation claire des domaines** :

1. **`emarzona.com`** - Plateforme principale
   - Dashboard, marketplace, administration
   - Pas de sous-domaines
   - Application React SPA complète

2. **`myemarzona.shop`** - Boutiques utilisateurs
   - Chaque vendeur reçoit automatiquement un sous-domaine
   - Format : `https://nomboutique.myemarzona.shop`
   - Génération automatique lors de la création

> 📚 Voir [SEPARATION_DOMAINES.md](./SEPARATION_DOMAINES.md) pour plus de détails

### Stack Technique

- **Frontend** : React (SPA) avec Vite
- **Backend** : Supabase Edge Functions (Deno)
- **Base de données** : PostgreSQL (Supabase)
- **DNS / SSL / Sécurité** : Cloudflare
- **Hébergement** : Vercel (Frontend) + Supabase (Backend)

### Fonctionnalités

✅ Wildcard subdomain : `*.myemarzona.shop`  
✅ Détection dynamique du sous-domaine depuis `req.headers.host`  
✅ Chargement automatique de la boutique depuis la base de données  
✅ Page 404 personnalisée si la boutique n'existe pas  
✅ Génération automatique du slug de boutique à la création  
✅ Validation des slugs réservés (www, admin, api, etc.)  
✅ HTTPS obligatoire avec SSL wildcard  
✅ Cookies sécurisés (SameSite=None; Secure)  
✅ Compatible Cloudflare Proxy (orange cloud activé)  
✅ Architecture scalable multi-tenant

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Flux de Requête

#### Sur emarzona.com (Plateforme)

```
1. Utilisateur accède à https://emarzona.com/dashboard
   ↓
2. Cloudflare route vers Vercel
   ↓
3. Vercel sert l'application React (SPA)
   ↓
4. SubdomainMiddleware détecte isPlatformDomain = true
   ↓
5. Pas de traitement multi-tenant → Application normale
```

#### Sur myemarzona.shop (Boutique)

```
1. Utilisateur accède à https://boutique.myemarzona.shop
   ↓
2. Cloudflare (DNS + SSL) route vers Vercel
   ↓
3. Vercel sert l'application React (SPA)
   ↓
4. React détecte le sous-domaine via window.location.hostname
   ↓
5. SubdomainMiddleware détecte isStoreDomain = true
   ↓
6. Charge la boutique via Edge Function
   ↓
7. Edge Function interroge PostgreSQL pour récupérer la boutique
   ↓
8. Si trouvée → Affiche la boutique
   Si non trouvée → Affiche page 404
```

### Schéma de Données

```sql
stores
├── id (UUID)
├── user_id (UUID)
├── name (TEXT)
├── slug (TEXT UNIQUE)
├── subdomain (TEXT UNIQUE) ← NOUVEAU
├── description (TEXT)
├── is_active (BOOLEAN)
└── ...
```

---

## ☁️ CONFIGURATION CLOUDFLARE

### 1. Ajouter le Domaine

1. Connectez-vous à Cloudflare
2. Ajoutez le domaine `myemarzona.shop`
3. Suivez les instructions pour configurer les nameservers

### 2. Configuration DNS

#### Enregistrement Wildcard (A Record)

| Type | Name | Content        | Proxy      | TTL  |
| ---- | ---- | -------------- | ---------- | ---- |
| A    | \*   | `IP_DE_VERCEL` | 🟠 Proxied | Auto |

**Important** : Activez le proxy (orange cloud) pour bénéficier de :

- Protection DDoS
- SSL automatique
- Cache CDN
- Analytics

#### Enregistrement Root (A Record)

| Type | Name | Content        | Proxy      | TTL  |
| ---- | ---- | -------------- | ---------- | ---- |
| A    | @    | `IP_DE_VERCEL` | 🟠 Proxied | Auto |

### 3. Configuration SSL/TLS

1. Allez dans **SSL/TLS** → **Overview**
2. Sélectionnez **Full (strict)** mode
3. Activez **Always Use HTTPS**
4. Activez **Automatic HTTPS Rewrites**

#### Certificat SSL Wildcard

Cloudflare génère automatiquement un certificat SSL wildcard pour `*.myemarzona.shop` quand le proxy est activé.

### 4. Configuration Page Rules (Optionnel)

Pour forcer HTTPS et rediriger www :

**Rule 1 : Force HTTPS**

- URL Pattern : `*myemarzona.shop/*`
- Settings :
  - Always Use HTTPS : ON

**Rule 2 : Redirect www to non-www** (si nécessaire)

- URL Pattern : `www.myemarzona.shop/*`
- Settings :
  - Forwarding URL : `https://myemarzona.shop/$1` (301)

### 5. Configuration Security

1. **WAF (Web Application Firewall)** : Activé
2. **Bot Fight Mode** : Activé (gratuit)
3. **Rate Limiting** : Configuré selon vos besoins
4. **Security Level** : Medium (ajustable)

### 6. Configuration Speed

1. **Auto Minify** : Activé (JS, CSS, HTML)
2. **Brotli** : Activé
3. **HTTP/2** : Activé automatiquement
4. **HTTP/3 (QUIC)** : Activé (si disponible)

### 7. Configuration Caching

1. **Caching Level** : Standard
2. **Browser Cache TTL** : Respect existing headers
3. **Always Online** : Activé

---

## 🗄️ BASE DE DONNÉES

### Migration SQL

Le fichier `supabase/migrations/20250201000000_add_subdomain_support.sql` contient :

1. **Colonne `subdomain`** ajoutée à la table `stores`
2. **Index unique** sur `subdomain`
3. **Fonction `is_subdomain_reserved()`** : Vérifie si un sous-domaine est réservé
4. **Fonction `is_valid_subdomain()`** : Valide le format (RFC 1035)
5. **Fonction `is_subdomain_available()`** : Vérifie disponibilité complète
6. **Fonction `generate_subdomain_from_slug()`** : Génère automatiquement un sous-domaine
7. **Trigger `auto_generate_subdomain()`** : Génère le sous-domaine à la création
8. **Fonction `get_store_by_subdomain()`** : Récupère une boutique par sous-domaine

### Appliquer la Migration

```bash
# Via Supabase CLI
supabase migration up

# Ou via Supabase Dashboard
# SQL Editor → Coller le contenu de la migration → Run
```

### Validation des Slugs Réservés

Les sous-domaines suivants sont **interdits** :

```sql
'www', 'admin', 'api', 'app', 'support', 'help', 'my', 'mail',
'ftp', 'smtp', 'pop', 'imap', 'blog', 'shop', 'store', 'marketplace',
'dashboard', 'account', 'accounts', 'auth', 'login', 'signup',
'register', 'password', 'reset', 'verify', 'confirm', 'settings',
'profile', 'billing', 'payment', 'checkout', 'cart', 'order', 'orders',
'product', 'products', 'category', 'categories', 'search', 'filter',
'filters', 'about', 'contact', 'terms', 'privacy', 'legal', 'faq',
'docs', 'documentation', 'status', 'health', 'ping', 'test', 'staging',
'dev', 'cdn', 'assets', 'static', 'media', 'images', 'files', ...
```

---

## ⚙️ BACKEND (EDGE FUNCTIONS)

### Edge Function : `store-by-domain`

**Fichier** : `supabase/functions/store-by-domain/index.ts`

**Endpoint** : `https://[PROJECT].supabase.co/functions/v1/store-by-domain`

**Méthode** : `GET`

**Headers** :

- `x-subdomain` (optionnel) : Le sous-domaine à rechercher
- `host` ou `x-forwarded-host` : Utilisé automatiquement pour extraire le sous-domaine

**Réponse Succès (200)** :

```json
{
  "success": true,
  "store": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ma Boutique",
    "slug": "ma-boutique",
    "subdomain": "ma-boutique",
    "description": "...",
    "is_active": true,
    "created_at": "2025-02-01T...",
    "updated_at": "2025-02-01T..."
  },
  "subdomain": "ma-boutique"
}
```

**Réponse Erreur (404)** :

```json
{
  "error": "Store not found",
  "message": "No active store found for subdomain: ma-boutique",
  "subdomain": "ma-boutique"
}
```

### Déployer l'Edge Function

```bash
# Via Supabase CLI
supabase functions deploy store-by-domain

# Vérifier le déploiement
supabase functions list
```

---

## ⚛️ FRONTEND (REACT SPA)

### Composants Créés

#### 1. `SubdomainMiddleware`

**Fichier** : `src/components/multi-tenant/SubdomainMiddleware.tsx`

**Rôle** :

- Détecte automatiquement le sous-domaine
- Charge la boutique correspondante
- Affiche un loader pendant le chargement
- Affiche la page 404 si la boutique n'existe pas

**Intégration** : Ajouté dans `App.tsx` autour de `AppContent`

#### 2. `StoreNotFound`

**Fichier** : `src/components/multi-tenant/StoreNotFound.tsx`

**Rôle** : Page 404 personnalisée pour les boutiques inexistantes

#### 3. `subdomain-detector.ts`

**Fichier** : `src/lib/subdomain-detector.ts`

**Fonctions** :

- `detectSubdomain()` : Détecte le sous-domaine depuis `window.location.hostname`
- `isSubdomainReserved()` : Vérifie si un sous-domaine est réservé
- `isValidSubdomainFormat()` : Valide le format
- `validateSubdomain()` : Validation complète

#### 4. `useStoreBySubdomain`

**Fichier** : `src/hooks/useStoreBySubdomain.ts`

**Hook React Query** pour récupérer une boutique par sous-domaine.

**Usage** :

```typescript
const { data: store, isLoading, isError } = useCurrentStoreBySubdomain();
```

---

## 🔒 SÉCURITÉ

### 1. HTTPS Obligatoire

- ✅ Cloudflare force HTTPS automatiquement
- ✅ Vercel redirige HTTP → HTTPS
- ✅ Cookies sécurisés avec `Secure` flag

### 2. Cookies Sécurisés

```typescript
// Configuration dans votre code
document.cookie = `store_id=${storeId}; Secure; SameSite=None; Path=/`;
```

### 3. Validation Côté Serveur

- ✅ Validation du format du sous-domaine (RFC 1035)
- ✅ Vérification des sous-domaines réservés
- ✅ Vérification de l'existence de la boutique
- ✅ Vérification que la boutique est active

### 4. Protection DDoS

- ✅ Cloudflare WAF activé
- ✅ Rate limiting configuré
- ✅ Bot Fight Mode activé

### 5. Isolation des Données

- ✅ RLS (Row Level Security) sur toutes les tables
- ✅ Chaque boutique ne voit que ses propres données
- ✅ Validation `store_id` sur toutes les requêtes

---

## 🚀 DÉPLOIEMENT

### 1. Appliquer la Migration

```bash
# Via Supabase CLI
supabase migration up

# Ou via Dashboard
# SQL Editor → Coller la migration → Run
```

### 2. Déployer l'Edge Function

```bash
supabase functions deploy store-by-domain
```

### 3. Configurer Cloudflare

Suivre les étapes dans [Configuration Cloudflare](#configuration-cloudflare)

### 4. Déployer le Frontend

```bash
# Build
npm run build

# Déployer sur Vercel
vercel deploy --prod
```

### 5. Vérifier la Configuration

1. Créer une boutique de test
2. Accéder à `https://test-boutique.myemarzona.shop`
3. Vérifier que la boutique se charge correctement

---

## 🧪 TESTS

### Test Manuel

1. **Créer une boutique** :

   ```sql
   INSERT INTO stores (user_id, name, slug, subdomain, is_active)
   VALUES ('user-uuid', 'Test Boutique', 'test-boutique', 'test-boutique', true);
   ```

2. **Accéder au sous-domaine** :

   ```
   https://test-boutique.myemarzona.shop
   ```

3. **Vérifier** :
   - ✅ La boutique se charge
   - ✅ Le sous-domaine est détecté
   - ✅ Les données de la boutique s'affichent

### Test avec Sous-domaine Réservé

1. Essayer de créer une boutique avec `subdomain = 'admin'`
2. Vérifier que l'erreur est retournée

### Test Page 404

1. Accéder à `https://boutique-inexistante.myemarzona.shop`
2. Vérifier que la page 404 s'affiche

---

## 🔧 TROUBLESHOOTING

### Problème : Sous-domaine non détecté

**Solution** :

1. Vérifier que Cloudflare proxy est activé (orange cloud)
2. Vérifier les headers `host` ou `x-forwarded-host`
3. Vérifier la configuration DNS

### Problème : SSL non valide

**Solution** :

1. Vérifier que Cloudflare SSL est en mode "Full (strict)"
2. Attendre la propagation DNS (peut prendre jusqu'à 48h)
3. Vérifier le certificat dans Cloudflare Dashboard

### Problème : Boutique non trouvée

**Solution** :

1. Vérifier que la boutique existe dans la base de données
2. Vérifier que `is_active = true`
3. Vérifier que le `subdomain` correspond exactement
4. Vérifier les logs de l'Edge Function

### Problème : CORS Error

**Solution** :

1. Vérifier les headers CORS dans l'Edge Function
2. Vérifier que Cloudflare n'ajoute pas de restrictions
3. Vérifier la configuration Vercel

---

## 📚 RESSOURCES

- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Router](https://reactrouter.com/)
- [RFC 1035 - Domain Names](https://tools.ietf.org/html/rfc1035)

---

**Dernière mise à jour** : 1 Février 2025
