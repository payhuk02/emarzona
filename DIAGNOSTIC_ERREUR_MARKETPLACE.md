# 🔍 DIAGNOSTIC ERREUR MARKETPLACE

**Date** : 31 Janvier 2025  
**Problème** : Page Marketplace affiche "Oops ! Une erreur est survenue" avec console vide

---

## 📊 ÉTAT ACTUEL

- **URL** : `api.emarzona.com/marketplace`
- **Erreur affichée** : "Oops ! Une erreur est survenue" (ErrorFallbackComponent)
- **Console** : Vide (pas d'erreurs JavaScript visibles)
- **ErrorBoundary** : SentryErrorBoundary global capture l'erreur

---

## 🔍 CAUSES POSSIBLES

### 1. Erreur dans le Composant Marketplace

**Symptôme** : L'erreur se produit lors du rendu du composant

**Vérifications** :

- [ ] Ouvrir l'onglet **Network** dans les DevTools
- [ ] Vérifier les requêtes qui échouent (statut 4xx ou 5xx)
- [ ] Vérifier si `rate-limiter` bloque des requêtes (statut 429)
- [ ] Vérifier les erreurs CORS (statut CORS blocked)

**Solution** : Vérifier les logs réseau pour identifier la requête qui échoue

---

### 2. Rate Limiter Bloque les Requêtes

**Symptôme** : Le `rate-limiter` pourrait bloquer des requêtes nécessaires au chargement

**Vérifications** :

- [ ] Ouvrir l'onglet **Network**
- [ ] Chercher les requêtes vers `/functions/v1/rate-limiter`
- [ ] Vérifier si elles retournent un statut 429 (Too Many Requests)
- [ ] Vérifier si les requêtes vers Supabase échouent

**Solution** :

- Vérifier que le rate-limiter ne bloque pas trop agressivement
- Augmenter les limites si nécessaire
- Vérifier que le CORS est correctement configuré

---

### 3. Erreur dans useMarketplaceProducts Hook

**Symptôme** : Le hook qui charge les produits échoue

**Vérifications** :

- [ ] Vérifier les logs dans l'onglet **Console** (même s'il semble vide)
- [ ] Vérifier l'onglet **Network** pour les requêtes Supabase
- [ ] Vérifier si les RPC functions sont accessibles

**Solution** : Vérifier les permissions RLS et les fonctions RPC

---

### 4. Problème de Build/Chunk

**Symptôme** : Le chunk JavaScript n'est pas chargé correctement

**Vérifications** :

- [ ] Ouvrir l'onglet **Network**
- [ ] Chercher les fichiers `.js` qui échouent (404, 500, etc.)
- [ ] Vérifier si le chunk `Marketplace` est chargé

**Solution** : Rebuild et redéployer l'application

---

## 🛠️ ÉTAPES DE DIAGNOSTIC

### Étape 1 : Vérifier l'Onglet Network

1. Ouvrir les DevTools (F12)
2. Aller sur l'onglet **Network**
3. Recharger la page (`Ctrl+Shift+R`)
4. Filtrer par **Failed** (requêtes en rouge)
5. Noter les requêtes qui échouent :
   - Statut HTTP (404, 429, 500, CORS blocked)
   - URL de la requête
   - Type de requête (fetch, xhr, etc.)

### Étape 2 : Vérifier la Console (avec Filtres)

1. Ouvrir l'onglet **Console**
2. Cliquer sur l'icône de filtre (⚙️)
3. Activer **All levels** (pas seulement Errors)
4. Vérifier les warnings et logs
5. Chercher les messages liés à :
   - `Marketplace`
   - `rate-limiter`
   - `useMarketplaceProducts`
   - `Supabase`

### Étape 3 : Vérifier les Logs Sentry

1. Aller sur le dashboard Sentry
2. Chercher les erreurs récentes pour `Marketplace`
3. Vérifier les stack traces
4. Noter les détails de l'erreur

### Étape 4 : Tester en Mode Développement

1. Lancer l'application en local (`npm run dev`)
2. Aller sur `http://localhost:8080/marketplace`
3. Vérifier si l'erreur se reproduit
4. Si oui, vérifier la console pour plus de détails

---

## 🔧 SOLUTIONS PROPOSÉES

### Solution 1 : Améliorer le Logging

Ajouter plus de logs dans le composant Marketplace pour identifier où l'erreur se produit :

```typescript
// Dans Marketplace.tsx
useEffect(() => {
  logger.info('[Marketplace] Component mounted');
}, []);

useEffect(() => {
  if (queryError) {
    logger.error('[Marketplace] Query error:', queryError);
  }
}, [queryError]);
```

### Solution 2 : Ajouter un ErrorBoundary Spécifique

Envelopper le composant Marketplace dans un ErrorBoundary spécifique pour capturer l'erreur plus tôt :

```typescript
<ErrorBoundary
  fallback={<MarketplaceErrorFallback />}
  onError={(error, errorInfo) => {
    logger.error('[Marketplace] Error caught:', { error, errorInfo });
  }}
>
  <Marketplace />
</ErrorBoundary>
```

### Solution 3 : Vérifier le Rate Limiter

S'assurer que le rate-limiter ne bloque pas les requêtes nécessaires :

1. Vérifier les limites dans `rate-limiter/index.ts`
2. Vérifier que les requêtes Supabase ne sont pas bloquées
3. Vérifier que le CORS est correctement configuré

---

## 📝 INFORMATIONS À COLLECTER

Pour diagnostiquer le problème, collecter :

1. **Screenshots** :
   - Onglet Network (filtre Failed)
   - Onglet Console (tous les niveaux)
   - Onglet Sources (si erreur JavaScript)

2. **Logs** :
   - Logs du serveur (si disponibles)
   - Logs Sentry
   - Logs du navigateur (export console)

3. **Détails** :
   - URL exacte où l'erreur se produit
   - Navigateur et version
   - Si l'erreur se produit en production seulement ou aussi en local

---

## ✅ PROCHAINES ÉTAPES

1. **Collecter les informations** ci-dessus
2. **Vérifier l'onglet Network** pour identifier les requêtes qui échouent
3. **Vérifier les logs Sentry** pour voir l'erreur exacte
4. **Tester en local** pour voir si l'erreur se reproduit
5. **Appliquer les solutions** proposées selon les résultats

---

**Note** : La console vide suggère que l'erreur pourrait être :

- Une erreur réseau (requête qui échoue)
- Une erreur capturée silencieusement par un ErrorBoundary
- Une erreur dans un hook ou une dépendance qui n'est pas loggée
