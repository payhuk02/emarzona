# 🚀 DÉPLOIEMENT RAPIDE - PAYHUK

**Guide ultra-simplifié** pour déployer en 30 minutes

---

## ⚡ DÉMARRAGE RAPIDE

### 1️⃣ Vérification (2 min)

```bash
# Exécuter le script de vérification
node scripts/pre-deploy-check.js

# Tester le build local
npm run build
npm run preview
```

### 2️⃣ Push vers GitHub (3 min)

```bash
# Si ce n'est pas déjà fait
git add .
git commit -m "feat: Production ready - v1.0"
git push origin main
```

### 3️⃣ Déploiement Vercel (10 min)

#### A. Créer compte Vercel
1. Aller sur https://vercel.com/signup
2. Se connecter avec GitHub
3. ✅ Compte créé !

#### B. Import projet
1. Cliquer **"Add New..."** → **"Project"**
2. **Import Git Repository**
   - Sélectionner `payhuk`
   - Cliquer **"Import"**

#### C. Configuration build
```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### D. Variables d'environnement

Cliquer **"Environment Variables"** et ajouter :

```plaintext
VITE_SUPABASE_URL
Valeur: https://VOTRE_ID.supabase.co

VITE_SUPABASE_ANON_KEY
Valeur: eyJhbGci...VOTRE_CLE

VITE_APP_NAME
Valeur: Payhuk

VITE_APP_ENV
Valeur: production
```

**Où trouver ces valeurs ?**
- Supabase Dashboard → Settings → API
- Copier "Project URL" et "anon/public key"

#### E. Deploy
1. Cliquer **"Deploy"**
2. ☕ Attendre 2-3 minutes
3. ✅ **Déployé !**

**URL temporaire :** `https://payhuk-xxx.vercel.app`

### 4️⃣ Configuration Supabase (5 min)

1. **Aller dans Supabase Dashboard**
2. **Authentication → URL Configuration**
   
   ```
   Site URL: https://payhuk-xxx.vercel.app
   
   Redirect URLs:
   https://payhuk-xxx.vercel.app
   https://payhuk-xxx.vercel.app/auth/callback
   https://payhuk-xxx.vercel.app/**
   ```

3. **API Settings → CORS**
   
   Ajouter :
   ```
   https://payhuk-xxx.vercel.app
   ```

4. **Save changes**

### 5️⃣ Premier test (5 min)

1. **Ouvrir l'app**
   ```
   https://payhuk-xxx.vercel.app
   ```

2. **Tester inscription**
   - Créer un compte
   - Vérifier email reçu
   - Login

3. **Tester création cours**
   - Dashboard → Courses → New
   - Remplir formulaire
   - Upload vidéo
   - Publier

4. **✅ Tout fonctionne !**

---

## 🌐 DOMAINE PERSONNALISÉ (Optionnel - 15 min)

### A. Acheter un domaine

Recommandations :
- **Namecheap** : ~$10/an
- **GoDaddy** : ~$15/an
- **OVH** : ~$10/an

Suggestion : `payhuk.com`, `monpayhuk.com`, `learn-payhuk.com`

### B. Configurer DNS

1. **Dans Vercel**
   - Settings → Domains
   - Add Domain : `payhuk.com`
   - Copier les valeurs DNS affichées

2. **Chez votre registrar**
   
   Ajouter ces enregistrements :
   ```
   Type    Name    Value                   TTL
   A       @       76.76.21.21             3600
   CNAME   www     cname.vercel-dns.com    3600
   ```

3. **Attendre propagation** (5 min - 48h)

### C. Mettre à jour Supabase

```
Site URL: https://payhuk.com

Redirect URLs:
https://payhuk.com
https://payhuk.com/auth/callback
https://payhuk.com/**
```

---

## 🧪 CHECKLIST POST-DÉPLOIEMENT

```
✅ App accessible publiquement
✅ Signup/Login fonctionne
✅ Email confirmation reçu
✅ Dashboard s'affiche
✅ Création cours fonctionne
✅ Upload vidéo fonctionne
✅ Notifications temps réel OK
✅ HTTPS actif (cadenas vert)
✅ Responsive mobile/tablet
✅ Performance OK (< 3s)
```

---

## 📊 MONITORING GRATUIT

### Vercel Analytics (Gratuit)

Automatiquement activé :
- Page views
- Performance metrics
- Device stats

### UptimeRobot (Gratuit)

1. Créer compte : https://uptimerobot.com
2. **Add New Monitor**
   ```
   Monitor Type: HTTPS
   URL: https://payhuk.com
   Interval: 5 minutes
   ```
3. ✅ Recevoir alerts si down

### Google Search Console (Gratuit)

1. https://search.google.com/search-console
2. **Add Property** : `https://payhuk.com`
3. Vérifier avec meta tag
4. Submit sitemap : `/sitemap.xml`

---

## 🚨 PROBLÈMES COURANTS

### ❌ Build failed

**Solution :**
```bash
# Vérifier en local
npm install
npm run build

# Si ça marche localement :
# Vercel → Settings → General → Node.js Version
# Changer pour Node.js 18.x
```

### ❌ Variables d'environnement non chargées

**Solution :**
```bash
# Vercel → Settings → Environment Variables
# Vérifier que toutes les variables sont là
# Cocher "Production" ET "Preview"
# Redeploy : Deployments → ... → Redeploy
```

### ❌ Supabase CORS Error

**Solution :**
```bash
# Supabase → Settings → API → CORS Allowed Origins
# Ajouter votre domaine Vercel
# Format : https://payhuk-xxx.vercel.app (sans / à la fin)
```

### ❌ Auth redirect pas bon

**Solution :**
```bash
# Supabase → Authentication → URL Configuration
# Site URL doit être EXACTEMENT votre URL Vercel
# Redirect URLs : ajouter /auth/callback
```

### ❌ Page blanche après déploiement

**Solution :**
```bash
# Vérifier Console Browser (F12)
# Souvent : 
# 1. Vérifier vercel.json (rewrites pour SPA)
# 2. Vérifier base dans vite.config.ts
# 3. Hard refresh : Ctrl+Shift+R
```

---

## 🎯 PROCHAINES ÉTAPES

### Contenu
1. **Créer 3-5 cours de démo**
2. **Ajouter images/bannières**
3. **Remplir page À propos**

### Marketing
1. **Annoncer sur réseaux sociaux**
2. **Email liste d'attente**
3. **Blog post launch**

### Optimisation
1. **Google Analytics configuré**
2. **SEO meta tags tous remplis**
3. **Sitemap généré**

### Légal
1. **CGU / CGV**
2. **Politique de confidentialité**
3. **Mentions légales**

---

## 🏆 FÉLICITATIONS !

**Payhuk est maintenant en ligne !** 🎉

```
🌐 Production: https://payhuk.com
📊 Dashboard Vercel: https://vercel.com/dashboard
🗄️ Database: https://supabase.com/dashboard
```

**Bon lancement !** 🚀

