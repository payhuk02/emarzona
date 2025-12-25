# 🔒 Guide : Configuration des Headers de Sécurité sur Vercel

Ce guide explique comment configurer les headers de sécurité HTTP sur Vercel pour renforcer la sécurité de votre application Payhuk.

---

## 📋 Méthode 1 : Configuration via `vercel.json` (Recommandé)

### Étape 1 : Modifier le fichier `vercel.json`

Ajoutez une section `headers` pour toutes les routes (`/(.*)`) avec les headers de sécurité suivants :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.moneroo.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self';"
        }
      ]
    },
    {
      "source": "/assets/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/:path*.js",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/:path*.css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

### Étape 2 : Déployer sur Vercel

```bash
# Commit et push les changements
git add vercel.json
git commit -m "feat: Add security headers to Vercel configuration"
git push origin main
```

Vercel détectera automatiquement les changements et redéploiera votre application avec les nouveaux headers.

---

## 📋 Méthode 2 : Configuration via Dashboard Vercel (Alternative)

Si vous préférez configurer via l'interface Vercel :

1. **Accéder au Dashboard Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous à votre compte
   - Sélectionnez votre projet Payhuk

2. **Accéder aux Settings**
   - Cliquez sur votre projet
   - Allez dans **Settings** → **Headers**

3. **Ajouter les Headers**
   - Cliquez sur **Add Header**
   - Configurez chaque header individuellement :
     - **Source**: `/(.*)`
     - **Header Name**: `Strict-Transport-Security`
     - **Value**: `max-age=63072000; includeSubDomains; preload`
   - Répétez pour chaque header

⚠️ **Note**: Cette méthode est plus fastidieuse et moins maintenable que la méthode via `vercel.json`.

---

## 🔍 Explication des Headers de Sécurité

### 1. **Strict-Transport-Security (HSTS)**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- **Objectif**: Force HTTPS pour toutes les connexions
- **max-age**: 2 ans (63072000 secondes)
- **includeSubDomains**: Applique à tous les sous-domaines
- **preload**: Éligible pour la liste HSTS preload

### 2. **X-Frame-Options**
```
X-Frame-Options: SAMEORIGIN
```
- **Objectif**: Protection contre le clickjacking
- **SAMEORIGIN**: Permet les iframes du même domaine uniquement
- Alternative: `DENY` pour interdire tous les iframes

### 3. **X-Content-Type-Options**
```
X-Content-Type-Options: nosniff
```
- **Objectif**: Empêche le MIME sniffing
- **nosniff**: Force le respect du Content-Type déclaré

### 4. **X-XSS-Protection**
```
X-XSS-Protection: 1; mode=block
```
- **Objectif**: Active le filtre XSS du navigateur (legacy)
- **1; mode=block**: Bloque les pages si XSS détecté

### 5. **Referrer-Policy**
```
Referrer-Policy: strict-origin-when-cross-origin
```
- **Objectif**: Contrôle les informations de referrer envoyées
- **strict-origin-when-cross-origin**: Envoie l'origine complète uniquement pour les requêtes HTTPS vers HTTPS

### 6. **Permissions-Policy**
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```
- **Objectif**: Désactive les APIs sensibles par défaut
- **camera=()**: Désactive l'accès à la caméra
- **microphone=()**: Désactive l'accès au microphone
- **geolocation=()**: Désactive l'accès à la géolocalisation
- **interest-cohort=()**: Désactive FLoC (Federated Learning of Cohorts)

### 7. **Content-Security-Policy (CSP)**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.moneroo.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self';
```
- **Objectif**: Protection contre les injections (XSS, clickjacking, etc.)
- **default-src 'self'**: Par défaut, uniquement ressources du même domaine
- **script-src**: Autorise scripts depuis 'self', inline (React), eval (Vite), Google Fonts, CDN, Supabase
- **style-src**: Autorise styles depuis 'self', inline (Tailwind), Google Fonts
- **font-src**: Autorise fonts depuis 'self' et Google Fonts
- **img-src**: Autorise images depuis 'self', data URIs, blobs, HTTPS/HTTP
- **connect-src**: Autorise requêtes vers 'self', Supabase (HTTPS/WSS), Moneroo API
- **frame-ancestors 'self'**: Permet iframes uniquement depuis le même domaine
- **base-uri 'self'**: Restreint les balises `<base>`
- **form-action 'self'**: Restreint les soumissions de formulaires

---

## ✅ Vérification des Headers

### Méthode 1 : Outil en ligne (Recommandé)

1. **Security Headers**
   - Allez sur [securityheaders.com](https://securityheaders.com)
   - Entrez l'URL de votre site Vercel
   - Vérifiez le score (objectif: A+)

2. **Mozilla Observatory**
   - Allez sur [observatory.mozilla.org](https://observatory.mozilla.org)
   - Entrez l'URL de votre site
   - Vérifiez le score de sécurité

### Méthode 2 : Ligne de commande

```bash
# Vérifier les headers avec curl
curl -I https://votre-site.vercel.app

# Vérifier un header spécifique
curl -I https://votre-site.vercel.app | grep -i "strict-transport-security"
```

### Méthode 3 : DevTools du navigateur

1. Ouvrez votre site dans Chrome/Firefox
2. Ouvrez les DevTools (F12)
3. Allez dans l'onglet **Network**
4. Rechargez la page (F5)
5. Cliquez sur la requête principale
6. Allez dans l'onglet **Headers**
7. Vérifiez la section **Response Headers**

---

## 🎯 Score de Sécurité Attendu

Après configuration, vous devriez obtenir :

- **Security Headers**: A+ (100/100)
- **Mozilla Observatory**: A+ (115/100)
- **SSL Labs**: A+ (si HSTS preload activé)

---

## ⚠️ Dépannage

### Problème : Headers non appliqués

**Solution 1**: Vérifier que `vercel.json` est à la racine du projet
```bash
ls -la vercel.json  # Doit être à la racine
```

**Solution 2**: Vérifier la syntaxe JSON
```bash
# Valider le JSON
cat vercel.json | python -m json.tool
```

**Solution 3**: Redéployer manuellement
```bash
# Via Vercel CLI
vercel --prod

# Ou via GitHub (push)
git push origin main
```

### Problème : CSP bloque des ressources

**Solution**: Ajuster la CSP dans `vercel.json`
- Ajouter les domaines manquants dans les directives appropriées
- Tester avec `Content-Security-Policy-Report-Only` d'abord

### Problème : HSTS preload non accepté

**Solution**: Vérifier les prérequis
- HTTPS activé sur tous les sous-domaines
- Redirection HTTP → HTTPS configurée
- Header HSTS présent sur la réponse HTTPS
- Soumettre sur [hstspreload.org](https://hstspreload.org)

---

## 📚 Ressources Complémentaires

- [Documentation Vercel - Headers](https://vercel.com/docs/concepts/projects/project-configuration#headers)
- [MDN - HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [OWASP - Secure Headers](https://owasp.org/www-project-secure-headers/)
- [Security Headers](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)

---

## ✅ Checklist de Configuration

- [ ] Fichier `vercel.json` modifié avec les headers de sécurité
- [ ] Headers testés en local (si possible)
- [ ] Déploiement sur Vercel effectué
- [ ] Headers vérifiés avec Security Headers (score A+)
- [ ] Headers vérifiés avec Mozilla Observatory (score A+)
- [ ] CSP testée (aucune ressource bloquée)
- [ ] HSTS preload soumis (optionnel)

---

**🎉 Une fois ces étapes complétées, votre application Payhuk sera protégée par des headers de sécurité robustes !**

