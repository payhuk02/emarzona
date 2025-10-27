# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - PAYHUK

**Date** : 27 octobre 2025  
**Plateforme** : Vercel + Supabase  
**Domaine** : À configurer  
**Durée estimée** : 1h30

---

## 📋 PRÉ-REQUIS

✅ Compte Vercel (gratuit) : https://vercel.com/signup  
✅ Compte Supabase (gratuit) : https://supabase.com  
✅ Projet Supabase déjà configuré  
✅ Code Git synchronisé (GitHub/GitLab)  
✅ Domaine personnalisé (optionnel)

---

## 🎯 PLAN DE DÉPLOIEMENT

```
PHASE 1: Préparation du Code (20min)
├── Variables d'environnement
├── Configuration build
├── Vérification finale
└── Commit & Push

PHASE 2: Déploiement Vercel (30min)
├── Connexion GitHub
├── Import projet
├── Configuration environnement
└── Premier déploiement

PHASE 3: Configuration Domaine (20min)
├── DNS Configuration
├── SSL/HTTPS automatique
└── Vérification

PHASE 4: Optimisations (20min)
├── Performance tuning
├── Cache configuration
├── Analytics setup
└── Monitoring
```

---

## PHASE 1 : PRÉPARATION DU CODE

### 1.1 Variables d'Environnement Production

Créez `.env.production` :

```env
# Supabase (PRODUCTION)
VITE_SUPABASE_URL=https://VOTRE_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
VITE_APP_NAME=Payhuk
VITE_APP_URL=https://payhuk.com
VITE_APP_ENV=production

# Features Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=false
VITE_ENABLE_HOTJAR=false

# Payment (Moneroo)
VITE_MONEROO_PUBLIC_KEY=pk_live_...

# Email (Optionnel - SendGrid/Resend)
# VITE_SENDGRID_API_KEY=SG.xxx
```

**⚠️ IMPORTANT :** 
- Ne jamais commit `.env.production` (déjà dans .gitignore)
- Utiliser les vraies clés PRODUCTION de Supabase
- Utiliser les clés LIVE de Moneroo

### 1.2 Vérifier vercel.json

Le fichier `vercel.json` existe déjà et est correctement configuré :

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

✅ Déjà optimisé pour SPA React !

### 1.3 Build Test Local

```bash
# Tester le build en local
npm run build

# Vérifier la taille du bundle
npm run build -- --report

# Preview du build
npm run preview
```

**Taille attendue :** < 500 KB (gzipped)

### 1.4 Commit Final

```bash
git add .
git commit -m "feat: Production ready - Payhuk v1.0"
git push origin main
```

---

## PHASE 2 : DÉPLOIEMENT VERCEL

### 2.1 Import Projet

1. **Aller sur** https://vercel.com/new
2. **Import Git Repository**
   - Sélectionner votre repo GitHub
   - Branch: `main`
3. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.2 Environment Variables

Dans Vercel → Settings → Environment Variables, ajouter :

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_NAME=Payhuk
VITE_APP_URL=https://payhuk.vercel.app (temporaire)
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_MONEROO_PUBLIC_KEY=pk_live_xxx
```

**Scope:** Production + Preview

### 2.3 Deploy

1. Cliquer **"Deploy"**
2. Attendre 2-3 minutes
3. ✅ **Déployé !**

**URL temporaire :** `https://payhuk.vercel.app`

---

## PHASE 3 : CONFIGURATION DOMAINE

### 3.1 Ajouter Domaine Personnalisé

**Vercel → Settings → Domains**

1. **Add Domain**
   - Entrer : `payhuk.com`
   - Entrer : `www.payhuk.com`

2. **Configure DNS**

Chez votre registrar (Namecheap, GoDaddy, etc.) :

```
Type    Name    Value                       TTL
A       @       76.76.21.21                 3600
CNAME   www     cname.vercel-dns.com        3600
```

**Attendre 24-48h pour propagation DNS**

### 3.2 SSL/HTTPS Automatique

✅ Vercel configure automatiquement SSL (Let's Encrypt)  
✅ HTTPS forcé par défaut  
✅ HTTP → HTTPS redirect automatique

### 3.3 Vérification

```bash
# Tester HTTPS
curl -I https://payhuk.com

# Devrait retourner:
# HTTP/2 200
# x-vercel-id: ...
```

---

## PHASE 4 : OPTIMISATIONS PRODUCTION

### 4.1 Supabase Production Settings

**Supabase Dashboard → Settings**

1. **Auth Settings**
   - Site URL: `https://payhuk.com`
   - Redirect URLs:
     - `https://payhuk.com/auth/callback`
     - `https://payhuk.com`

2. **CORS Configuration**
   ```
   https://payhuk.com
   https://www.payhuk.com
   ```

3. **Email Templates**
   - Customiser les emails (logo, couleurs)
   - Tester l'envoi

### 4.2 Vercel Performance

**Settings → Performance**

1. **Enable Speed Insights** ✅
2. **Enable Web Analytics** ✅
3. **Image Optimization** ✅ (automatique)

### 4.3 Cache Headers

Déjà configuré dans `vercel.json` :

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 4.4 Monitoring (Optionnel)

**Google Analytics**
```typescript
// Déjà intégré dans le système de pixels !
// Ajouter votre GA4 ID dans les settings de cours
```

**Sentry Error Tracking**
```bash
npm install @sentry/react

# Configurer dans src/main.tsx
```

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Checklist Complète

```bash
# 1. Homepage
✅ https://payhuk.com charge en < 2s
✅ Responsive mobile/tablet/desktop
✅ SEO meta tags présents

# 2. Authentification
✅ Sign up fonctionne
✅ Login fonctionne
✅ Email confirmation reçu
✅ Password reset fonctionne

# 3. Cours
✅ Liste cours s'affiche
✅ Création cours fonctionne (7 étapes)
✅ Upload vidéo fonctionne
✅ Enrollment fonctionne
✅ Progression sauvegardée

# 4. Notifications
✅ Notification enrollment créée
✅ Badge temps réel fonctionne
✅ Centre notifications accessible

# 5. Affiliation
✅ Activation affiliation fonctionne
✅ Génération liens fonctionne
✅ Dashboard affilié s'affiche

# 6. Analytics
✅ Google Analytics track (si configuré)
✅ Pixels FB/TikTok fonctionnent
✅ Dashboard instructeur s'affiche

# 7. Paiements
✅ Moneroo integration fonctionne
✅ Webhooks configurés
✅ Commandes enregistrées

# 8. Performance
✅ Lighthouse Score > 90
✅ First Contentful Paint < 1.5s
✅ Time to Interactive < 3s
```

---

## 🔒 SÉCURITÉ PRODUCTION

### Headers de Sécurité (Déjà configuré)

```
✅ X-Content-Type-Options: nosniff
✅ X-Frame-Options: DENY
✅ X-XSS-Protection: 1; mode=block
✅ HTTPS obligatoire
✅ CORS configuré
```

### Supabase RLS

```sql
-- Vérifier que TOUTES les tables ont RLS activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;

-- Devrait retourner 0 lignes !
```

### Variables Sensibles

```bash
# ❌ NE JAMAIS exposer en frontend :
- SUPABASE_SERVICE_ROLE_KEY (backend only)
- Database passwords
- API secrets

# ✅ OK en frontend :
- SUPABASE_URL
- SUPABASE_ANON_KEY (protégé par RLS)
- Public keys (Moneroo, GA, etc.)
```

---

## 📊 ANALYTICS & MONITORING

### Google Analytics 4

```typescript
// Déjà intégré !
// 1. Créer propriété GA4
// 2. Copier Measurement ID (G-XXXXXXXXXX)
// 3. Ajouter dans settings de chaque cours
```

### Vercel Analytics

```typescript
// Automatique avec Vercel Pro (optionnel)
// Dashboard → Analytics
// Voir :
// - Page views
// - Unique visitors
// - Top pages
// - Devices
```

### Uptime Monitoring (Gratuit)

**UptimeRobot** : https://uptimerobot.com

```
Monitor Type: HTTPS
URL: https://payhuk.com
Interval: 5 minutes
Email alerts: ON
```

---

## 🎯 CHECKLIST FINALE

### Avant le lancement public

- [ ] **Tests complets** (toutes fonctionnalités)
- [ ] **SEO optimisé** (meta tags, sitemap)
- [ ] **Analytics configuré** (GA4, pixels)
- [ ] **Emails testés** (signup, reset, notifications)
- [ ] **Paiements testés** (mode test puis live)
- [ ] **Domaine configuré** (DNS propagé)
- [ ] **SSL actif** (HTTPS forcé)
- [ ] **Monitoring actif** (uptime, errors)
- [ ] **Documentation utilisateur** (guide, FAQ)
- [ ] **Legal pages** (CGU, Politique confidentialité)

### Post-lancement

- [ ] **Annonce sur réseaux sociaux**
- [ ] **Email liste attente** (si applicable)
- [ ] **Press release** (optionnel)
- [ ] **Monitor performances** (Lighthouse, Core Web Vitals)
- [ ] **Collecter feedback utilisateurs**
- [ ] **Itérer et améliorer**

---

## 🚨 TROUBLESHOOTING

### Build Failed

```bash
# Vérifier les logs Vercel
# Souvent : dépendances manquantes

# Solution :
npm install
npm run build # Tester en local
```

### Variables d'environnement non chargées

```bash
# Vérifier dans Vercel → Settings → Environment Variables
# Redéployer après ajout :
Vercel → Deployments → ... → Redeploy
```

### DNS ne se propage pas

```bash
# Vérifier DNS :
nslookup payhuk.com

# Forcer flush DNS local :
ipconfig /flushdns (Windows)

# Attendre 24-48h
```

### CORS Errors

```bash
# Ajouter domaine dans Supabase :
# Dashboard → Settings → API → CORS
# Ajouter : https://payhuk.com
```

---

## 🎊 APRÈS LE DÉPLOIEMENT

### Prochaines étapes recommandées

1. **Content Marketing**
   - Créer 3-5 cours de démo
   - Guides d'utilisation
   - Vidéos tutoriels

2. **SEO**
   - Submit sitemap à Google Search Console
   - Optimiser meta descriptions
   - Créer backlinks

3. **Growth**
   - Programme d'affiliation actif
   - Referral program
   - Email marketing

4. **Amélioration Continue**
   - Analyser métriques utilisateurs
   - A/B testing
   - Collecter feedback
   - Itérer fonctionnalités

---

## 📞 SUPPORT

**Vercel Support** : https://vercel.com/support  
**Supabase Support** : https://supabase.com/support  
**Documentation Payhuk** : Voir fichiers MD du projet

---

## 🏆 FÉLICITATIONS !

**Payhuk est maintenant en production !** 🚀

Vous avez :
- ✅ Une plateforme e-learning professionnelle
- ✅ Déployée sur infrastructure serverless
- ✅ Optimisée pour performance
- ✅ Sécurisée avec HTTPS
- ✅ Scalable automatiquement
- ✅ Prête pour des milliers d'utilisateurs

**Bon lancement !** 🎉

