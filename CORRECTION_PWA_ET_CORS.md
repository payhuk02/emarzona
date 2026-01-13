# ✅ CORRECTION PWA INSTALL PROMPT ET CORS RATE-LIMITER

**Date** : 31 Janvier 2025  
**Statut** : ✅ Corrigé  
**Version** : 1.0

---

## 🔍 PROBLÈMES IDENTIFIÉS

### 1. Warning PWA Install Prompt ⚠️

**Warning** : `Banner not shown: beforeinstallpromptevent.preventDefault() called. The page must call beforeinstallpromptevent.prompt() to show the banner.`

**Explication** : Ce warning est **normal** et **attendu**. Il indique que :

- Le navigateur a détecté que l'application peut être installée
- `preventDefault()` a été appelé pour empêcher le banner natif du navigateur
- Le prompt personnalisé sera affiché via `PWAInstallPrompt` quand l'utilisateur cliquera sur le bouton

**Ce n'est PAS une erreur** - c'est le comportement souhaité pour contrôler l'affichage du prompt.

### 2. Erreur CORS Rate-Limiter ❌

**Erreur** :

```
Access to fetch at 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/rate-limiter'
from origin 'https://api.emarzona.com' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
It does not have HTTP ok status.
```

**Cause** : L'Edge Function `rate-limiter` avait une gestion CORS basique qui ne gérait pas correctement :

- Les requêtes preflight (OPTIONS)
- Les origines dynamiques (production vs développement)
- Le statut HTTP correct pour les réponses OPTIONS

---

## 🔧 CORRECTIONS APPLIQUÉES

### 1. PWA Install Prompt - Explication ✅

**Fichier** : `src/hooks/usePWA.ts` et `src/components/mobile/PWAInstallPrompt.tsx`

**Comportement actuel** (correct) :

1. `beforeinstallprompt` est intercepté avec `preventDefault()` ✅
2. Le prompt est stocké dans `deferredPrompt` ✅
3. Le prompt personnalisé s'affiche via `PWAInstallPrompt` ✅
4. Quand l'utilisateur clique sur "Installer", `prompt()` est appelé ✅

**Le warning est normal** car :

- Le navigateur attend que `prompt()` soit appelé
- Mais on veut contrôler QUAND l'afficher (via notre UI personnalisée)
- Le warning disparaîtra quand l'utilisateur cliquera sur le bouton

**Aucune correction nécessaire** - c'est le comportement attendu.

---

### 2. Correction CORS Rate-Limiter ✅

**Fichier** : `supabase/functions/rate-limiter/index.ts`

**Problème** : Gestion CORS statique qui ne fonctionnait pas en production

**Solution** : Ajout d'une gestion CORS dynamique similaire à `moneroo` :

```typescript
/**
 * Fonction pour déterminer l'origine autorisée pour CORS
 */
function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin');
  const siteUrl = Deno.env.get('SITE_URL') || 'https://api.emarzona.com';

  // Autoriser localhost pour le développement
  if (
    origin &&
    (origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1'))
  ) {
    return origin;
  }

  // Autoriser le domaine de production
  if (origin === siteUrl || origin === `${siteUrl}/` || origin === 'https://api.emarzona.com') {
    return origin || siteUrl;
  }

  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

/**
 * Fonction pour créer les headers CORS dynamiques
 */
function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}
```

**Modifications dans `serve()`** :

```typescript
serve(async req => {
  // Créer les headers CORS dynamiques basés sur l'origine
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests avec statut 200 OK
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200, // ✅ Statut HTTP correct
      headers: corsHeaders,
    });
  }

  // ... reste du code
});
```

**Avantages** :

- ✅ Gestion CORS dynamique selon l'origine
- ✅ Support de localhost pour le développement
- ✅ Support du domaine de production
- ✅ Statut HTTP 200 OK pour les requêtes OPTIONS
- ✅ Headers CORS complets (Methods, Credentials, Max-Age)

---

## 🚀 REDÉPLOIEMENT REQUIS

### Edge Function rate-limiter

**⚠️ IMPORTANT** : L'Edge Function doit être redéployée sur Supabase pour que les corrections CORS prennent effet.

#### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Aller sur Supabase Dashboard** :
   - https://supabase.com/dashboard
   - Projet → Edge Functions → `rate-limiter`

2. **Copier le code mis à jour** :
   - Ouvrir `supabase/functions/rate-limiter/index.ts`
   - Copier tout le contenu (Ctrl+A, Ctrl+C)

3. **Coller dans l'éditeur Supabase** :
   - Coller le code dans l'éditeur
   - Cliquer sur **Deploy** (ou **Save**)

4. **Vérifier le déploiement** :
   - Attendre le message de succès
   - Vérifier les logs pour confirmer

#### Option 2 : Via Supabase CLI (Recommandé si CLI installé)

```bash
# Depuis la racine du projet
supabase functions deploy rate-limiter
```

**Ou utiliser le script de déploiement** :

```bash
# Rendre le script exécutable (Linux/Mac)
chmod +x scripts/deploy-rate-limiter.sh

# Exécuter le script
./scripts/deploy-rate-limiter.sh
```

**Sur Windows (PowerShell)** :

```powershell
# Exécuter directement avec bash (si Git Bash est installé)
bash scripts/deploy-rate-limiter.sh

# Ou utiliser Supabase CLI directement
supabase functions deploy rate-limiter
```

---

## 📝 NOTES TECHNIQUES

### PWA Install Prompt - Comportement Normal

Le warning `beforeinstallpromptevent.preventDefault() called` est **normal** et indique que :

1. **Le navigateur détecte** que l'application peut être installée
2. **On empêche** le banner natif avec `preventDefault()`
3. **On contrôle** quand afficher le prompt via notre UI personnalisée
4. **Le prompt sera appelé** quand l'utilisateur cliquera sur le bouton

**Ce n'est PAS une erreur** - c'est le comportement souhaité pour une meilleure UX.

### CORS dans Supabase Edge Functions

Les Edge Functions Supabase nécessitent :

1. **Gestion des requêtes OPTIONS** (preflight) :

   ```typescript
   if (req.method === 'OPTIONS') {
     return new Response(null, {
       status: 200,
       headers: corsHeaders,
     });
   }
   ```

2. **Headers CORS complets** :
   - `Access-Control-Allow-Origin` : Origine autorisée
   - `Access-Control-Allow-Methods` : Méthodes HTTP autorisées
   - `Access-Control-Allow-Headers` : Headers autorisés
   - `Access-Control-Allow-Credentials` : Autoriser les credentials
   - `Access-Control-Max-Age` : Durée de cache du preflight

3. **Origine dynamique** :
   - Détecter l'origine de la requête
   - Autoriser localhost pour le développement
   - Autoriser le domaine de production

---

## ✅ VALIDATION

### Checklist

- [x] PWA Install Prompt : Comportement vérifié (normal)
- [x] CORS rate-limiter : Gestion dynamique ajoutée
- [x] Headers CORS complets ajoutés
- [x] Statut HTTP 200 OK pour OPTIONS
- [ ] Edge Function redéployée sur Supabase
- [ ] Test de la fonction rate-limiter en production
- [ ] Vérification que l'erreur CORS est résolue

---

## 🔍 VÉRIFICATIONS

### Vérifier le CORS

1. **Tester la fonction rate-limiter** :

   ```bash
   curl -X OPTIONS https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/rate-limiter \
     -H "Origin: https://api.emarzona.com" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

2. **Vérifier les headers** :
   - `Access-Control-Allow-Origin` doit être `https://api.emarzona.com`
   - Statut HTTP doit être `200 OK`

### Vérifier le PWA

1. **Ouvrir** : `https://api.emarzona.com`
2. **Vérifier** : Le warning PWA est présent (normal)
3. **Vérifier** : Le banner d'installation s'affiche après 3 secondes
4. **Vérifier** : Cliquer sur "Installer" appelle `prompt()`

---

**Prochaine Étape** : Redéployer l'Edge Function rate-limiter sur Supabase
