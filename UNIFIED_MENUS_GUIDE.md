# Guide des Menus Unifiés - Cohérence avec SelectContent

## Problème Résolu

Les menus à trois points (dropdown menus) n'avaient pas exactement les mêmes styles et comportements que les composants SelectContent, créant une expérience incohérente sur mobile et desktop.

## Solution Implémentée

### Nouveaux Composants Unifiés

Trois nouveaux composants ont été ajoutés à `src/components/ui/dropdown-menu.tsx` pour garantir la cohérence parfaite avec SelectContent :

#### 1. `UnifiedMenuContent`

- **Utilisation automatique** : `mobileVariant="sheet"` et `mobileOptimized=true`
- **Styles identiques** : Même animations, couleurs, ombres que SelectContent
- **Comportement mobile** : Bottom sheet stable sur mobile, dropdown classique sur desktop

#### 2. `UnifiedMenuItem`

- **Styles identiques** : Même padding, hauteur minimale (44px), transitions que SelectItem
- **Feedback tactile** : Optimisations tactiles identiques
- **États** : focus, active, disabled gérés de la même manière

#### 3. `UnifiedMenu`

- Alias de `DropdownMenu` pour cohérence

### Migration Recommandée

#### Avant (Incohérent) :

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger>...</DropdownMenuTrigger>
  <DropdownMenuContent>
    {' '}
    {/* Styles différents sur mobile */}
    <DropdownMenuItem>...</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

#### Après (Cohérent) :

```tsx
import {
  UnifiedMenu,
  UnifiedMenuContent,
  UnifiedMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<UnifiedMenu>
  <DropdownMenuTrigger>...</DropdownMenuTrigger>
  <UnifiedMenuContent>
    {' '}
    {/* Styles identiques à SelectContent */}
    <UnifiedMenuItem>...</UnifiedMenuItem>
  </UnifiedMenuContent>
</UnifiedMenu>;
```

### Avantages

1. **Cohérence Visuelle** : Tous les menus déroulants ont exactement les mêmes styles
2. **Expérience Mobile Unifiée** : Bottom sheets stables sur mobile pour tous les menus
3. **Performance** : Animations et transitions optimisées identiques
4. **Maintenabilité** : Un seul système de styles à maintenir

### Composants à Migrer

Les composants suivants utilisent encore l'ancien système et devraient être migrés :

- `src/components/notifications/NotificationRulesManager.tsx`
- `src/components/seo/SEOPagesList.tsx`
- `src/components/promotions/PromotionsTable.tsx`
- `src/components/pixels/PixelsTable.tsx`
- `src/components/customers/CustomersTable.tsx`

### Migration Progressive

1. Remplacer les imports :

   ```tsx
   // Avant
   import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
   } from '@/components/ui/dropdown-menu';

   // Après
   import { UnifiedMenu, UnifiedMenuContent, UnifiedMenuItem } from '@/components/ui/dropdown-menu';
   ```

2. Remplacer les composants :

   ```tsx
   // Avant
   <DropdownMenu>
     <DropdownMenuContent>

   // Après
   <UnifiedMenu>
     <UnifiedMenuContent>
   ```

3. Supprimer les props redondantes :
   ```tsx
   // Plus besoin de :
   <UnifiedMenuContent mobileVariant="sheet" mobileOptimized={true}>
   ```

### Compatibilité

Les anciens composants `DropdownMenu*` restent disponibles pour compatibilité, mais il est recommandé d'utiliser les versions `Unified*` pour tous les nouveaux développements.

### Tests

Vérifier que :

- [ ] Les menus s'ouvrent correctement sur mobile (bottom sheet)
- [ ] Les animations sont fluides
- [ ] Les styles correspondent exactement à SelectContent
- [ ] La navigation tactile fonctionne parfaitement
