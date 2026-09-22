# Configuration Cloudflare — Cache Enterprise Emarzona

À appliquer dans le dashboard Cloudflare pour le domaine `emarzona.com` et `myemarzona.shop`.

---

## 1. Cache Reserve

**Caching → Cache Reserve → Enable**

Stocke les assets sur le disque edge Cloudflare pour hits plus rapides et moins d'origine Vercel.

---

## 2. Smart Tiered Cache

**Caching → Tiered Cache → Smart Tiering → Enable**

Réduit les requêtes vers l'origine via hiérarchie datacenters régionaux.

---

## 3. Argo Smart Routing

**Traffic → Argo Smart Routing → Enable**

Routage optimal pour latence mondiale (payant — ROI sur trafic international).

---

## 4. Compression & Protocoles

**Speed → Optimization**

| Option                  | Valeur                  |
| ----------------------- | ----------------------- |
| Brotli                  | ON                      |
| HTTP/3 (QUIC)           | ON                      |
| Early Hints             | ON                      |
| Auto Minify JS/CSS/HTML | OFF (Vite déjà minifié) |

---

## 5. Page Rules / Cache Rules

### Règle 1 — Assets immutables

```
URL: *emarzona.com/assets/*
Cache Level: Cache Everything
Edge TTL: 1 year
Browser TTL: 1 year
```

### Règle 2 — API cache (bypass)

```
URL: *emarzona.com/api/*
Cache Level: Bypass
```

### Règle 3 — SPA HTML

```
URL: *emarzona.com/*
Cache Level: Bypass (HTML géré par Vercel middleware bots)
```

### Règle 4 — Sitemaps

```
URL: *emarzona.com/sitemap*.xml
Cache Level: Cache Everything
Edge TTL: 1 hour
```

### Règle 5 — Storefront wildcard

```
URL: *.myemarzona.shop/assets/*
Cache Level: Cache Everything
Edge TTL: 1 year
```

### Règle 6 — JS/CSS boutiques (même TTL)

```
URL: *.myemarzona.shop/js/*
Cache Level: Cache Everything
Edge TTL: 1 year
```

### Règle 7 — Ne jamais challenger les assets build

Bot Fight / Super Bot Fight / WAF : **Skip** ou **Allow** pour :

```
*.myemarzona.shop/js/*
*.myemarzona.shop/assets/*
*.myemarzona.shop/fonts/*
*emarzona.com/js/*
*emarzona.com/assets/*
*emarzona.com/fonts/*
```

Sinon Cloudflare peut renvoyer **403** + CSP `connect-src 'none'` sur un chunk (page blanche SPA).

#### Critique — Bot Fight Mode (plan Free)

Les Custom Rules **ne peuvent pas skip Bot Fight Mode** (seulement Super Bot Fight Mode).

Si tu vois encore `/cdn-cgi/challenge-platform` + **403** sur `/js/*.js` :

1. Dashboard → zone **myemarzona.shop** → **Security** → **Bots**
2. **Bot Fight Mode** → **Off**  
   — ou, si Super Bot Fight Mode :
   - Definitely / Likely automated → **Allow**
   - **Static resource protection** → **Off**
   - **JavaScript detections** → **Off**
3. Relancer `node scripts/cloudflare-purge-and-skip-bots.mjs`

Sans cette étape, les boutiques `*.myemarzona.shop` restent en page blanche (mobile / DevTools).

### Règle 8 — Ne pas cacher les 404 assets

Cache Rules : pour `/js/*` et `/assets/*`, condition **Response Status Code equals 200** avant Cache Everything.
Les 404 (mauvais hash / casse) ne doivent **jamais** être mis en cache `immutable` un an.

### Script automatisé (purge + skip bots)

```powershell
$env:CLOUDFLARE_API_TOKEN = '<Zone.Cache Purge + Zone.WAF Edit>'
# optionnel si le lookup zone échoue :
# $env:CLOUDFLARE_ZONE_ID = '<zone id myemarzona.shop>'
node scripts/cloudflare-purge-and-skip-bots.mjs
```

---

## 6. Headers alignés Vercel

Les headers `vercel.json` complètent Cloudflare :

- `/assets/*` → `immutable, max-age=31536000`
- `/api/cache/health` → `no-store`
- Security headers (HSTS, X-Frame-Options)

---

## 7. Vérification

```bash
curl -I https://www.emarzona.com/assets/index.js
# Attendu: cf-cache-status: HIT (après 2e requête)
# cache-control: public, max-age=31536000, immutable
```

---

## 8. Monitoring Cloudflare

- **Analytics → Cache** : hit ratio cible > 85%
- **Analytics → Performance** : TTFB par pays
- Alertes : origin error rate > 1%
