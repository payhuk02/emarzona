# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - PAYHUK

**Date :** 26 Octobre 2025  
**Version :** 1.0.0  
**Statut :** ✅ Production Ready

---

## 📋 TABLE DES MATIÈRES

1. [Pré-requis](#pré-requis)
2. [Variables d'environnement](#variables-denvironnement)
3. [Déploiement sur Vercel](#déploiement-sur-vercel)
4. [Configuration Supabase](#configuration-supabase)
5. [Domaine personnalisé](#domaine-personnalisé)
6. [Vérifications post-déploiement](#vérifications-post-déploiement)
7. [Monitoring et maintenance](#monitoring-et-maintenance)
8. [Rollback et troubleshooting](#rollback-et-troubleshooting)

---

## ✅ PRÉ-REQUIS

### Comptes nécessaires :

- [ ] **GitHub** - Repo du code source
- [ ] **Vercel** - Hébergement et déploiement (gratuit)
- [ ] **Supabase** - Backend et base de données (gratuit)
- [ ] **Sentry** (optionnel) - Monitoring des erreurs
- [ ] **Moneroo** (optionnel) - Paiements en ligne

### Outils installés en local :

- [ ] Node.js 18+ (`node --version`)
- [ ] npm 9+ (`npm --version`)
- [ ] Git (`git --version`)
- [ ] Supabase CLI (`supabase --version`) - optionnel

---

## 🔑 VARIABLES D'ENVIRONNEMENT

### Variables obligatoires :

| Variable | Description | Où la trouver |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase (anon key) | Supabase Dashboard > Settings > API |

### Variables optionnelles :

| Variable | Description | Où la trouver |
|----------|-------------|---------------|
| `VITE_SENTRY_DSN` | DSN Sentry pour le monitoring | Sentry.io > Project Settings > Client Keys |
| `VITE_MONEROO_API_KEY` | Clé API Moneroo | Moneroo Dashboard > API Keys |
| `VITE_GA_ID` | Google Analytics ID | Google Analytics |
| `VITE_FB_PIXEL_ID` | Facebook Pixel ID | Facebook Business Manager |

### Créer un fichier `.env.local` pour le développement :

```bash
# .env.local (ne pas committer)
VITE_SUPABASE_URL=https://votre-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 DÉPLOIEMENT SUR VERCEL

### Méthode 1 : Depuis GitHub (Recommandée)

#### 1️⃣ **Pousser le code sur GitHub**

```bash
# Si ce n'est pas déjà fait
git init
git add .
git commit -m "feat: application Payhuk prête pour production avec 5 langues"
git branch -M main
git remote add origin https://github.com/votre-username/payhuk.git
git push -u origin main
```

#### 2️⃣ **Connecter Vercel à GitHub**

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Sélectionnez **"Import Git Repository"**
4. Choisissez votre repo **payhuk**
5. Cliquez sur **"Import"**

#### 3️⃣ **Configurer le projet Vercel**

Dans la page de configuration :

| Champ | Valeur |
|-------|--------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x |

#### 4️⃣ **Ajouter les variables d'environnement**

Dans **Project Settings > Environment Variables** :

1. Cliquez sur **"Add"**
2. Ajoutez chaque variable :
   - **Name** : `VITE_SUPABASE_URL`
   - **Value** : `https://votre-project-id.supabase.co`
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
3. Répétez pour `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Ajoutez les variables optionnelles si nécessaire

#### 5️⃣ **Déployer**

1. Cliquez sur **"Deploy"**
2. Attendez la fin du build (environ 2-3 minutes)
3. Votre app est en ligne ! 🎉

**URL de production :** `https://votre-projet.vercel.app`

---

### Méthode 2 : Depuis la CLI Vercel

#### 1️⃣ **Installer Vercel CLI**

```bash
npm install -g vercel
```

#### 2️⃣ **Se connecter**

```bash
vercel login
```

#### 3️⃣ **Déployer**

```bash
# Depuis le dossier du projet
vercel

# Pour forcer un déploiement en production
vercel --prod
```

#### 4️⃣ **Ajouter les variables d'environnement**

```bash
vercel env add VITE_SUPABASE_URL
# Collez la valeur et appuyez sur Entrée
# Sélectionnez : Production, Preview, Development

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Répétez le processus
```

---

## 🗄️ CONFIGURATION SUPABASE

### 1️⃣ **Créer un projet Supabase**

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur **"New Project"**
3. Remplissez :
   - **Name** : Payhuk
   - **Database Password** : Générez un mot de passe fort
   - **Region** : Europe (West) - pour la France
   - **Pricing Plan** : Free (pour commencer)
4. Attendez la création du projet (1-2 minutes)

### 2️⃣ **Récupérer les credentials**

Dans **Project Settings > API** :

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### 3️⃣ **Exécuter les migrations**

#### Option A : Via Supabase CLI

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref votre-project-id

# Pousser les migrations
supabase db push
```

#### Option B : Via SQL Editor (manuel)

1. Dans le Dashboard Supabase, allez dans **SQL Editor**
2. Exécutez chaque fichier de migration dans l'ordre :
   - `supabase/migrations/20251018000001_initial_schema.sql`
   - `supabase/migrations/20251018000002_complete_profile_system.sql`
   - ... tous les autres fichiers (52 migrations au total)

### 4️⃣ **Configurer les buckets de Storage**

Dans **Storage** :

1. Créez les buckets suivants :
   - `avatars` (Public)
   - `products` (Public)
   - `product-files` (Private)
   - `stores` (Public)

2. Pour chaque bucket, configurez les **RLS Policies** :

```sql
-- Exemple pour le bucket 'products'
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'products' AND
  auth.uid() = owner
);
```

### 5️⃣ **Déployer les Edge Functions**

```bash
# Déployer toutes les fonctions
supabase functions deploy moneroo
supabase functions deploy moneroo-webhook
supabase functions deploy rate-limiter

# Configurer les secrets
supabase secrets set MONEROO_API_KEY=votre_clé_moneroo
```

### 6️⃣ **Vérifier les RLS Policies**

Dans **Authentication > Policies**, vérifiez que toutes les tables ont des policies :

- ✅ `profiles`
- ✅ `stores`
- ✅ `products`
- ✅ `orders`
- ✅ `affiliates`
- ✅ `disputes`
- ✅ `rate_limits`

---

## 🌐 DOMAINE PERSONNALISÉ

### 1️⃣ **Ajouter un domaine dans Vercel**

1. Dans **Project Settings > Domains**
2. Cliquez sur **"Add"**
3. Entrez votre domaine : `payhuk.com`
4. Cliquez sur **"Add"**

### 2️⃣ **Configurer les DNS**

Vercel vous donnera des instructions pour configurer vos DNS :

#### Si vous utilisez Namecheap, GoDaddy, etc. :

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.21.21` | 3600 |
| CNAME | www | `cname.vercel-dns.com` | 3600 |

#### Si vous utilisez Cloudflare :

1. Désactivez le proxy (☁️ gris)
2. Ajoutez les enregistrements ci-dessus
3. Attendez la propagation (5-30 minutes)

### 3️⃣ **Vérifier le domaine**

```bash
# Vérifier la propagation DNS
dig payhuk.com

# Ou utilisez
nslookup payhuk.com
```

### 4️⃣ **Activer HTTPS**

Vercel active automatiquement HTTPS avec Let's Encrypt.  
Attendez quelques minutes après la configuration DNS.

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1️⃣ **Checklist de base**

- [ ] L'app se charge sans erreur
- [ ] Les 5 langues (FR, EN, ES, DE, PT) fonctionnent
- [ ] L'authentification fonctionne (inscription/connexion)
- [ ] Les images se chargent correctement
- [ ] Le thème clair/sombre fonctionne
- [ ] Les pages chargent rapidement (< 3 secondes)

### 2️⃣ **Test des fonctionnalités critiques**

```bash
# Landing Page
✓ Ouvrir https://payhuk.com
✓ Changer de langue via le sélecteur 🌐
✓ Vérifier que les traductions fonctionnent

# Authentification
✓ Créer un compte (vérifier l'email de confirmation)
✓ Se connecter avec le nouveau compte
✓ Se déconnecter
✓ Réinitialiser le mot de passe

# Dashboard
✓ Créer une boutique
✓ Ajouter un produit
✓ Modifier un produit
✓ Supprimer un produit

# Marketplace
✓ Voir les produits publics
✓ Filtrer par catégorie
✓ Rechercher un produit

# Storefront
✓ Visiter une boutique publique
✓ Voir les détails d'un produit
✓ Tester l'achat (mode test Moneroo)

# Responsive
✓ Mobile (iPhone 12, Samsung Galaxy)
✓ Tablet (iPad)
✓ Desktop (1920x1080)
```

### 3️⃣ **Vérifier les performances**

Utilisez [PageSpeed Insights](https://pagespeed.web.dev/) :

```
https://pagespeed.web.dev/?url=https://payhuk.com
```

**Objectifs :**
- ✅ Performance : > 90
- ✅ Accessibility : > 95
- ✅ Best Practices : > 95
- ✅ SEO : > 95

### 4️⃣ **Vérifier le SEO**

- [ ] `robots.txt` accessible : `https://payhuk.com/robots.txt`
- [ ] `sitemap.xml` accessible : `https://payhuk.com/sitemap.xml`
- [ ] Meta tags présents sur toutes les pages
- [ ] Schema.org visible dans Google Search Console

### 5️⃣ **Vérifier la sécurité**

Utilisez [Security Headers](https://securityheaders.com/) :

```
https://securityheaders.com/?q=https://payhuk.com
```

**Headers attendus :**
- ✅ Strict-Transport-Security
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Content-Security-Policy
- ✅ Referrer-Policy
- ✅ Permissions-Policy

---

## 📊 MONITORING ET MAINTENANCE

### 1️⃣ **Monitoring avec Vercel Analytics**

1. Dans **Project Settings > Analytics**, activez :
   - ✅ Web Analytics
   - ✅ Speed Insights
   - ✅ Web Vitals

2. Dashboard disponible dans **Analytics** :
   - Trafic en temps réel
   - Core Web Vitals
   - Top pages
   - Géographie des visiteurs

### 2️⃣ **Monitoring des erreurs avec Sentry**

1. Créez un projet sur [sentry.io](https://sentry.io)
2. Copiez le DSN
3. Ajoutez-le à Vercel : `VITE_SENTRY_DSN`
4. Redéployez l'app

**Dashboard Sentry :**
- Erreurs en temps réel
- Stack traces complètes
- Breadcrumbs des utilisateurs
- Alertes email/Slack

### 3️⃣ **Monitoring Supabase**

Dans **Supabase Dashboard > Reports** :

- Database size
- API requests
- Storage usage
- Active connections

**Alertes automatiques :**
- CPU > 80%
- Storage > 90%
- Connections > 90%

### 4️⃣ **Logs et debugging**

#### Vercel Logs :

```bash
# Voir les logs en temps réel
vercel logs

# Logs d'un déploiement spécifique
vercel logs --url=your-deployment-url.vercel.app
```

#### Supabase Logs :

Dans **Logs > API Logs**, filtrez par :
- Niveau (Error, Warning, Info)
- Endpoint
- Date/heure

---

## 🔄 ROLLBACK ET TROUBLESHOOTING

### Rollback rapide

Si le nouveau déploiement a des bugs :

1. Allez dans **Deployments**
2. Trouvez le dernier déploiement stable
3. Cliquez sur les **⋮** (trois points)
4. Cliquez sur **"Promote to Production"**

Le rollback est instantané ! ⚡

### Problèmes courants

#### ❌ **"VITE_SUPABASE_URL is required"**

**Solution :**
```bash
# Vérifier que les variables sont bien configurées
vercel env ls

# Si manquantes, les ajouter
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY

# Redéployer
vercel --prod
```

#### ❌ **"Failed to fetch" sur les API calls**

**Causes possibles :**
1. Supabase URL incorrecte
2. CORS mal configuré
3. RLS policies trop restrictives

**Solution :**
```bash
# Vérifier les variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_PUBLISHABLE_KEY

# Tester l'API Supabase directement
curl https://votre-project-id.supabase.co/rest/v1/
```

#### ❌ **Images ne se chargent pas**

**Causes possibles :**
1. Buckets Storage non créés
2. Policies Storage manquantes

**Solution :**
```sql
-- Dans Supabase SQL Editor
-- Vérifier les buckets
SELECT * FROM storage.buckets;

-- Vérifier les policies
SELECT * FROM storage.policies;
```

#### ❌ **Build échoue sur Vercel**

**Causes possibles :**
1. Dépendances manquantes
2. Type errors
3. Out of memory

**Solution :**
```bash
# Nettoyer le cache
vercel --force

# Augmenter la mémoire Node.js (dans vercel.json)
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max_old_space_size=4096"
    }
  }
}
```

#### ❌ **Traductions ne fonctionnent pas**

**Causes possibles :**
1. Fichiers JSON manquants
2. i18n mal configuré

**Solution :**
```bash
# Vérifier que tous les fichiers de traduction sont présents
ls src/i18n/locales/
# Doit afficher : fr.json, en.json, es.json, de.json, pt.json

# Vérifier le build
npm run build
# Les fichiers i18n doivent être dans dist/assets/
```

---

## 📞 SUPPORT

### Ressources utiles :

- **Vercel Docs** : https://vercel.com/docs
- **Supabase Docs** : https://supabase.com/docs
- **Vite Docs** : https://vitejs.dev
- **React i18n** : https://react.i18next.com

### Communauté :

- **Vercel Discord** : https://vercel.com/discord
- **Supabase Discord** : https://discord.supabase.com

---

## 🎉 FÉLICITATIONS !

Votre application **Payhuk** est maintenant en production avec :

✅ **5 langues** (FR, EN, ES, DE, PT)  
✅ **+2.81 milliards de personnes** peuvent utiliser l'app  
✅ **Performance optimisée** (< 3s de chargement)  
✅ **Sécurité renforcée** (Headers, CSP, RLS)  
✅ **SEO optimisé** (Sitemap, Schema.org)  
✅ **PWA ready** (Offline, Service Worker)  
✅ **Monitoring actif** (Sentry, Vercel Analytics)

**URL de production :** `https://payhuk.vercel.app` (ou votre domaine personnalisé)

---

**Dernière mise à jour :** 26 Octobre 2025  
**Version du guide :** 1.0.0  
**Statut :** ✅ Production Ready

---

## 📝 CHECKLIST FINALE

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Supabase configuré (DB, Storage, Edge Functions)
- [ ] Tests post-déploiement passés
- [ ] Performance > 90 (PageSpeed)
- [ ] Security Headers OK
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Monitoring activé (Vercel + Sentry)
- [ ] DNS propagés (si domaine personnalisé)
- [ ] HTTPS actif
- [ ] Sitemap.xml accessible
- [ ] Robots.txt accessible
- [ ] 5 langues fonctionnelles
- [ ] Email de confirmation reçu (test auth)
- [ ] Documentation lue et comprise

**Tout est coché ? Vous êtes prêt pour la production ! 🚀**

