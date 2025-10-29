# 🧪 PLAN DE TEST - COMPOSANTS REACT DIGITAL PRODUCTS

## 🎯 OBJECTIF

Tester tous les composants React créés en Phase 4 pour s'assurer qu'ils fonctionnent avec la vraie base de données.

---

## 📦 COMPOSANTS À TESTER

### Composants créés en Phase 4

| # | Composant | Fichier | Status |
|---|-----------|---------|--------|
| 1 | DigitalProductStatusIndicator | `src/components/digital/DigitalProductStatusIndicator.tsx` | ⏳ |
| 2 | DownloadInfoDisplay | `src/components/digital/DownloadInfoDisplay.tsx` | ⏳ |
| 3 | DigitalProductsList | `src/components/digital/DigitalProductsList.tsx` | ⏳ |
| 4 | DigitalBundleManager | `src/components/digital/DigitalBundleManager.tsx` | ⏳ |
| 5 | DownloadHistory | `src/components/digital/DownloadHistory.tsx` | ⏳ |
| 6 | BulkDigitalUpdate | `src/components/digital/BulkDigitalUpdate.tsx` | ⏳ |
| 7 | CustomerAccessManager | `src/components/digital/CustomerAccessManager.tsx` | ⏳ |
| 8 | DigitalProductsDashboard | `src/components/digital/DigitalProductsDashboard.tsx` | ⏳ |

### Hooks à tester

| # | Hook | Fichier | Status |
|---|------|---------|--------|
| 1 | useDigitalProducts | `src/hooks/digital/useDigitalProducts.ts` | ⏳ |
| 2 | useCustomerDownloads | `src/hooks/digital/useCustomerDownloads.ts` | ⏳ |
| 3 | useDigitalAlerts | `src/hooks/digital/useDigitalAlerts.ts` | ⏳ |
| 4 | useDigitalReports | `src/hooks/digital/useDigitalReports.ts` | ⏳ |

---

## 🚀 TESTS PAR COMPOSANT

### Test 1: DigitalBundleManager (PRIORITAIRE)

**Pourquoi en premier ?** C'est le composant le plus complexe et il utilise les nouvelles tables.

#### Scénarios de test

1. **Affichage de la liste des bundles**
   - [ ] Liste vide affichée correctement
   - [ ] Bundles existants affichés
   - [ ] Filtres fonctionnent (status, featured)
   - [ ] Recherche fonctionne

2. **Création d'un bundle**
   - [ ] Dialog s'ouvre
   - [ ] Formulaire validé correctement
   - [ ] Sélection de produits fonctionne
   - [ ] Calcul automatique du prix
   - [ ] Génération automatique du slug
   - [ ] Bundle créé en base de données

3. **Édition d'un bundle**
   - [ ] Dialog pré-rempli avec données
   - [ ] Modifications sauvegardées
   - [ ] Prix recalculé automatiquement

4. **Suppression d'un bundle**
   - [ ] Confirmation affichée
   - [ ] Bundle supprimé de la BD
   - [ ] Liste mise à jour

5. **Gestion des produits du bundle**
   - [ ] Ajouter un produit
   - [ ] Retirer un produit
   - [ ] Réorganiser l'ordre
   - [ ] Prix mis à jour automatiquement

#### Comment tester

```tsx
// 1. Ouvrir dans le navigateur
http://localhost:5173/admin/digital/bundles

// 2. Actions à effectuer
- Créer un nouveau bundle
- Ajouter 3 produits
- Vérifier que le prix est calculé
- Éditer le bundle
- Changer le type de réduction
- Supprimer le bundle

// 3. Vérifier dans Supabase Dashboard
SELECT * FROM digital_bundles ORDER BY created_at DESC;
SELECT * FROM digital_bundle_items WHERE bundle_id = '[ID]';
```

---

### Test 2: DigitalProductsDashboard

#### Scénarios de test

1. **Affichage des stats**
   - [ ] Total downloads affiché
   - [ ] Unique downloaders affiché
   - [ ] Active licenses affiché
   - [ ] Graphiques rendus correctement

2. **Liste des produits**
   - [ ] Produits digitaux listés
   - [ ] Stats par produit affichées
   - [ ] Actions disponibles

3. **Filtres et tri**
   - [ ] Filtrer par type digital
   - [ ] Trier par downloads
   - [ ] Recherche fonctionne

#### Comment tester

```tsx
// 1. Ouvrir
http://localhost:5173/admin/digital/dashboard

// 2. Vérifier
- Stats globales en haut
- Liste des produits
- Graphiques
- Filtres et recherche
```

---

### Test 3: DigitalProductsList

#### Scénarios de test

1. **Liste des produits**
   - [ ] Produits affichés avec badges
   - [ ] Filtres fonctionnent
   - [ ] Pagination fonctionne

2. **Actions rapides**
   - [ ] Éditer un produit
   - [ ] Voir détails
   - [ ] Actions groupées

#### Comment tester

```tsx
// Ouvrir
http://localhost:5173/admin/digital/products

// Vérifier filtres, actions, pagination
```

---

### Test 4: CustomerAccessManager

#### Scénarios de test

1. **Gestion des accès**
   - [ ] Liste des clients avec accès
   - [ ] Donner accès à un client
   - [ ] Révoquer un accès
   - [ ] Voir historique d'accès

#### Comment tester

```tsx
// Ouvrir
http://localhost:5173/admin/digital/access

// Tester attribution et révocation d'accès
```

---

### Test 5: DownloadHistory

#### Scénarios de test

1. **Historique des téléchargements**
   - [ ] Liste des downloads
   - [ ] Filtres par date
   - [ ] Recherche par produit/client
   - [ ] Export CSV fonctionne

#### Comment tester

```tsx
// Ouvrir
http://localhost:5173/admin/digital/downloads

// Vérifier liste, filtres, export
```

---

## 🧪 TESTS DES HOOKS

### Test: useDigitalProducts

```tsx
// Créer un composant de test
import { useDigitalProducts } from '@/hooks/digital/useDigitalProducts';

function TestUseDigitalProducts() {
  const { data: products, isLoading } = useDigitalProducts.useList();
  
  console.log('Products:', products);
  console.log('Loading:', isLoading);
  
  return <div>Check console</div>;
}
```

**Vérifier:**
- [ ] Liste récupérée depuis Supabase
- [ ] Loading state correct
- [ ] Données formatées correctement

### Test: useCustomerDownloads

```tsx
import { useCustomerDownloads } from '@/hooks/digital/useCustomerDownloads';

function TestCustomerDownloads() {
  const { data: downloads } = useCustomerDownloads();
  
  console.log('Downloads:', downloads);
  
  return <div>Check console</div>;
}
```

**Vérifier:**
- [ ] Downloads récupérés
- [ ] Vue `recent_digital_downloads` utilisée
- [ ] Données correctes

---

## 📊 CHECKLIST DE TEST COMPLÈTE

### Phase 1: Setup (5 min)
- [ ] Base de données prête (migrations exécutées)
- [ ] Tests SQL passés
- [ ] Données de test créées (bundles, produits)
- [ ] Dev server lancé (`npm run dev`)

### Phase 2: Tests des composants principaux (30 min)
- [ ] DigitalBundleManager
  - [ ] Création bundle
  - [ ] Édition bundle
  - [ ] Suppression bundle
  - [ ] Gestion produits
- [ ] DigitalProductsDashboard
  - [ ] Stats globales
  - [ ] Graphiques
  - [ ] Liste produits

### Phase 3: Tests des composants secondaires (20 min)
- [ ] DigitalProductsList
- [ ] CustomerAccessManager
- [ ] DownloadHistory
- [ ] BulkDigitalUpdate
- [ ] DigitalProductStatusIndicator
- [ ] DownloadInfoDisplay

### Phase 4: Tests des hooks (15 min)
- [ ] useDigitalProducts
- [ ] useCustomerDownloads
- [ ] useDigitalAlerts
- [ ] useDigitalReports

### Phase 5: Tests d'intégration (20 min)
- [ ] Créer bundle → Voir dans liste
- [ ] Éditer bundle → Changements sauvegardés
- [ ] Supprimer bundle → Disparaît de partout
- [ ] Stats mises à jour en temps réel

### Phase 6: Tests de performance (10 min)
- [ ] Chargement rapide (<2s)
- [ ] Pas de lag lors du scroll
- [ ] Filtres réactifs
- [ ] Pas d'erreurs console

---

## 🐛 PROBLÈMES COURANTS

### Erreur: "Could not load Supabase client"

**Solution:**
```bash
# Vérifier que les variables d'environnement sont définies
cat .env.local

# Doivent contenir:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Erreur: "Table does not exist"

**Solution:** Exécuter les migrations d'abord
```sql
-- Dans Supabase Dashboard
\i 20251029_digital_bundles_clean.sql
\i 20251029_digital_enhancements_clean.sql
```

### Composant ne charge pas de données

**Solution:** Vérifier les RLS policies
```sql
-- Désactiver temporairement RLS pour debug
ALTER TABLE digital_bundles DISABLE ROW LEVEL SECURITY;
-- NE PAS OUBLIER DE RÉACTIVER APRÈS!
```

### Hook retourne undefined

**Solution:** Vérifier que React Query est configuré
```tsx
// Dans App.tsx ou main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

---

## 📈 MÉTRIQUES DE SUCCÈS

Un test est réussi si :

✅ Aucune erreur dans la console  
✅ Données s'affichent correctement  
✅ Actions CRUD fonctionnent  
✅ Temps de chargement < 2s  
✅ UI responsive et fluide  
✅ Données synchronisées avec la BD  

---

## 🎯 PROCHAINES ÉTAPES APRÈS LES TESTS

1. **Si tous les tests passent ✅**
   - Documenter les résultats
   - Passer en staging
   - Tests utilisateurs

2. **Si des tests échouent ❌**
   - Noter les erreurs
   - Fixer les bugs
   - Re-tester

3. **Optimisations possibles**
   - Lazy loading des composants
   - Virtualisation des listes longues
   - Cache des requêtes

---

## 📝 RAPPORT DE TEST (Template)

```markdown
# Rapport de Test - Digital Products Components

Date: [DATE]
Testeur: [NOM]

## Résultats

### Composants
- DigitalBundleManager: ✅ / ❌
- DigitalProductsDashboard: ✅ / ❌
- DigitalProductsList: ✅ / ❌
- CustomerAccessManager: ✅ / ❌
- DownloadHistory: ✅ / ❌
- BulkDigitalUpdate: ✅ / ❌
- DigitalProductStatusIndicator: ✅ / ❌
- DownloadInfoDisplay: ✅ / ❌

### Hooks
- useDigitalProducts: ✅ / ❌
- useCustomerDownloads: ✅ / ❌
- useDigitalAlerts: ✅ / ❌
- useDigitalReports: ✅ / ❌

## Bugs trouvés
1. [Description]
2. [Description]

## Recommandations
1. [Recommandation]
2. [Recommandation]

## Conclusion
[PASS / FAIL]
```

---

**Date:** 29 Octobre 2025  
**Version:** 1.0  
**Durée estimée:** ~90 minutes  
**Prérequis:** Migrations SQL exécutées ✅

