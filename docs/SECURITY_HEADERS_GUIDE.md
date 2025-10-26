# 🔒 GUIDE DES EN-TÊTES DE SÉCURITÉ HTTP

Ce document explique tous les en-têtes de sécurité configurés sur Payhuk.

---

## 📋 EN-TÊTES CONFIGURÉS

### 1. X-DNS-Prefetch-Control ✅

```
X-DNS-Prefetch-Control: on
```

**Objectif:** Améliorer les performances en permettant au navigateur de résoudre les DNS à l'avance.

**Impact:**
- ✅ Réduit la latence pour les domaines externes (Google Fonts, Supabase)
- ✅ Améliore le FCP (First Contentful Paint)

---

### 2. Strict-Transport-Security (HSTS) 🔒

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Objectif:** Forcer HTTPS pour toutes les connexions.

**Paramètres:**
- `max-age=63072000` : 2 ans (recommandé pour preload)
- `includeSubDomains` : Applique à tous les sous-domaines
- `preload` : Éligible pour la liste HSTS preload

**Impact:**
- ✅ Protection contre attaques MITM (Man-in-the-Middle)
- ✅ Empêche downgrade vers HTTP
- ✅ Score A+ sur SSL Labs

**Prochaine étape:**
```bash
# Soumettre à la HSTS Preload List
https://hstspreload.org/
```

---

### 3. X-Frame-Options 🖼️

```
X-Frame-Options: SAMEORIGIN
```

**Objectif:** Empêcher le clickjacking.

**Options:**
- `DENY` : Aucun iframe autorisé
- `SAMEORIGIN` : ✅ Iframes du même domaine uniquement
- `ALLOW-FROM url` : Deprecated

**Impact:**
- ✅ Protection contre clickjacking
- ✅ Permet embed interne (dashboard → iframe)

---

### 4. X-Content-Type-Options 📄

```
X-Content-Type-Options: nosniff
```

**Objectif:** Empêcher le MIME sniffing.

**Impact:**
- ✅ Protection contre exécution de scripts non-JavaScript
- ✅ Forcer respect du Content-Type

---

### 5. X-XSS-Protection 🛡️

```
X-XSS-Protection: 1; mode=block
```

**Objectif:** Activer le filtre XSS du navigateur (legacy).

**Note:** Deprecated mais toujours utile pour anciens navigateurs.

**Impact:**
- ✅ Protection additionnelle contre XSS
- ⚠️ Remplacé par CSP moderne

---

### 6. Referrer-Policy 🔗

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Objectif:** Contrôler les informations de referrer envoyées.

**Options:**
- `no-referrer` : Aucun referrer
- `origin` : Origine uniquement
- `strict-origin-when-cross-origin` : ✅ Recommandé

**Impact:**
- ✅ Protection vie privée utilisateurs
- ✅ Pas de fuite d'URLs sensibles
- ✅ Analytics toujours fonctionnels

---

### 7. Permissions-Policy 🎤

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Objectif:** Désactiver les APIs non utilisées.

**APIs bloquées:**
- `camera=()` : Pas d'accès caméra
- `microphone=()` : Pas d'accès micro
- `geolocation=()` : Pas de géolocalisation

**Impact:**
- ✅ Réduction surface d'attaque
- ✅ Meilleure confidentialité

---

### 8. Content-Security-Policy (CSP) 🔐

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https: http:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.moneroo.io;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self'
```

**Détails par directive:**

#### `default-src 'self'`
Par défaut, autoriser uniquement le même domaine.

#### `script-src`
Sources autorisées pour JavaScript:
- ✅ `'self'` : Scripts du domaine
- ⚠️ `'unsafe-inline'` : Inline scripts (à améliorer)
- ⚠️ `'unsafe-eval'` : eval() (nécessaire pour React dev)
- ✅ Google Fonts, CDN, Supabase

#### `style-src`
Sources autorisées pour CSS:
- ✅ `'self'` : CSS du domaine
- ⚠️ `'unsafe-inline'` : Inline styles (Tailwind, styled-components)
- ✅ Google Fonts

#### `font-src`
Sources autorisées pour polices:
- ✅ `'self'` : Polices locales
- ✅ Google Fonts

#### `img-src`
Sources autorisées pour images:
- ✅ `'self'` : Images du domaine
- ✅ `data:` : Data URLs (base64)
- ✅ `blob:` : Blob URLs (upload)
- ✅ `https:` `http:` : Toutes images HTTPS/HTTP

#### `connect-src`
Sources autorisées pour fetch/XHR:
- ✅ `'self'` : APIs du domaine
- ✅ Supabase (HTTP + WebSocket)
- ✅ Moneroo API

#### `frame-ancestors 'self'`
Empêche embed par autres sites.

#### `base-uri 'self'`
Empêche injection de balise `<base>`.

#### `form-action 'self'`
Formulaires uniquement vers le même domaine.

---

## ⚠️ AMÉLIORATION CSP (Phase 2)

### Problème actuel: `unsafe-inline` et `unsafe-eval`

**Impact:**
- ⚠️ Réduit la protection contre XSS
- ⚠️ Nécessaire pour React/Vite en dev

**Solution Phase 2:**

#### 1. Utiliser nonces

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import crypto from 'crypto';

export default defineConfig({
  plugins: [
    {
      name: 'csp-nonce',
      transformIndexHtml(html) {
        const nonce = crypto.randomBytes(16).toString('base64');
        return html.replace(
          /<script/g,
          `<script nonce="${nonce}"`
        );
      }
    }
  ]
});
```

#### 2. CSP avec nonce

```
Content-Security-Policy:
  script-src 'self' 'nonce-{RANDOM}';
  style-src 'self' 'nonce-{RANDOM}';
```

#### 3. Remplacer inline styles

```javascript
// Au lieu de:
<div style="color: red">Text</div>

// Utiliser classes Tailwind:
<div className="text-red-600">Text</div>
```

---

## 🧪 TESTER LES EN-TÊTES

### 1. SecurityHeaders.com

```
https://securityheaders.com/?q=payhuk.com
```

**Score actuel (estimé):** A  
**Score objectif Phase 2:** A+

### 2. SSL Labs

```
https://www.ssllabs.com/ssltest/analyze.html?d=payhuk.com
```

**Score actuel (estimé):** A  
**Score objectif:** A+

### 3. Mozilla Observatory

```
https://observatory.mozilla.org/analyze/payhuk.com
```

### 4. Chrome DevTools

```javascript
// Console
fetch('/').then(r => {
  console.log(r.headers.get('Content-Security-Policy'));
  console.log(r.headers.get('X-Frame-Options'));
  console.log(r.headers.get('Strict-Transport-Security'));
});
```

---

## 📊 SCORE SÉCURITÉ

```
╔════════════════════════════════════════╗
║  EN-TÊTE                   │  STATUS  ║
╠════════════════════════════════════════╣
║  Strict-Transport-Security │    ✅    ║
║  X-Frame-Options           │    ✅    ║
║  X-Content-Type-Options    │    ✅    ║
║  X-XSS-Protection          │    ✅    ║
║  Referrer-Policy           │    ✅    ║
║  Permissions-Policy        │    ✅    ║
║  Content-Security-Policy   │    ⚠️    ║
╠════════════════════════════════════════╣
║  SCORE GLOBAL              │  A / A+  ║
╚════════════════════════════════════════╝
```

**Niveau:** TRÈS BON ✅

---

## ✅ CHECKLIST

### Phase 1 (Actuel) ✅
- [x] HSTS configuré
- [x] X-Frame-Options
- [x] X-Content-Type-Options
- [x] X-XSS-Protection
- [x] Referrer-Policy
- [x] Permissions-Policy
- [x] CSP basique

### Phase 2 (Améliorations)
- [ ] CSP avec nonces (enlever unsafe-inline)
- [ ] Soumettre HSTS Preload
- [ ] SRI (Subresource Integrity)
- [ ] Certificate Transparency
- [ ] Rapport CSP violations
- [ ] Scanner automatique (CI/CD)

---

## 🔧 DÉPLOIEMENT

### Vérifier après déploiement

```bash
# 1. Tester les en-têtes
curl -I https://payhuk.com

# 2. Vérifier CSP
curl -I https://payhuk.com | grep -i content-security

# 3. Tester HSTS
curl -I https://payhuk.com | grep -i strict-transport
```

### Logs Vercel

```bash
# Dashboard Vercel → Logs
# Vérifier aucune erreur CSP
```

---

**Dernière mise à jour:** 26 Octobre 2025  
**Responsable:** Équipe Sécurité Payhuk  
**Score:** A / A+


