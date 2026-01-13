# ✅ Vérification Complète de la Configuration Multi-Domaines

**Date** : 13 Janvier 2026  
**Statut** : Configuration complète  
**Domaines** : `emarzona.com` (plateforme) + `myemarzona.shop` (boutiques)

---

## 🎯 Vue d'Ensemble

Cette plateforme utilise une architecture multi-domaines pour séparer clairement :

1. **`emarzona.com`** - Plateforme principale
   - Dashboard vendeur
   - Marketplace public
   - Administration
   - Authentification
   - Pas de sous-domaines

2. **`myemarzona.shop`** - Boutiques utilisateurs
   - Chaque vendeur reçoit automatiquement un sous-domaine
   - Format : `https://nomboutique.myemarzona.shop`
   - Génération automatique lors de la création de boutique

---

## ✅ Checklist de Vérification

### 1. Configuration DNS Cloudflare

#### Domaine `emarzona.com`

- [ ] Domaine ajouté à Cloudflare
- [ ] Nameservers configurés correctement
- [ ] Enregistrement A ou CNAME pointant vers Vercel
- [ ] Proxy Cloudflare activé (🟠 orange cloud)
- [ ] SSL/TLS configuré en mode "Full (strict)"
- [ ] "Always Use HTTPS" activé

#### Domaine `myemarzona.shop`

- [ ] Domaine ajouté à Cloudflare
- [ ] Nameservers configurés correctement
- [ ] Enregistrement DNS wildcard créé :
  - Type : `A` ou `CNAME`
  - Name : `*` (astérisque)
  - Target : IP Vercel ou `cname.vercel-dns.com`
  - Proxy : 🟠 **Proxied** (orange cloud activé)
- [ ] Enregistrement root créé :
  - Type : `A` ou `CNAME`
  - Name : `@`
  - Target : IP Vercel ou `cname.vercel-dns.com`
  - Proxy : 🟠 **Proxied**
- [ ] SSL/TLS configuré en mode "Full (strict)"
- [ ] "Always Use HTTPS" activé
- [ ] Certificat SSL wildcard généré automatiquement

**Vérification DNS** :
```bash
# Tester le domaine principal
nslookup emarzona.com

# Tester le domaine des boutiques
nslookup myemarzona.shop

# Tester un sous-domaine wildcard
nslookup test-boutique.myemarzona.shop
```

---

### 2. Configuration Vercel

#### Domaines Configurés

- [ ] `emarzona.com` ajouté dans Vercel :
  - Settings → Domains → Add Domain
  - Vérifier que le domaine est "Valid"
  - Vérifier que SSL est "Valid"

- [ ] `myemarzona.shop` ajouté dans Vercel :
  - Settings → Domains → Add Domain
  - Vérifier que le domaine est "Valid"
  - Vérifier que SSL est "Valid"

- [ ] Wildcard `*.myemarzona.shop` configuré :
  - Vercel détecte automatiquement les sous-domaines
  - Tous les sous-domaines pointent vers le même déploiement

#### Variables d'Environnement Vercel

Vérifier que les variables suivantes sont configurées dans Vercel :

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_APP_DOMAIN=emarzona.com`
- [ ] `VITE_SITE_URL=https://emarzona.com`
- [ ] `VITE_PUBLIC_STORE_DOMAIN=myemarzona.shop`

**Accès** : Vercel Dashboard → Project → Settings → Environment Variables

---

### 3. Configuration Code (Fichiers)

#### ✅ Fichiers Vérifiés et Configurés

- [x] **`src/lib/subdomain-detector.ts`**
  - ✅ `PLATFORM_DOMAINS` inclut `emarzona.com`
  - ✅ `STORE_DOMAINS` inclut `myemarzona.shop`
  - ✅ Détection correcte des deux domaines

- [x] **`vercel.json`**
  - ✅ CSP inclut `emarzona.com` et `*.myemarzona.shop`
  - ✅ Headers de sécurité configurés pour les deux domaines
  - ✅ Rewrites configurés pour SPA

- [x] **`supabase/functions/store-by-domain/index.ts`**
  - ✅ Traite uniquement les domaines de boutiques (`myemarzona.shop`)
  - ✅ Ignore les domaines de plateforme (`emarzona.com`)

- [x] **`src/lib/store-utils.ts`**
  - ✅ `generateStoreUrl()` utilise `myemarzona.shop`
  - ✅ `generateProductUrl()` utilise `myemarzona.shop`

- [x] **`src/hooks/useStoreBySubdomain.ts`**
  - ✅ S'active uniquement sur `myemarzona.shop`
  - ✅ Ignore `emarzona.com`

- [x] **`src/components/multi-tenant/SubdomainMiddleware.tsx`**
  - ✅ Charge la boutique uniquement sur `myemarzona.shop`
  - ✅ Ignore `emarzona.com`

---

### 4. Base de Données

#### Migration SQL

- [ ] Migration `20250201000000_add_subdomain_support.sql` exécutée :
  - Colonne `subdomain` ajoutée à la table `stores`
  - Index unique sur `subdomain`
  - Fonction `get_store_by_subdomain()` créée
  - Trigger `auto_generate_subdomain()` créé

**Vérification** :
```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' AND column_name = 'subdomain';

-- Vérifier qu'une boutique a un subdomain
SELECT id, name, slug, subdomain 
FROM stores 
LIMIT 5;

-- Tester la fonction
SELECT get_store_by_subdomain('test-boutique');
```

---

### 5. Tests Fonctionnels

#### Test 1 : Accès Plateforme (`emarzona.com`)

- [ ] Accéder à `https://emarzona.com`
- [ ] Vérifier que la page se charge correctement
- [ ] Vérifier que le certificat SSL est valide (cadenas vert)
- [ ] Vérifier qu'aucune boutique n'est chargée automatiquement
- [ ] Tester le dashboard : `https://emarzona.com/dashboard`
- [ ] Tester le marketplace : `https://emarzona.com/marketplace`

#### Test 2 : Accès Boutique (`myemarzona.shop`)

- [ ] Créer une boutique de test dans le dashboard
- [ ] Vérifier que le `subdomain` est généré automatiquement
- [ ] Accéder à `https://[subdomain].myemarzona.shop`
- [ ] Vérifier que la boutique se charge correctement
- [ ] Vérifier que le certificat SSL est valide (cadenas vert)
- [ ] Vérifier que les produits s'affichent correctement
- [ ] Tester la navigation dans la boutique

#### Test 3 : Boutique Inexistante

- [ ] Accéder à `https://boutique-inexistante.myemarzona.shop`
- [ ] Vérifier que la page 404 personnalisée s'affiche
- [ ] Vérifier que le message d'erreur est clair

#### Test 4 : Sous-domaines Réservés

- [ ] Essayer de créer une boutique avec un sous-domaine réservé (`admin`, `www`, etc.)
- [ ] Vérifier que la validation rejette le sous-domaine réservé
- [ ] Vérifier que `https://admin.myemarzona.shop` ne charge pas de boutique

---

### 6. Sécurité

#### Headers de Sécurité

- [ ] Vérifier les headers HTTP sur `emarzona.com` :
  ```bash
  curl -I https://emarzona.com
  ```
  - ✅ `Strict-Transport-Security` présent
  - ✅ `X-Frame-Options: SAMEORIGIN` présent
  - ✅ `Content-Security-Policy` présent et inclut les deux domaines

- [ ] Vérifier les headers HTTP sur `*.myemarzona.shop` :
  ```bash
  curl -I https://test-boutique.myemarzona.shop
  ```
  - ✅ Headers de sécurité présents
  - ✅ CSP inclut `*.myemarzona.shop`

#### SSL/TLS

- [ ] Certificat SSL valide sur `emarzona.com`
- [ ] Certificat SSL wildcard valide sur `*.myemarzona.shop`
- [ ] Pas d'avertissements de sécurité dans le navigateur
- [ ] HTTPS forcé automatiquement (pas de HTTP)

#### CORS

- [ ] Edge Function `store-by-domain` configure correctement les headers CORS
- [ ] Les requêtes depuis `emarzona.com` vers les boutiques fonctionnent
- [ ] Les requêtes depuis `*.myemarzona.shop` vers l'API fonctionnent

---

### 7. Performance

#### Cloudflare CDN

- [ ] Cache Cloudflare activé pour les assets statiques
- [ ] Cache Cloudflare activé pour les pages statiques
- [ ] Purge du cache disponible si nécessaire

#### Vercel

- [ ] Déploiement automatique configuré
- [ ] Preview deployments fonctionnent
- [ ] Analytics Vercel activés (optionnel)

---

### 8. Monitoring et Logs

#### Logs

- [ ] Logs Cloudflare activés
- [ ] Logs Vercel activés
- [ ] Logs Supabase Edge Functions activés

#### Monitoring

- [ ] Sentry configuré pour les deux domaines
- [ ] Erreurs trackées correctement
- [ ] Performance monitoring activé

---

## 🔧 Commandes de Vérification

### Vérification DNS

```bash
# Vérifier la résolution DNS
nslookup emarzona.com
nslookup myemarzona.shop
nslookup test-boutique.myemarzona.shop

# Vérifier avec dig (plus détaillé)
dig emarzona.com
dig myemarzona.shop
dig test-boutique.myemarzona.shop
```

### Vérification SSL

```bash
# Vérifier le certificat SSL
openssl s_client -connect emarzona.com:443 -servername emarzona.com
openssl s_client -connect myemarzona.shop:443 -servername myemarzona.shop
openssl s_client -connect test-boutique.myemarzona.shop:443 -servername test-boutique.myemarzona.shop

# Ou utiliser un service en ligne
# https://www.ssllabs.com/ssltest/
```

### Vérification HTTP

```bash
# Vérifier les headers
curl -I https://emarzona.com
curl -I https://myemarzona.shop
curl -I https://test-boutique.myemarzona.shop

# Vérifier le contenu
curl https://emarzona.com
curl https://test-boutique.myemarzona.shop
```

---

## 📋 Résumé de Configuration

### Domaines

| Domaine | Usage | Sous-domaines | SSL |
|---------|-------|----------------|-----|
| `emarzona.com` | Plateforme principale | Non | ✅ |
| `myemarzona.shop` | Boutiques utilisateurs | Oui (wildcard) | ✅ |

### DNS Cloudflare

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| A/CNAME | `@` | Vercel IP/CNAME | 🟠 Proxied |
| A/CNAME | `*` | Vercel IP/CNAME | 🟠 Proxied |

### Vercel

- ✅ `emarzona.com` configuré
- ✅ `myemarzona.shop` configuré
- ✅ Wildcard `*.myemarzona.shop` automatique

### Code

- ✅ Détection de domaine configurée
- ✅ Routage multi-tenant configuré
- ✅ CSP et headers de sécurité mis à jour
- ✅ Edge Functions configurées

---

## 🆘 Dépannage

### Problème : Le sous-domaine ne se résout pas

**Solutions** :
1. Vérifier que l'enregistrement DNS wildcard existe dans Cloudflare
2. Vérifier que le proxy est activé (🟠 orange cloud)
3. Attendre la propagation DNS (5-15 minutes)
4. Vider le cache DNS local

### Problème : Erreur SSL/TLS

**Solutions** :
1. Vérifier que le proxy Cloudflare est activé (🟠 orange)
2. Changer le mode SSL/TLS en "Full" (au lieu de "Full strict")
3. Attendre la génération du certificat SSL (jusqu'à 24h)
4. Vérifier dans Vercel que le domaine est validé

### Problème : La boutique ne se charge pas

**Solutions** :
1. Vérifier que le `subdomain` existe dans la base de données
2. Vérifier les logs de l'Edge Function `store-by-domain`
3. Vérifier que la boutique est active (`is_active = true`)
4. Vérifier la console du navigateur pour les erreurs

### Problème : CSP bloque les ressources

**Solutions** :
1. Vérifier que `vercel.json` inclut `*.myemarzona.shop` dans la CSP
2. Vérifier les erreurs CSP dans la console du navigateur
3. Ajouter les domaines manquants dans la CSP

---

## 📚 Documentation Associée

- [Architecture Multi-Tenant](./ARCHITECTURE_MULTI_TENANT_SUBDOMAINS.md)
- [Guide Cloudflare Wildcard DNS](./GUIDE_CLOUDFLARE_WILDCARD_DNS.md)
- [Guide Vercel Wildcard Domain](./GUIDE_VERCEL_WILDCARD_DOMAIN.md)
- [Séparation des Domaines](./SEPARATION_DOMAINES.md)

---

**Dernière mise à jour** : 13 Janvier 2026
