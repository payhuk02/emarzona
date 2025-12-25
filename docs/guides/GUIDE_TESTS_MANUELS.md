# 🧪 GUIDE DE TESTS MANUELS - PAYHUK

**Date :** 26 Octobre 2025  
**Application :** http://localhost:8084 (ou 8081, 8082, 8083)

---

## 🌍 TEST 1 : INTERNATIONALISATION (i18n)

### Objectif
Vérifier que le système de changement de langue fonctionne correctement.

### Prérequis
- Application lancée : `npm run dev`
- Navigateur ouvert sur http://localhost:8084

### Étapes de test

#### 1.1 - Localiser le Language Switcher

**Où chercher :**
- Coin haut-droit de l'écran
- Dans la barre de navigation (header)
- Chercher un bouton avec un flag 🇫🇷 ou 🇬🇧
- Ou un bouton avec une icône globe 🌐

**Ce que tu dois voir :**
```
✅ Bouton avec flag ou icône globe
✅ Texte "FR" ou "Français" (langue actuelle)
✅ Bouton cliquable
```

**Si tu ne le vois pas :**
Le LanguageSwitcher n'a peut-être pas été ajouté au layout principal. C'est normal, il faut l'ajouter manuellement.

---

#### 1.2 - Tester le changement de langue

**Action :**
1. Cliquer sur le Language Switcher
2. Sélectionner "English" (🇬🇧)

**Ce que tu dois observer :**
```
✅ Un dropdown s'ouvre avec les langues disponibles
✅ "Français" a une coche ✓ (langue actuelle)
✅ "English" est aussi visible
```

**Après avoir cliqué sur "English" :**
```
✅ Les textes de la page changent immédiatement
✅ "Connexion" devient "Login"
✅ "Inscription" devient "Sign up"
✅ "Marketplace" reste "Marketplace" (identique)
✅ "Rechercher" devient "Search"
```

---

#### 1.3 - Vérifier la persistance

**Action :**
1. Changer la langue en "English"
2. Rafraîchir la page (F5)

**Ce que tu dois observer :**
```
✅ La langue reste en "English" après le refresh
✅ Pas de retour au Français
✅ LocalStorage a sauvegardé la préférence
```

**Vérifier dans DevTools :**
```javascript
// Ouvrir Console (F12)
localStorage.getItem('payhuk_language')
// Devrait afficher : "en"
```

---

#### 1.4 - Tester le formatage

**Où vérifier :**
- Prix des produits
- Dates
- Nombres

**Ce que tu dois observer :**

**En Français :**
```
Prix : 25 000 FCFA
Date : 26 octobre 2025
Nombre : 1 234 567
```

**En English :**
```
Price : FCFA 25,000
Date : October 26, 2025
Number : 1,234,567
```

---

### Résultat attendu ✅

- [ ] Language Switcher visible et accessible
- [ ] Changement de langue instantané
- [ ] Langue persiste après refresh
- [ ] Formatage adapté à la langue (dates, nombres, devises)
- [ ] Pas d'erreur dans la console

---

## 📱 TEST 2 : SERVICE WORKER & MODE OFFLINE

### Objectif
Vérifier que le Service Worker fonctionne et que le mode offline est opérationnel.

### Prérequis
- Application lancée
- Navigateur Chrome/Edge (meilleur support PWA)

### Étapes de test

#### 2.1 - Vérifier l'enregistrement du Service Worker

**Action :**
1. Ouvrir DevTools (F12)
2. Onglet "Application" (ou "Applications")
3. Menu gauche : "Service Workers"

**Ce que tu dois voir :**
```
✅ Source: sw.js
✅ Status: activated and is running
✅ Scope: http://localhost:8084/
✅ Boutons : Update, Unregister
```

**Si le Service Worker n'est pas activé :**
```javascript
// Dans la console, forcer l'enregistrement
navigator.serviceWorker.register('/sw.js')
  .then(() => location.reload())
```

---

#### 2.2 - Vérifier les caches

**Dans DevTools > Application :**
1. Menu gauche : "Cache" > "Cache Storage"
2. Développer le dossier

**Ce que tu dois voir :**
```
✅ payhuk-v1.0.0-static (assets statiques)
✅ payhuk-v1.0.0-dynamic (pages)
✅ payhuk-v1.0.0-images (images)
✅ payhuk-v1.0.0-api (API calls)
```

**Cliquer sur chaque cache pour voir son contenu**

---

#### 2.3 - Tester le mode offline

**Action :**
1. Onglet "Network" dans DevTools
2. Cocher la case "Offline" (en haut)
3. Rafraîchir la page (F5 ou Ctrl+R)

**Ce que tu dois voir :**
```
✅ Page offline élégante s'affiche
✅ Design moderne (fond gradient violet)
✅ Icône 📡
✅ Message : "Vous êtes hors ligne"
✅ Bouton "Réessayer"
✅ Message rassurant sur la sauvegarde locale
```

**Apparence attendue :**
- Fond dégradé violet/bleu
- Carte blanche centrée
- Icône ronde avec emoji 📡
- Titre clair
- Message informatif
- Bouton stylisé

---

#### 2.4 - Tester le retour en ligne

**Action :**
1. Toujours en mode offline
2. Décocher "Offline" dans Network tab

**Ce que tu dois observer :**
```
✅ La page se recharge automatiquement
✅ Retour à l'application normale
✅ Message toast "Connexion rétablie" (si hooks activés)
```

---

#### 2.5 - Tester la stratégie de cache

**Action :**
1. Naviguer sur plusieurs pages (Marketplace, Dashboard, etc.)
2. Revenir sur la page d'accueil
3. Onglet Network : observer les requêtes

**Ce que tu dois voir :**
```
✅ Requêtes marquées "(from ServiceWorker)"
✅ Temps de réponse très rapide (< 50ms)
✅ Pas de requêtes réseau pour les assets déjà visités
```

---

### Résultat attendu ✅

- [ ] Service Worker activé et fonctionnel
- [ ] 4 caches créés (static, dynamic, images, api)
- [ ] Mode offline affiche page élégante
- [ ] Retour online automatique
- [ ] Cache accélère la navigation

---

## ⚡ TEST 3 : PREFETCHING INTELLIGENT

### Objectif
Vérifier que le prefetching des liens fonctionne au survol.

### Prérequis
- Application lancée
- DevTools > Network ouvert

### Étapes de test

#### 3.1 - Observer le prefetch au survol

**Action :**
1. Ouvrir DevTools > Network
2. Effacer les requêtes (🚫 Clear)
3. **Sans cliquer**, survoler un lien (ex: "Marketplace")
4. Observer le Network tab

**Ce que tu dois voir :**
```
✅ Une nouvelle requête apparaît
✅ Type: "prefetch" ou "link"
✅ URL: /marketplace (ou autre)
✅ Status: 200
✅ Size: quelques KB
```

**Exemple :**
```
Name              Type      Size    Time
marketplace       prefetch  45 KB   120ms
```

---

#### 3.2 - Vérifier la navigation instantanée

**Action :**
1. Après avoir survolé le lien (prefetch effectué)
2. Cliquer sur le lien
3. Observer le temps de chargement

**Ce que tu dois observer :**
```
✅ Navigation quasi-instantanée (< 100ms)
✅ Pas de requête réseau (déjà en cache)
✅ Page s'affiche immédiatement
```

---

#### 3.3 - Tester le smart prefetch (connexion)

**Dans DevTools > Network :**
1. Throttling: Sélectionner "Slow 3G"
2. Survoler des liens

**Ce que tu dois observer :**
```
✅ Moins de prefetching automatique
✅ Le système détecte la connexion lente
✅ Économise la bande passante
```

**Remettre en "No throttling" pour continuer**

---

### Résultat attendu ✅

- [ ] Prefetch au survol des liens
- [ ] Navigation instantanée après prefetch
- [ ] Adaptation selon la qualité de connexion
- [ ] Pas de surcharge réseau

---

## 🚀 TEST 4 : PERFORMANCE (LIGHTHOUSE)

### Objectif
Vérifier les scores de performance de l'application.

### Prérequis
- Build production : `npm run build`
- Servir le build : `npm run preview`

### Étapes de test

#### 4.1 - Lancer Lighthouse

**Action :**
1. Ouvrir DevTools (F12)
2. Onglet "Lighthouse"
3. Options :
   - Mode : Navigation
   - Device : Desktop
   - Categories : ✓ Performance, ✓ Accessibility, ✓ Best Practices, ✓ SEO
4. Cliquer "Analyze page load"

**Attendre l'analyse (30-60 secondes)**

---

#### 4.2 - Vérifier les scores

**Scores attendus (Build production) :**

```
Performance      : 90-100  ✅ (Excellent)
Accessibility    : 90-100  ✅ (Excellent)
Best Practices   : 90-100  ✅ (Excellent)
SEO              : 90-100  ✅ (Excellent)
```

**Si score < 90 :**
- Vérifier les recommandations Lighthouse
- Identifier les assets lents
- Vérifier les images non optimisées

---

#### 4.3 - Analyser les Web Vitals

**Dans le rapport Lighthouse, vérifier :**

```
LCP (Largest Contentful Paint)
✅ Bon : < 2.5s
⚠️ À améliorer : 2.5s - 4s
❌ Mauvais : > 4s

FID (First Input Delay)
✅ Bon : < 100ms
⚠️ À améliorer : 100ms - 300ms
❌ Mauvais : > 300ms

CLS (Cumulative Layout Shift)
✅ Bon : < 0.1
⚠️ À améliorer : 0.1 - 0.25
❌ Mauvais : > 0.25
```

---

#### 4.4 - Vérifier le bundle size

**Dans DevTools > Network :**
1. Rafraîchir la page (Ctrl+Shift+R pour vider le cache)
2. Filtrer : "JS"
3. Observer la colonne "Size"

**Ce que tu dois voir :**
```
✅ vendor-react.js : ~52 KB (gzipped)
✅ vendor-ui.js : ~35 KB (gzipped)
✅ index.js : ~43 KB (gzipped)
✅ Total initial : < 200 KB (gzipped)
```

---

### Résultat attendu ✅

- [ ] Performance score > 90
- [ ] Accessibility score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle initial < 200 KB (gzipped)

---

## 📊 TEST 5 : ANALYSE DU BUNDLE

### Objectif
Visualiser la composition du bundle et identifier les optimisations.

### Prérequis
- Build effectué : `npm run build`
- Fichier généré : `dist/stats.html`

### Étapes de test

#### 5.1 - Ouvrir le visualiseur

**Action :**
1. Naviguer vers le dossier `dist/`
2. Ouvrir `stats.html` dans le navigateur
   - Ou : `file:///C:/Users/SAWADOGO/Desktop/payhula/dist/stats.html`

**Ce que tu dois voir :**
```
✅ Treemap interactif coloré
✅ Chaque rectangle = un fichier
✅ Taille proportionnelle à la taille du fichier
✅ Légende avec les couleurs
```

---

#### 5.2 - Explorer les chunks

**Survoler les rectangles pour voir :**
- Nom du fichier
- Taille originale
- Taille gzippée
- Taille Brotli
- % du bundle total

**Chunks principaux à identifier :**
```
✅ vendor-react (React, React-DOM, React-Router)
✅ vendor-ui (Radix UI components)
✅ vendor-query (TanStack Query)
✅ vendor-supabase (Supabase SDK)
✅ vendor-i18n (i18next)
✅ charts (Recharts - si utilisé)
✅ index (code application)
```

---

#### 5.3 - Vérifier les optimisations

**Dans le visualiseur, vérifier :**

1. **Pas de duplication :**
   - Chaque librairie n'apparaît qu'une fois
   - Pas de code dupliqué

2. **Chunks séparés :**
   - React séparé des autres vendors
   - UI components dans un chunk dédié
   - Charts lazy-loadé

3. **Tailles raisonnables :**
   - Aucun chunk > 500 KB (non gzippé)
   - Bundle principal < 150 KB (non gzippé)

---

### Résultat attendu ✅

- [ ] Visualisation treemap fonctionnelle
- [ ] 7 chunks identifiés (vendors + app)
- [ ] Pas de duplication de code
- [ ] Tailles optimisées (< 150 KB par chunk)

---

## ✅ RÉSUMÉ DES TESTS

### Tests effectués

| Test | Statut | Score |
|------|--------|-------|
| **i18n** | ⬜ À tester | - |
| **Service Worker** | ⬜ À tester | - |
| **Mode Offline** | ⬜ À tester | - |
| **Prefetching** | ⬜ À tester | - |
| **Performance** | ⬜ À tester | - |
| **Bundle Analysis** | ⬜ À tester | - |

### Remplir après les tests

**i18n :**
- [ ] Language Switcher visible
- [ ] Changement FR ↔ EN fonctionne
- [ ] Persistance après refresh
- [ ] Formatage correct

**PWA :**
- [ ] Service Worker activé
- [ ] Caches créés
- [ ] Mode offline fonctionnel
- [ ] Auto-reload au retour online

**Performance :**
- [ ] Lighthouse Score > 90
- [ ] LCP < 2.5s
- [ ] Bundle < 200 KB (gzipped)

**Optimisations :**
- [ ] Prefetch au hover
- [ ] Navigation instantanée
- [ ] Chunks séparés
- [ ] Compression active

---

## 🐛 PROBLÈMES COURANTS

### Si le Language Switcher n'apparaît pas

**Cause :** Le composant n'a pas été ajouté au layout.

**Solution :**
Il faut ajouter le `LanguageSwitcher` dans le header/navbar de l'application.

**Où l'ajouter :** 
Dans `src/components/layout/Header.tsx` ou similaire

```typescript
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

// Dans le JSX du header :
<LanguageSwitcher variant="outline" showLabel={true} />
```

---

### Si le Service Worker ne s'active pas

**Vérifier :**
1. Le fichier `public/sw.js` existe
2. L'URL est correcte : http://localhost:8084/sw.js
3. Le navigateur supporte les Service Workers
4. Pas en mode "incognito" (peut bloquer les SW)

**Forcer l'activation :**
```javascript
// Console DevTools
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('SW registered:', reg))
  .catch(err => console.error('SW error:', err));
```

---

### Si le prefetch ne fonctionne pas

**Vérifier :**
1. La fonction `setupAutoPrefetch()` est appelée
2. Le navigateur supporte `IntersectionObserver`
3. Les liens ont des attributs `href` valides
4. Pas en mode "Save Data" (économie de données)

---

### Si Lighthouse donne un score faible

**Causes possibles :**
- Mode développement (utiliser build production)
- Extensions navigateur actives
- Cache désactivé
- Throttling réseau activé

**Solution :**
1. `npm run build`
2. `npm run preview`
3. Tester sur le build production
4. Désactiver les extensions
5. Mode incognito

---

## 📞 AIDE

Si tu rencontres des problèmes :
1. Vérifier la console (F12) pour les erreurs
2. Vérifier le Network tab pour les requêtes échouées
3. Consulter les rapports de vérification
4. Me dire quel test pose problème

**Bon courage pour les tests ! 🚀**


