# 🛡️ Guide de Gestion des Erreurs - Payhula

**Dernière mise à jour** : Janvier 2025

---

## 📋 Table des Matières

1. [Principes Généraux](#principes-généraux)
2. [Stratégies par Type d'Erreur](#stratégies-par-type-derreur)
3. [Hooks et Utilitaires](#hooks-et-utilitaires)
4. [Bonnes Pratiques](#bonnes-pratiques)
5. [Exemples](#exemples)

---

## 🎯 Principes Généraux

### 1. Toujours Utiliser le Logger

❌ **Ne pas faire** :
```typescript
console.error('Erreur:', error);
```

✅ **Faire** :
```typescript
import { logger } from '@/lib/logger';
logger.error('Erreur lors du chargement des données', { error });
```

### 2. Gérer les Erreurs de Manière Déclarative

Utiliser les hooks dédiés plutôt que try/catch manuel :

✅ **Recommandé** :
```typescript
const { data, error, isLoading } = useQueryWithErrorHandling({
  queryKey: ['products'],
  queryFn: fetchProducts,
});
```

### 3. Fournir des Messages d'Erreur Utilisateur

Toujours afficher un message clair à l'utilisateur :

```typescript
if (error) {
  toast({
    title: "Erreur",
    description: "Impossible de charger les produits. Veuillez réessayer.",
    variant: "destructive",
  });
}
```

---

## 🔧 Stratégies par Type d'Erreur

### Erreurs API / Réseau

**Hook recommandé** : `useQueryWithErrorHandling`

```typescript
import { useQueryWithErrorHandling } from '@/hooks/useQueryWithErrorHandling';

const { data, error, isLoading } = useQueryWithErrorHandling({
  queryKey: ['products', storeId],
  queryFn: () => fetchProducts(storeId),
  // Gestion automatique des erreurs réseau
});
```

**Caractéristiques** :
- Retry automatique avec exponential backoff
- Logging automatique vers Sentry
- Toast utilisateur automatique
- Fallback data si disponible

### Erreurs de Mutation

**Hook recommandé** : `useMutationWithRetry`

```typescript
import { useMutationWithRetry } from '@/hooks/useMutationWithRetry';

const mutation = useMutationWithRetry({
  mutationFn: createProduct,
  onSuccess: () => {
    toast({ title: "Produit créé avec succès" });
    queryClient.invalidateQueries(['products']);
  },
  // Gestion automatique des erreurs
});
```

### Erreurs de Validation

**Utiliser Zod** :

```typescript
import { z } from 'zod';
import { productSchema } from '@/lib/schemas';

try {
  const validatedData = productSchema.parse(formData);
  // Traiter les données validées
} catch (error) {
  if (error instanceof z.ZodError) {
    // Afficher les erreurs de validation
    error.errors.forEach(err => {
      toast({
        title: "Erreur de validation",
        description: err.message,
        variant: "destructive",
      });
    });
  }
}
```

### Erreurs Asynchrones

**Utiliser Error Boundaries** :

Les composants `ErrorBoundary` et `Sentry.ErrorBoundary` dans `App.tsx` capturent automatiquement les erreurs React.

Pour les erreurs dans les effets :

```typescript
useEffect(() => {
  async function loadData() {
    try {
      const data = await fetchData();
      setData(data);
    } catch (error) {
      logger.error('Erreur dans useEffect', { error });
      // Ne pas laisser l'erreur non gérée
    }
  }
  loadData();
}, []);
```

---

## 🪝 Hooks et Utilitaires

### useQueryWithErrorHandling

Hook recommandé pour toutes les requêtes de données.

```typescript
import { useQueryWithErrorHandling } from '@/hooks/useQueryWithErrorHandling';

const { data, error, isLoading, refetch } = useQueryWithErrorHandling({
  queryKey: ['key'],
  queryFn: fetchFunction,
  // Options supplémentaires
  retry: 2,
  staleTime: 5 * 60 * 1000,
});
```

### useMutationWithRetry

Hook recommandé pour toutes les mutations.

```typescript
import { useMutationWithRetry } from '@/hooks/useMutationWithRetry';

const mutation = useMutationWithRetry({
  mutationFn: updateFunction,
  onSuccess: (data) => {
    // Gestion du succès
  },
  // Retry automatique pour les erreurs réseau
});
```

### useErrorHandler

Hook générique pour la gestion d'erreurs.

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const handleError = useErrorHandler();

try {
  await someAsyncOperation();
} catch (error) {
  handleError(error, {
    context: 'Nom de l\'opération',
    showToast: true,
  });
}
```

---

## ✅ Bonnes Pratiques

### 1. Ne Jamais Ignorer les Erreurs

❌ **Ne pas faire** :
```typescript
try {
  await operation();
} catch (error) {
  // Ignorer l'erreur
}
```

✅ **Faire** :
```typescript
try {
  await operation();
} catch (error) {
  logger.error('Erreur dans operation', { error });
  // Gérer l'erreur ou la propager
}
```

### 2. Utiliser des Messages d'Erreur Contextuels

```typescript
logger.error('Erreur lors de la création du produit', {
  error,
  context: {
    storeId,
    productName,
    userId,
  },
});
```

### 3. Implémenter des Fallbacks

```typescript
const { data, error } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  // Fallback en cas d'erreur
  placeholderData: [],
});
```

### 4. Valider les Données Avant Utilisation

```typescript
if (!data || !Array.isArray(data)) {
  logger.warn('Données invalides reçues', { data });
  return [];
}
```

### 5. Gérer les États de Chargement et d'Erreur

```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

---

## 📝 Exemples

### Exemple Complet : Chargement de Produits

```typescript
import { useQueryWithErrorHandling } from '@/hooks/useQueryWithErrorHandling';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

function ProductsList() {
  const { store } = useStore();
  
  const { 
    data: products, 
    error, 
    isLoading, 
    refetch 
  } = useQueryWithErrorHandling({
    queryKey: ['products', store?.id],
    queryFn: () => fetchProducts(store.id),
    enabled: !!store,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Impossible de charger les produits.
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!products || products.length === 0) {
    return <EmptyState message="Aucun produit trouvé" />;
  }

  return <ProductsGrid products={products} />;
}
```

### Exemple : Mutation avec Gestion d'Erreur

```typescript
import { useMutationWithRetry } from '@/hooks/useMutationWithRetry';
import { useToast } from '@/hooks/use-toast';

function CreateProductForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutationWithRetry({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });
      queryClient.invalidateQueries(['products']);
      navigate(`/dashboard/products/${data.id}`);
    },
    onError: (error) => {
      // Le hook gère déjà le toast et le logging
      // Mais on peut ajouter une logique spécifique
      if (error.status === 422) {
        toast({
          title: "Erreur de validation",
          description: "Vérifiez les données du formulaire",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Formulaire */}
      <Button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Création...' : 'Créer'}
      </Button>
    </form>
  );
}
```

---

## 🔗 Ressources

- [Logger Documentation](../lib/logger.ts)
- [Error Handling Utils](../lib/error-handling.ts)
- [Hooks Documentation](../hooks/)

---

**Dernière mise à jour** : Janvier 2025

