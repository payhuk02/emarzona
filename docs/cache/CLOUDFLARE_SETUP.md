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
