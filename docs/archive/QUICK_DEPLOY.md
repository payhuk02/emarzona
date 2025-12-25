# ⚡ DÉPLOIEMENT RAPIDE - PAYHUK

**Guide express pour déployer en production en 5 minutes** ⏱️

---

## 🚀 OPTION 1 : VERCEL VIA GITHUB (RECOMMANDÉ)

### Étape 1 : GitHub (1 minute)

```bash
git add .
git commit -m "feat: ready for production"
git push origin main
```

### Étape 2 : Vercel (3 minutes)

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer **"New Project"**
3. Sélectionner votre repo **payhuk**
4. Configurer :
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Environment Variables** :
   ```
   VITE_SUPABASE_URL = https://votre-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = eyJ...
   ```

6. Cliquer **"Deploy"** 🚀

### Étape 3 : Supabase (1 minute)

1. Aller sur [supabase.com](https://supabase.com)
2. **New Project** → Nom: Payhuk, Region: Europe West
3. **Settings > API** → Copier URL et anon key
4. Les coller dans Vercel (étape 2.5)

**✅ FAIT ! Votre app est en ligne !**

---

## ⚡ OPTION 2 : VERCEL CLI (2 MINUTES)

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# Suivre les prompts :
# - Setup and deploy? Y
# - Which scope? Votre compte
# - Link to existing project? N
# - Project name? payhuk
# - Directory? ./
# - Override settings? N

# 4. Ajouter les variables d'environnement
vercel env add VITE_SUPABASE_URL
# Coller la valeur : https://votre-project.supabase.co
# Environnements : Production, Preview, Development

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Coller la clé anon

# 5. Redéployer en production
vercel --prod
```

**✅ URL de production** : `https://payhuk-xyz.vercel.app`

---

## 🧪 OPTION 3 : TEST LOCAL (30 SECONDES)

```bash
# Build
npm run build

# Preview
npm run preview

# Ouvrir http://localhost:4173
```

**Tester :**
- ✅ Changement de langue (5 langues)
- ✅ Navigation
- ✅ Thème clair/sombre
- ✅ Responsive

---

## 🔑 VARIABLES D'ENVIRONNEMENT

Vous avez besoin de **2 variables** de Supabase :

### Où les trouver ?

1. Aller sur [supabase.com](https://supabase.com)
2. Sélectionner votre projet
3. **Settings > API**
4. Copier :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Ajouter dans Vercel (Web UI) :

1. **Project Settings** > **Environment Variables**
2. Cliquer **"Add"**
3. Name : `VITE_SUPABASE_URL`
4. Value : `https://votre-project.supabase.co`
5. Environments : ✅ Production, ✅ Preview, ✅ Development
6. **Save**
7. Répéter pour `VITE_SUPABASE_PUBLISHABLE_KEY`

### Ajouter dans Vercel (CLI) :

```bash
vercel env add VITE_SUPABASE_URL
# Coller la valeur et Entrée
# Sélectionner : Production, Preview, Development

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Répéter
```

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT (2 MINUTES)

### 1. App fonctionne :

```
https://votre-projet.vercel.app
```

- [ ] Page se charge
- [ ] Pas d'erreurs console
- [ ] Images se chargent

### 2. Langues fonctionnent :

- [ ] Cliquer sur 🌐 en haut à droite
- [ ] Changer de langue
- [ ] Vérifier que le texte change

### 3. Authentification fonctionne :

- [ ] Cliquer "S'inscrire"
- [ ] Créer un compte
- [ ] Vérifier l'email
- [ ] Se connecter

### 4. Performance :

```
https://pagespeed.web.dev/?url=https://votre-projet.vercel.app
```

**Objectif :** > 90 sur Performance

---

## 🐛 DÉPANNAGE RAPIDE

### ❌ "VITE_SUPABASE_URL is required"

```bash
# Variables manquantes
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel --prod
```

### ❌ "Failed to fetch"

- Vérifier que Supabase est bien configuré
- Vérifier l'URL Supabase (doit finir par `.supabase.co`)

### ❌ Build échoue

```bash
# Nettoyer et rebuild
npm run build

# Si ça marche localement, forcer le redéploiement
vercel --force --prod
```

### ❌ Langues ne fonctionnent pas

```bash
# Vérifier que les fichiers i18n sont présents
npm run verify:i18n

# Résultat attendu : 37/37 tests passés
```

---

## 📊 APRÈS LE DÉPLOIEMENT

### Domaine personnalisé (optionnel) :

1. **Vercel** > **Project Settings** > **Domains**
2. Cliquer **"Add"**
3. Entrer : `payhuk.com`
4. Configurer les DNS selon les instructions

### Monitoring (optionnel) :

- **Vercel Analytics** : Auto-activé ✅
- **Sentry** : Ajouter `VITE_SENTRY_DSN`

### SEO (vérifier) :

- [ ] `https://votre-projet.vercel.app/robots.txt` accessible
- [ ] `https://votre-projet.vercel.app/sitemap.xml` accessible

---

## 🎯 COMMANDES UTILES

```bash
# Voir les déploiements
vercel ls

# Voir les logs
vercel logs

# Voir les variables d'environnement
vercel env ls

# Supprimer un déploiement
vercel rm <deployment-url>

# Ouvrir le dashboard Vercel
vercel open

# Rollback vers un déploiement précédent
# (Depuis le dashboard, cliquer sur le déploiement puis "Promote to Production")
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour un guide détaillé, voir :
- **`DEPLOYMENT_GUIDE.md`** (guide complet 39 pages)
- **`PRODUCTION_DEPLOYMENT_SUMMARY.md`** (résumé)

---

## ⏱️ TEMPS ESTIMÉ

| Étape | Temps |
|-------|-------|
| Créer projet Supabase | 2 min |
| Pousser code GitHub | 30 sec |
| Configurer Vercel | 2 min |
| Premier déploiement | 2-3 min |
| Vérifications | 2 min |
| **TOTAL** | **~10 minutes** |

---

## 🎉 C'EST TOUT !

Votre application **Payhuk** est maintenant **EN LIGNE** avec :

✅ **5 langues** (FR, EN, ES, DE, PT)  
✅ **HTTPS automatique**  
✅ **CDN mondial** (Vercel Edge Network)  
✅ **Build optimisé** (62 kB compressé)  
✅ **Performance maximale** (< 3s de chargement)

**URL de production :** `https://votre-projet.vercel.app`

---

**Besoin d'aide ?** Consultez `DEPLOYMENT_GUIDE.md` 📖

🚀 **Bon déploiement !**

