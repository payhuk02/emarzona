# 🔥 GUIDE COMPLET - SENTRY ERROR TRACKING

**Date :** 27 octobre 2025  
**Version Sentry :** @sentry/react 8.x  
**Durée setup :** 30 minutes  
**Difficulté :** ⭐⭐ (Facile)

---

## 📋 SOMMAIRE

1. [Créer compte Sentry](#1-créer-compte-sentry)
2. [Installation packages](#2-installation-packages)
3. [Configuration DSN](#3-configuration-dsn)
4. [Configuration Vite (Source Maps)](#4-configuration-vite)
5. [Intégration avec Auth](#5-intégration-auth)
6. [Testing](#6-testing)
7. [Monitoring Production](#7-monitoring-production)

---

## 1. Créer compte Sentry

### Étape 1.1 : Inscription
👉 https://sentry.io/signup/

**Plan recommandé pour démarrer :** FREE
- ✅ 5,000 errors/mois
- ✅ 10,000 performance units
- ✅ 1 membre d'équipe
- ✅ 30 jours de rétention

### Étape 1.2 : Créer un projet
1. Cliquer "Create Project"
2. **Platform :** React
3. **Alert frequency :** Real-time
4. **Project name :** payhuk-frontend
5. Copier le **DSN** (Data Source Name)

Exemple DSN :
```
https://abc123def456ghi789jkl012mno345@o123456.ingest.sentry.io/7891011
```

⚠️ **IMPORTANT :** Garder ce DSN secret !

---

## 2. Installation packages

### Étape 2.1 : Installer SDK Sentry

```bash
# Les packages sont déjà installés dans Payhuk !
# Si besoin de réinstaller :
npm install @sentry/react @sentry/vite-plugin
```

### Étape 2.2 : Vérifier package.json

```json
{
  "dependencies": {
    "@sentry/react": "^8.0.0"
  },
  "devDependencies": {
    "@sentry/vite-plugin": "^2.0.0"
  }
}
```

✅ Déjà fait dans Payhuk !

---

## 3. Configuration DSN

### Étape 3.1 : Ajouter variable d'environnement

**Fichier :** `.env.local` (pour développement)

```env
# Sentry Configuration
VITE_SENTRY_DSN=https://abc123...@o123456.ingest.sentry.io/7891011
VITE_SENTRY_ORG=votre-org
VITE_SENTRY_PROJECT=payhuk-frontend
```

**Fichier :** Vercel Environment Variables (pour production)

```
VITE_SENTRY_DSN = https://abc123...@o123456.ingest.sentry.io/7891011
VITE_SENTRY_ORG = votre-org
VITE_SENTRY_PROJECT = payhuk-frontend
```

### Étape 3.2 : Auth Token (pour source maps)

1. Aller dans Sentry → Settings → Account → API → Auth Tokens
2. Créer un nouveau token :
   - **Name :** Payhuk CI/CD
   - **Scopes :**
     - `project:read`
     - `project:releases`
     - `org:read`
3. Copier le token
4. Ajouter dans `.env.local` :

```env
SENTRY_AUTH_TOKEN=sntrys_votre_token_secret_ici
```

5. Dans Vercel → Settings → Environment Variables :
```
SENTRY_AUTH_TOKEN = sntrys_votre_token_secret_ici
```

⚠️ **JAMAIS commit ce token dans Git !**

---

## 4. Configuration Vite

### Étape 4.1 : Modifier vite.config.ts

Le fichier est déjà configuré, mais voici la config complète :

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    
    // Sentry plugin pour source maps (seulement en production)
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Upload source maps
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules/**'],
      },
      
      // Configuration release
      release: {
        name: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
        deploy: {
          env: process.env.VERCEL_ENV || 'development',
        },
      },
      
      // Options avancées
      telemetry: false,
      silent: false,
    }),
  ].filter(Boolean),
  
  build: {
    // Activer source maps en production
    sourcemap: true,
    
    // Rollup options
    rollupOptions: {
      output: {
        // Optimiser le nom des chunks pour Sentry
        manualChunks: {
          'sentry': ['@sentry/react'],
        },
      },
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Étape 4.2 : Configurer .gitignore

Vérifier que `.env.local` et le token Sentry sont ignorés :

```gitignore
# Environment variables
.env.local
.env.*.local

# Sentry
.sentryclirc
sentry.properties

# Source maps (ne pas commit en production)
dist/**/*.map
```

---

## 5. Intégration avec Auth

### Étape 5.1 : Tracker l'utilisateur connecté

Le code est déjà dans `src/contexts/AuthContext.tsx`, mais voici l'essentiel :

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// Lors du login
useEffect(() => {
  if (user) {
    setSentryUser({
      id: user.id,
      email: user.email,
      username: user.user_metadata?.name || user.email?.split('@')[0],
    });
  } else {
    clearSentryUser();
  }
}, [user]);
```

✅ Déjà implémenté dans Payhuk !

### Étape 5.2 : Ajouter contexte métier

Exemple dans un cours :

```typescript
import { addBreadcrumb } from '@/lib/sentry';

// Lors de l'enrollment
addBreadcrumb('User enrolled in course', 'course', 'info');

// Lors d'une erreur de paiement
captureError(error, {
  course_id: courseId,
  price: course.price,
  payment_method: 'moneroo',
});
```

---

## 6. Testing

### Étape 6.1 : Test en développement

Créer une erreur volontaire :

```typescript
// Ajouter temporairement dans un composant
<button onClick={() => {
  throw new Error('Test Sentry Error!');
}}>
  Test Sentry
</button>
```

Ou via console :

```javascript
window.Sentry.captureException(new Error('Test from console'));
```

### Étape 6.2 : Vérifier dans Sentry

1. Aller sur https://sentry.io
2. Sélectionner projet "payhuk-frontend"
3. **Issues** → Voir l'erreur capturée
4. Vérifier :
   - ✅ Stack trace complet
   - ✅ User context
   - ✅ Breadcrumbs
   - ✅ Device info

### Étape 6.3 : Test performance

```typescript
import { measurePerformance } from '@/lib/sentry';

const fetchCourses = async () => {
  return measurePerformance('fetch-courses', async () => {
    const response = await fetch('/api/courses');
    return response.json();
  }, {
    category: 'api',
  });
};
```

---

## 7. Monitoring Production

### Étape 7.1 : Alertes

Configurer les alertes dans Sentry :

1. **Settings → Alerts → New Alert Rule**
2. **Conditions :**
   - `When` : An event is seen
   - `If` : Issue is first seen OR more than 10 times in 1 hour
3. **Actions :**
   - Send notification to : Email (vous)
   - Send notification to : Slack (optionnel)

### Étape 7.2 : Dashboard personnalisé

Créer un dashboard pour surveiller :

**Métriques clés :**
- Total errors (last 24h)
- Error rate (%)
- Most common errors
- Affected users
- Browser breakdown
- Performance metrics

### Étape 7.3 : Releases

Lier les erreurs aux releases :

```bash
# Lors du déploiement Vercel (automatique avec plugin)
# La version sera : VERCEL_GIT_COMMIT_SHA

# Pour voir les erreurs par version :
# Sentry → Releases → Sélectionner une version
```

### Étape 7.4 : Source Maps vérification

Après déploiement, vérifier que les source maps fonctionnent :

1. Provoquer une erreur en production
2. Aller dans Sentry → Issues
3. Vérifier que le stack trace montre :
   - ✅ Nom fichier source (pas minifié)
   - ✅ Numéros de ligne corrects
   - ✅ Code source visible

---

## 🎯 CHECKLIST FINALE

### Setup Initial
- [ ] Compte Sentry créé
- [ ] Projet créé
- [ ] DSN copié
- [ ] Variables env configurées (local + Vercel)
- [ ] Auth token créé

### Configuration Code
- [ ] `vite.config.ts` configuré
- [ ] Source maps activés
- [ ] `.gitignore` à jour
- [ ] Sentry initialisé dans App
- [ ] User context intégré

### Testing
- [ ] Test erreur en dev (fonctionne)
- [ ] Test erreur en prod (stack trace correct)
- [ ] Performance tracking (fonctionne)
- [ ] Breadcrumbs (enregistrés)

### Production
- [ ] Alertes configurées
- [ ] Dashboard créé
- [ ] Team invitée (optionnel)
- [ ] Source maps uploadés

---

## 📊 EXEMPLES D'UTILISATION

### Exemple 1 : Capturer erreur API

```typescript
import { withSentry } from '@/lib/sentry';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => withSentry('fetch-courses', async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) throw error;
      return data;
    }, {
      user_id: user?.id,
      timestamp: Date.now(),
    }),
  });
};
```

### Exemple 2 : Mesurer performance

```typescript
import { measurePerformance } from '@/lib/sentry';

const processVideoUpload = async (file: File) => {
  return measurePerformance('video-upload', async () => {
    // Upload logic
    const url = await uploadToSupabase(file);
    return url;
  }, {
    file_size: file.size,
    file_type: file.type,
  });
};
```

### Exemple 3 : Breadcrumbs personnalisés

```typescript
import { addBreadcrumb } from '@/lib/sentry';

// Tracking du parcours utilisateur
const handleCheckout = () => {
  addBreadcrumb('User initiated checkout', 'payment', 'info');
  
  // ...checkout logic
  
  addBreadcrumb('Payment processed successfully', 'payment', 'info');
};
```

---

## 🚨 TROUBLESHOOTING

### Problème : Source maps ne s'uploadent pas

**Solution :**
```bash
# Vérifier que le token est correct
echo $SENTRY_AUTH_TOKEN

# Build en verbose pour voir les logs
npm run build -- --mode production

# Vérifier manuellement l'upload
npx @sentry/cli releases files <VERSION> upload-sourcemaps ./dist
```

### Problème : Trop d'erreurs (quota dépassé)

**Solution :**
```typescript
// Dans src/lib/sentry.ts, ajuster le sampling
tracesSampleRate: 0.1, // 10% au lieu de 100%
replaysSessionSampleRate: 0.05, // 5%
```

### Problème : Erreurs non capturées

**Solution :**
```typescript
// Ajouter error boundary manuellement
import * as Sentry from '@sentry/react';

<Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
  <YourComponent />
</Sentry.ErrorBoundary>
```

---

## 📞 RESSOURCES

- **Documentation officielle :** https://docs.sentry.io/platforms/javascript/guides/react/
- **Vite Plugin :** https://github.com/getsentry/sentry-javascript-bundler-plugins
- **Status Sentry :** https://status.sentry.io/
- **Support :** support@sentry.io

---

## 🎉 FÉLICITATIONS !

Sentry est maintenant configuré pour Payhuk !

**Avantages immédiats :**
- ✅ Visibilité complète sur les erreurs production
- ✅ Stack traces détaillés
- ✅ Alertes temps réel
- ✅ Performance monitoring
- ✅ Session replay (débug facile)

**Next step :** Déployer et surveiller ! 🚀

