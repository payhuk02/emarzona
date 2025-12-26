# ⚡ Guide d'Optimisation React - Emarzona

> **Objectif**: Optimiser les performances React avec `memo`, `useCallback`, `useMemo`

---

## 📊 État Actuel

- **Composants avec React.memo**: ~15 composants
- **Composants optimisés**: ProductCard, ProductCardModern, CartItem, etc.
- **Objectif**: Optimiser tous les composants lourds

---

## 🎯 Quand Utiliser React.memo

### ✅ Utiliser React.memo si:

1. **Composant rendu fréquemment** avec les mêmes props
2. **Composant coûteux** à rendre (calculs complexes, listes longues)
3. **Props stables** (ne changent pas souvent)
4. **Composant dans une liste** (évite les re-renders en cascade)

### ❌ Ne PAS utiliser React.memo si:

1. **Props changent souvent** (memo inutile)
2. **Composant simple** (overhead du memo > bénéfice)
3. **Props incluent des fonctions non mémorisées** (créées à chaque render)

---

## 🔧 Patterns d'Optimisation

### 1. React.memo avec Comparaison Personnalisée

```typescript
// ✅ Bon: Comparaison optimisée
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.storeSlug === nextProps.storeSlug
  );
});

// ❌ Mauvais: Comparaison par défaut (shallow comparison)
const ProductCard = React.memo(ProductCardComponent);
```

### 2. useCallback pour les Handlers

```typescript
// ✅ Bon: Handler mémorisé
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id);
  },
  [onItemClick]
);

// ❌ Mauvais: Handler recréé à chaque render
const handleClick = (id: string) => {
  onItemClick(id);
};
```

### 3. useMemo pour les Calculs Coûteux

```typescript
// ✅ Bon: Calcul mémorisé
const totalPrice = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}, [items]);

// ❌ Mauvais: Calcul à chaque render
const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
```

---

## 📋 Checklist d'Optimisation

### Composants à Optimiser

- [x] `ProductCard` - ✅ Optimisé
- [x] `ProductCardModern` - ✅ Optimisé
- [x] `CartItem` - ✅ Optimisé
- [x] `DigitalProductCard` - ✅ Optimisé
- [x] `PhysicalProductCard` - ✅ Optimisé
- [x] `CustomersTable` - ✅ Optimisé
- [x] `OrdersTable` - ✅ Optimisé
- [x] `OrdersList` - ✅ Optimisé
- [x] `TopProductsCard` - ✅ Optimisé
- [x] `RecentOrdersCard` - ✅ Optimisé
- [ ] `ProductListView` - ⚠️ À vérifier
- [ ] `DigitalProductsList` - ⚠️ À vérifier
- [ ] `PhysicalProductsList` - ⚠️ À vérifier

### Composants Lourds Identifiés

1. **ProductListView** - Liste de produits avec filtres
2. **DigitalProductsList** - Liste longue de produits digitaux
3. **PhysicalProductsList** - Liste longue de produits physiques
4. **Marketplace** - Page avec beaucoup de composants

---

## 🔍 Comment Identifier les Composants à Optimiser

### 1. Utiliser React DevTools Profiler

```bash
# Installer React DevTools
# https://react.dev/learn/react-developer-tools

# Utiliser le Profiler pour identifier:
# - Composants qui se re-rendent souvent
# - Temps de rendu élevé
# - Re-renders inutiles
```

### 2. Analyser les Re-renders

```typescript
// Ajouter temporairement pour debug
useEffect(() => {
  console.log('Component rendered:', componentName);
});
```

### 3. Vérifier les Props

```typescript
// Vérifier si les props changent souvent
useEffect(() => {
  console.log('Props changed:', props);
}, [props]);
```

---

## 📝 Exemples d'Optimisation

### Exemple 1: Liste de Produits

```typescript
// Avant
const ProductList = ({ products }) => {
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// Après
const ProductList = ({ products }) => {
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// ProductCard déjà optimisé avec React.memo
```

### Exemple 2: Formulaire Complexe

```typescript
// Avant
const FormComponent = ({ onSubmit }) => {
  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return <form onSubmit={handleSubmit}>...</form>;
};

// Après
const FormComponent = ({ onSubmit }) => {
  const handleSubmit = useCallback((data) => {
    onSubmit(data);
  }, [onSubmit]);

  return <form onSubmit={handleSubmit}>...</form>;
};
```

---

## ⚠️ Pièges à Éviter

### 1. Mémoriser des Objets/Fonctions dans les Props

```typescript
// ❌ Mauvais: Objet recréé à chaque render
<ProductCard product={{ ...product, newProp: value }} />

// ✅ Bon: Passer directement
<ProductCard product={product} newProp={value} />
```

### 2. Oublier les Dépendances

```typescript
// ❌ Mauvais: Dépendance manquante
const handleClick = useCallback(() => {
  doSomething(value);
}, []); // value manquant

// ✅ Bon: Toutes les dépendances
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### 3. Over-optimisation

```typescript
// ❌ Mauvais: Optimisation inutile
const SimpleComponent = React.memo(({ text }) => {
  return <p>{text}</p>;
});

// ✅ Bon: Pas besoin de memo pour composant simple
const SimpleComponent = ({ text }) => {
  return <p>{text}</p>;
};
```

---

## 🎯 Prochaines Étapes

1. **Auditer** les composants avec React DevTools Profiler
2. **Identifier** les composants lourds non optimisés
3. **Optimiser** progressivement les composants identifiés
4. **Tester** les performances avant/après
5. **Documenter** les optimisations effectuées

---

## 🔗 Ressources

- [React.memo Documentation](https://react.dev/reference/react/memo)
- [useCallback Documentation](https://react.dev/reference/react/useCallback)
- [useMemo Documentation](https://react.dev/reference/react/useMemo)
- [React Performance](https://react.dev/learn/render-and-commit)

---

_Dernière mise à jour: 2025-01-30_
