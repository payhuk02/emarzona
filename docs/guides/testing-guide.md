# 🧪 Guide des Tests - Payhula

**Dernière mise à jour** : Janvier 2025

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Tests Unitaires](#tests-unitaires)
3. [Tests E2E](#tests-e2e)
4. [Tests d'Accessibilité](#tests-daccessibilité)
5. [Stratégie de Couverture](#stratégie-de-couverture)
6. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🎯 Vue d'Ensemble

### Outils Utilisés

- **Vitest** : Tests unitaires et de composants
- **Playwright** : Tests E2E
- **Testing Library** : Utilitaires de test React
- **@axe-core/playwright** : Tests d'accessibilité

### Structure des Tests

```
tests/
├── auth/              # Tests d'authentification
├── products/          # Tests produits
├── marketplace/       # Tests marketplace
└── e2e/              # Tests end-to-end

src/
├── components/
│   └── __tests__/    # Tests de composants
├── hooks/
│   └── __tests__/    # Tests de hooks
└── lib/
    └── __tests__/    # Tests d'utilitaires
```

---

## 🔬 Tests Unitaires

### Configuration

Les tests unitaires utilisent Vitest avec jsdom.

### Exécuter les Tests

```bash
# Tous les tests
npm run test:unit

# Mode watch
npm test

# Avec UI interactive
npm run test:ui

# Avec couverture
npm run test:coverage
```

### Exemple de Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Tests de Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

describe('useDashboardStats', () => {
  it('returns initial loading state', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.loading).toBe(true);
  });
});
```

---

## 🎭 Tests E2E

### Configuration

Les tests E2E utilisent Playwright avec plusieurs navigateurs.

### Exécuter les Tests E2E

```bash
# Tous les tests E2E
npm run test:e2e

# Par module
npm run test:e2e:auth
npm run test:e2e:products
npm run test:e2e:marketplace
npm run test:e2e:cart

# Mode UI
npx playwright test --ui

# Mode debug
npx playwright test --debug
```

### Exemple de Test E2E

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## ♿ Tests d'Accessibilité

### Exécuter les Tests A11y

```bash
npm run test:a11y
```

### Exemple

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## 📊 Stratégie de Couverture

### Objectif Actuel

- **Objectif** : 50% de couverture minimum
- **Priorité** : Composants critiques (paiements, auth, produits)

### Composants Prioritaires

1. **Authentification** : `AuthContext`, `ProtectedRoute`
2. **Paiements** : Hooks et composants Moneroo/PayDunya
3. **Produits** : Création, édition, affichage
4. **Commandes** : Gestion des commandes
5. **Dashboard** : Statistiques et affichage

### Vérifier la Couverture

```bash
npm run test:coverage
```

Le rapport sera généré dans `coverage/`.

---

## ✅ Bonnes Pratiques

### 1. Tests Isolés

Chaque test doit être indépendant :

```typescript
// ✅ Bon
test('creates product', async () => {
  const product = await createProduct(data);
  expect(product.id).toBeDefined();
});

// ❌ Mauvais (dépend d'un autre test)
test('updates product', async () => {
  // Dépend de createProduct du test précédent
});
```

### 2. Tests Déterministes

Éviter les valeurs aléatoires :

```typescript
// ✅ Bon
const date = new Date('2025-01-01');

// ❌ Mauvais
const date = new Date(); // Change à chaque exécution
```

### 3. Nommer les Tests Clairement

```typescript
// ✅ Bon
test('should display error message when product creation fails');

// ❌ Mauvais
test('test1');
```

### 4. Tester les Cas Limites

```typescript
test('handles empty product list', () => {
  const { result } = renderHook(() => useProducts());
  expect(result.current.products).toEqual([]);
});

test('handles API error gracefully', async () => {
  // Mock API error
  // Vérifier le comportement
});
```

### 5. Utiliser les Mocks Appropriés

```typescript
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));
```

---

## 📝 Checklist de Test

Avant de créer un nouveau composant :

- [ ] Test unitaire pour la logique métier
- [ ] Test de rendu du composant
- [ ] Test des interactions utilisateur
- [ ] Test des cas d'erreur
- [ ] Test d'accessibilité (si composant UI)
- [ ] Test E2E pour les flux critiques

---

## 🔗 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

**Dernière mise à jour** : Janvier 2025

