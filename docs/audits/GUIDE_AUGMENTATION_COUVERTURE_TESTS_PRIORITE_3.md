# 🧪 GUIDE D'AUGMENTATION COUVERTURE TESTS (PRIORITÉ 3)

**Date** : 13 Janvier 2026  
**Priorité** : 🟡 **HAUTE**  
**Durée estimée** : 1-2 semaines

---

## 📊 ÉTAT ACTUEL

| Métrique | Actuel | Objectif | Écart |
|----------|--------|----------|-------|
| **Tests E2E** | 50+ | 50+ | ✅ Bon |
| **Tests unitaires** | 15 fichiers | 100+ fichiers | ⚠️ Insuffisant |
| **Couverture** | <30% | >80% | ⚠️ -50% |
| **Tests hooks** | ~10 | 50+ | ⚠️ Insuffisant |
| **Tests composants** | ~20 | 100+ | ⚠️ Insuffisant |

---

## ✅ TESTS DÉJÀ EN PLACE

### Tests E2E (Playwright) ✅
- ✅ 50+ tests E2E bien configurés
- ✅ Tests par module (Auth, Products, Marketplace, Cart)
- ✅ Configuration multi-navigateurs et mobile
- ✅ Tests d'intégration workflows complexes

### Tests Unitaires Existants ✅
- ✅ `src/hooks/__tests__/` - Tests hooks
- ✅ `src/lib/__tests__/` - Tests utilitaires
- ✅ `src/components/__tests__/` - Tests composants
- ✅ `tests/integration/` - Tests d'intégration

---

## 🎯 OBJECTIFS

### Phase 1 : Couverture 60% (Semaine 1)

**Objectifs** :
- [ ] Couverture globale : 30% → 60%
- [ ] Tests hooks critiques : 10 → 30
- [ ] Tests composants critiques : 20 → 50
- [ ] Tests utilitaires : Compléter

### Phase 2 : Couverture 80% (Semaine 2)

**Objectifs** :
- [ ] Couverture globale : 60% → 80%
- [ ] Tests hooks : 30 → 50+
- [ ] Tests composants : 50 → 100+
- [ ] Tests d'intégration : Compléter

---

## 📋 PLAN D'ACTION

### 1. Identifier Hooks Critiques à Tester 🟡

#### Hooks Prioritaires (à tester en premier)

**1.1 Hooks d'authentification**
- [ ] `useAuth` (déjà testé ✅)
- [ ] `useRequire2FA` (déjà testé ✅)
- [ ] `useProfile` (à tester)

**1.2 Hooks de produits**
- [ ] `useProducts` (déjà testé ✅)
- [ ] `useProductsOptimized` (déjà testé ✅)
- [ ] `useCreateProduct` (à tester)
- [ ] `useUpdateProduct` (à tester)
- [ ] `useDeleteProduct` (à tester)

**1.3 Hooks de commandes**
- [ ] `useOrders` (déjà testé ✅)
- [ ] `useCreateOrder` (à tester)
- [ ] `useCreateServiceOrder` (à tester)
- [ ] `useOrderStatus` (à tester)

**1.4 Hooks de panier**
- [ ] `useCart` (déjà testé ✅)
- [ ] `useAddToCart` (à tester)
- [ ] `useRemoveFromCart` (à tester)
- [ ] `useUpdateCartItem` (à tester)

**1.5 Hooks de paiement**
- [ ] `usePayments` (déjà testé ✅)
- [ ] `useMoneroo` (déjà testé ✅)
- [ ] `useCheckout` (à tester)

**1.6 Hooks de boutique**
- [ ] `useStore` (déjà testé ✅)
- [ ] `useCustomers` (déjà testé ✅)
- [ ] `useStoreStats` (à tester)

**Durée** : 3-4 jours

---

### 2. Créer Template de Tests pour Hooks 🟡

#### Template Standard

```typescript
// src/hooks/__tests__/useExampleHook.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExampleHook } from '../useExampleHook';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useExampleHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should fetch data successfully', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockData[0], error: null }),
    });

    const { result } = renderHook(() => useExampleHook('1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData[0]);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Test error');
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    const { result } = renderHook(() => useExampleHook('1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(mockError);
  });
});
```

**Durée** : 0.5 jour (création template)

---

### 3. Créer Template de Tests pour Composants 🟡

#### Template Standard

```typescript
// src/components/__tests__/ExampleComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should render correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ExampleComponent />
      </QueryClientProvider>
    );

    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ExampleComponent />
      </QueryClientProvider>
    );

    const button = screen.getByRole('button', { name: /click/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Clicked')).toBeInTheDocument();
    });
  });
});
```

**Durée** : 0.5 jour (création template)

---

### 4. Tests d'Intégration 🟡

#### Workflows à Tester

**4.1 Workflow de commande**
- [ ] Ajouter produit au panier
- [ ] Passer commande
- [ ] Paiement
- [ ] Confirmation

**4.2 Workflow de création produit**
- [ ] Créer produit
- [ ] Upload images
- [ ] Publier produit

**4.3 Workflow d'authentification**
- [ ] Inscription
- [ ] Connexion
- [ ] Déconnexion
- [ ] Récupération mot de passe

**Durée** : 2-3 jours

---

### 5. Intégrer Tests dans CI/CD 🟡

#### Configuration GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

**Durée** : 0.5 jour

---

## 📊 MÉTRIQUES DE SUCCÈS

### Semaine 1

- [ ] Couverture : 30% → 60%
- [ ] Tests hooks : 10 → 30
- [ ] Tests composants : 20 → 50
- [ ] Tests utilitaires : Compléter

### Semaine 2

- [ ] Couverture : 60% → 80%
- [ ] Tests hooks : 30 → 50+
- [ ] Tests composants : 50 → 100+
- [ ] Tests d'intégration : Compléter
- [ ] CI/CD configuré

---

## 🧪 COMMANDES UTILES

### Exécuter Tests

```bash
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Couverture
npm run test:coverage

# Watch mode
npm run test:watch
```

### Générer Rapport

```bash
# Rapport HTML
npm run test:coverage -- --coverage

# Rapport console
npm run test:coverage -- --coverage --reporter=text
```

---

## 🔗 RESSOURCES

### Documentation
- `tests/README.md` - Documentation tests
- `vitest.config.ts` - Configuration Vitest
- `playwright.config.ts` - Configuration Playwright

### Templates
- `src/hooks/__tests__/useExampleHook.test.ts` - Template hook (à créer)
- `src/components/__tests__/ExampleComponent.test.tsx` - Template composant (à créer)

### Outils
- [Vitest](https://vitest.dev/) - Framework de tests
- [Testing Library](https://testing-library.com/) - Utilitaires de test
- [Playwright](https://playwright.dev/) - Tests E2E

---

**Document créé le** : 13 Janvier 2026  
**Dernière mise à jour** : 13 Janvier 2026  
**Version** : 1.0
