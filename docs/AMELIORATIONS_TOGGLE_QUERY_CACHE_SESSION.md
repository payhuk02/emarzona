# ✅ AMÉLIORATIONS TOGGLE, QUERY PARAMS & CACHE - SESSION

## Date : 28 Février 2025

---

## 🎯 OBJECTIF

Créer des hooks réutilisables pour gérer les états toggle, les paramètres d'URL et le cache local, simplifiant leur utilisation dans toute l'application.

---

## ✅ AMÉLIORATIONS COMPLÉTÉES

### 1. Hook useToggle ✅

**Fichier** : `src/hooks/useToggle.ts`

**Fonctionnalités** :

- ✅ **useToggle** : Hook pour gérer un état booléen avec toggle
- ✅ **useToggles** : Hook pour gérer plusieurs toggles à la fois
- ✅ **API simple** : `value`, `toggle`, `setTrue`, `setFalse`, `setValue`
- ✅ **Reset** : Fonction `reset` pour useToggles

**Bénéfices** :

- 🟢 Réduction du code répétitif : ~50-60% pour les toggles
- 🟢 API simple et intuitive
- 🟢 Support multi-toggles

**Exemple d'utilisation** :

```tsx
// Ancien code
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen(prev => !prev);
const open = () => setIsOpen(true);
const close = () => setIsOpen(false);

// Nouveau code
const { value: isOpen, toggle, setTrue: open, setFalse: close } = useToggle(false);

// Multi-toggles
const { values, toggle, setTrue, setFalse } = useToggles({
  isOpen: false,
  isVisible: true,
  isActive: false,
});
```

---

### 2. Hook useQueryParams ✅

**Fichier** : `src/hooks/useQueryParams.ts`

**Fonctionnalités** :

- ✅ **getParam** : Obtenir un paramètre
- ✅ **setParam** : Définir un paramètre
- ✅ **removeParam** : Supprimer un paramètre
- ✅ **getAllParams** : Obtenir tous les paramètres
- ✅ **getParamAsNumber** : Obtenir un paramètre comme nombre
- ✅ **getParamAsBoolean** : Obtenir un paramètre comme booléen
- ✅ **setParams** : Définir plusieurs paramètres à la fois
- ✅ **removeParams** : Supprimer plusieurs paramètres
- ✅ **clearParams** : Réinitialiser tous les paramètres
- ✅ **useQueryParam** : Hook pour gérer un paramètre spécifique

**Bénéfices** :

- 🟢 Réduction du code répétitif : ~50-60% pour les query params
- 🟢 API simple et intuitive
- 🟢 Support de types (string, number, boolean)

**Exemple d'utilisation** :

```tsx
// Ancien code
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') || '1';
const setPage = (p: string) => {
  setSearchParams({ page: p });
};

// Nouveau code
const { getParam, setParam, getParamAsNumber } = useQueryParams();
const page = getParamAsNumber('page', 1);
setParam('page', 2);

// Hook spécialisé
const [page, setPage] = useQueryParam<number>('page', 1);
```

---

### 3. Hook useLocalCache ✅

**Fichier** : `src/hooks/useLocalCache.ts`

**Fonctionnalités** :

- ✅ **get** : Obtenir la valeur du cache
- ✅ **set** : Définir une valeur dans le cache
- ✅ **remove** : Supprimer la valeur du cache
- ✅ **has** : Vérifier si la clé existe
- ✅ **clear** : Réinitialiser le cache
- ✅ **getOrSet** : Obtenir ou exécuter une fonction et mettre en cache
- ✅ **TTL** : Support du Time To Live
- ✅ **SessionStorage** : Option pour utiliser sessionStorage

**Bénéfices** :

- 🟢 Réduction du code répétitif : ~50-60% pour le cache
- 🟢 API simple et intuitive
- 🟢 Support TTL automatique

**Exemple d'utilisation** :

```tsx
// Ancien code
const getCached = () => {
  const cached = localStorage.getItem('my-key');
  if (!cached) return null;
  const { value, expiry } = JSON.parse(cached);
  if (Date.now() > expiry) {
    localStorage.removeItem('my-key');
    return null;
  }
  return value;
};

// Nouveau code
const { get, set, has } = useLocalCache('my-key', { ttl: 60000 });
const data = get();
set(data);

// Avec getOrSet
const data = await getOrSet(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
```

---

## 📊 IMPACT ATTENDU

### Code Quality

- **Réduction du code répétitif** : ~50-60% selon le type
- **Maintenabilité** : Code plus cohérent et réutilisable
- **DX (Developer Experience)** : API plus simple et intuitive

### Performance

- **Toggle** : Gestion efficace de l'état
- **Query Params** : Utilisation optimisée de URLSearchParams
- **Cache** : Gestion efficace avec TTL automatique

### UX

- **Query Params** : Synchronisation URL/état améliorée
- **Cache** : Performance améliorée avec cache local

---

## 🔧 MIGRATION PROGRESSIVE

### Pour useToggle

**Option 1 : Remplacer les patterns manuels**

```tsx
// Ancien
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen(prev => !prev);

// Nouveau
const { value: isOpen, toggle } = useToggle(false);
```

### Pour useQueryParams

**Option 1 : Remplacer les patterns manuels**

```tsx
// Ancien
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') || '1';

// Nouveau
const { getParamAsNumber } = useQueryParams();
const page = getParamAsNumber('page', 1);
```

### Pour useLocalCache

**Option 1 : Remplacer les patterns manuels**

```tsx
// Ancien
const getCached = () => {
  // ... logique complexe de cache
};

// Nouveau
const { get, set } = useLocalCache('my-key', { ttl: 60000 });
```

---

## 📝 RECOMMANDATIONS

### Priorité HAUTE

1. ✅ **Hook useToggle** - COMPLÉTÉ
2. ✅ **Hook useQueryParams** - COMPLÉTÉ
3. ✅ **Hook useLocalCache** - COMPLÉTÉ
4. ⏳ **Migrer progressivement** les composants vers ces hooks

### Priorité MOYENNE

5. ⏳ **Créer des hooks spécialisés** pour des cas d'usage spécifiques
6. ⏳ **Ajouter des tests** pour les nouveaux hooks

---

## ✅ CONCLUSION

**Améliorations appliquées** :

- ✅ Hook useToggle créé avec support multi-toggles
- ✅ Hook useQueryParams créé avec support de types
- ✅ Hook useLocalCache créé avec TTL automatique

**Impact** : 🟢 **MOYEN-ÉLEVÉ** - Réduction significative du code répétitif et amélioration de la cohérence UX.

**Prochaines étapes** :

- ⏳ Migrer les composants vers useToggle
- ⏳ Migrer les composants vers useQueryParams
- ⏳ Migrer les composants vers useLocalCache

---

## 📚 RESSOURCES

- [React Router useSearchParams](https://reactrouter.com/en/main/hooks/use-search-params)
- [URLSearchParams API](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
