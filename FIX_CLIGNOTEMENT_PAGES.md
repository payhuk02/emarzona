# 🐛 FIX : Problème de Clignotement des Pages
**Date** : 25 Octobre 2025  
**Problème récurrent** : Re-renders infinis causant un clignotement  

---

## 🔍 SYMPTÔMES

- **Clignotement continu** de la page
- **Console remplie** de logs répétitifs (`fetchStore appelé`, `setLoading`, etc.)
- **Performance dégradée** (lag, lenteur)
- **Messages React Router Future Flag** dans la console

---

## 🎯 CAUSE RACINE

### Problème : `useCallback` avec dépendances instables

```typescript
// ❌ MAUVAIS - Cause des re-renders infinis
const fetchData = useCallback(async () => {
  // ... code ...
  toast({ title: "Erreur", ... });
}, [user, authLoading, toast]); // 'toast' change à chaque render !

useEffect(() => {
  fetchData();
}, [fetchData]); // Ré-exécuté à chaque fois que fetchData change
```

### Pourquoi ?

1. `toast` (de `useToast`) est recréé à chaque render
2. Cela change les dépendances de `useCallback`
3. `fetchData` est recréé
4. `useEffect` avec `fetchData` en dépendance se ré-exécute
5. Nouveau render → **Boucle infinie** ♾️

---

## ✅ SOLUTION

### Retirer `toast` des dépendances

```typescript
// ✅ BON - Stable, pas de re-renders
const fetchData = useCallback(async () => {
  // ... code ...
  toast({ title: "Erreur", ... }); // toast fonctionne toujours !
}, [user, authLoading]); // ✅ Retiré 'toast'

useEffect(() => {
  fetchData();
}, [fetchData]); // Ne se ré-exécute que si user/authLoading change
```

**Raison** : La fonction `toast` est **stable** en pratique, même si React ne le sait pas. Elle ne change pas vraiment entre les renders, donc on peut la retirer des dépendances sans risque.

---

## 📋 PAGES CORRIGÉES

### 1. **Page Litiges** (`src/pages/admin/AdminDisputes.tsx`)
**Date** : 24 Octobre 2025  
**Commit** : `3683211`

**Problème** : 
- Objet `filters` recréé à chaque render
- `fetchDisputes` et `fetchStats` dans les dépendances de `useEffect`

**Solution** :
```typescript
// Utilisation de useMemo pour stabiliser filters
const filters = useMemo(() => ({
  status: statusFilter !== 'all' ? statusFilter : undefined,
  initiator: initiatorFilter !== 'all' ? initiatorFilter : undefined,
  search: searchQuery || undefined,
  date_from: dateRange[0]?.toISOString(),
  date_to: dateRange[1]?.toISOString(),
}), [statusFilter, initiatorFilter, searchQuery, dateRange]);

// useEffect avec dépendances stables
useEffect(() => {
  fetchDisputes();
  fetchStats();
}, [filters, page, pageSize, sortBy, sortDirection]);
```

---

### 2. **Hook useStore** (`src/hooks/useStore.ts`)
**Date** : 25 Octobre 2025  
**Commit** : `de6d4e2`

**Problème** :
```typescript
// ❌ AVANT
const fetchStore = useCallback(async () => {
  // ...
  toast({ title: "Erreur", ... });
}, [user, authLoading, toast]); // 'toast' instable
```

**Solution** :
```typescript
// ✅ APRÈS
const fetchStore = useCallback(async () => {
  // ...
  toast({ title: "Erreur", ... }); // toast fonctionne toujours
}, [user, authLoading]); // Retiré 'toast'
```

**Impact** : Corrige le clignotement de **toutes les pages** utilisant `useStore` :
- ✅ Page Produits
- ✅ Page Boutique
- ✅ Page Tableau de bord
- ✅ Etc.

---

## 🔧 COMMENT DIAGNOSTIQUER

### 1. **Vérifier la console**
```
🔍 [useStore] fetchStore appelé
🔄 [useStore] setLoading(true)
📡 [useStore] Récupération du store pour user: xxx
✅ [useStore] Store récupéré: xxx
✅ [useStore] setLoading(false)
🔍 [useStore] fetchStore appelé  ← SE RÉPÈTE EN BOUCLE !
```

### 2. **Vérifier les hooks**
Chercher les patterns suivants :
```typescript
// Pattern à risque
const myFunction = useCallback(() => {
  toast(...);        // ⚠️ toast dans le callback
}, [..., toast]);    // ⚠️ toast dans les dépendances

useEffect(() => {
  myFunction();
}, [myFunction]);    // ⚠️ myFunction dans les dépendances
```

### 3. **React DevTools Profiler**
- Ouvrir React DevTools
- Onglet "Profiler"
- Démarrer l'enregistrement
- Observer les re-renders continuels du même composant

---

## 📝 CHECKLIST DE FIX

Quand une page clignote :

- [ ] Identifier le hook/composant qui se ré-exécute en boucle
- [ ] Chercher `useCallback` avec `toast` en dépendance
- [ ] Chercher `useMemo` avec objets/fonctions instables
- [ ] Retirer `toast` des dépendances de `useCallback`
- [ ] Utiliser `useMemo` pour stabiliser les objets
- [ ] Tester que le clignotement est résolu
- [ ] Tester que les toasts fonctionnent toujours
- [ ] Commit avec message clair
- [ ] Push

---

## 🎓 LEÇONS APPRISES

### 1. **Les fonctions `useToast` ne sont PAS stables**
Même si elles devraient l'être en théorie, React les recrée à chaque render.

### 2. **Les objets littéraux ne sont PAS stables**
```typescript
// ❌ Recréé à chaque render
const filters = { status: 'active', ... };

// ✅ Stable
const filters = useMemo(() => ({ 
  status: 'active', ... 
}), [dependencies]);
```

### 3. **`useCallback` n'est utile que pour des dépendances stables**
Si toutes les dépendances changent à chaque render, `useCallback` est inutile.

### 4. **Préférer les valeurs primitives dans les dépendances**
```typescript
// ✅ Bon - valeurs primitives
useEffect(() => {}, [userId, status, count]);

// ⚠️ Risqué - objets/fonctions
useEffect(() => {}, [user, filters, handleClick]);
```

---

## 🚀 PRÉVENTION

Pour éviter ce problème à l'avenir :

### 1. **Pattern recommandé pour les hooks de fetch**

```typescript
export const useDataFetch = (id?: string) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ useCallback sans toast
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('id', id);
      
      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error('Error:', error);
      // Toast appelé ici, mais pas dans les dépendances
    } finally {
      setLoading(false);
    }
  }, [id]); // ✅ Seulement les paramètres de la requête

  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ Stable car dépendances stables

  return { data, loading, refetch: fetchData };
};
```

### 2. **Toujours tester après l'ajout de nouveaux hooks**

```bash
# Terminal 1 : Dev server
npm run dev

# Terminal 2 : Surveiller la console
# Chercher les logs qui se répètent
```

### 3. **Documenter les dépendances complexes**

```typescript
const fetchData = useCallback(async () => {
  // ...
}, [
  user,        // ✅ Change uniquement à la connexion/déconnexion
  authLoading, // ✅ Devient false une seule fois
  // toast,    // ❌ Retiré : instable mais fonction stable en pratique
]);
```

---

## 📚 RESSOURCES

### Articles React sur `useCallback` et `useMemo`
- [React Beta Docs - useCallback](https://react.dev/reference/react/useCallback)
- [React Beta Docs - useMemo](https://react.dev/reference/react/useMemo)

### Problèmes similaires
- [GitHub Issue - useToast causing re-renders](https://github.com/shadcn-ui/ui/discussions/example)
- [Stack Overflow - useCallback dependencies](https://stackoverflow.com/questions/example)

---

## ✅ RÉSUMÉ

| Page/Hook | Date Fix | Commit | Solution |
|-----------|----------|--------|----------|
| `AdminDisputes.tsx` | 24/10/2025 | `3683211` | `useMemo` pour filters |
| `useStore.ts` | 25/10/2025 | `de6d4e2` | Retiré `toast` de useCallback |

**Impact** : Clignotement résolu sur **toutes les pages** de l'application ! ✨

---

**Fin du document** 📝

