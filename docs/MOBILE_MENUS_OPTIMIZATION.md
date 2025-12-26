# Optimisation des Menus Mobile - Documentation

## 📱 Vue d'ensemble

Cette documentation décrit l'optimisation complète de tous les menus (dropdowns, selects, popovers) pour une expérience mobile fluide et stable, similaire à une application native.

## 🎯 Objectifs atteints

✅ **Positionnement stable** - Les menus ne "sursautent" plus lors de l'interaction  
✅ **Scroll lock** - La page ne scroll plus quand un menu est ouvert  
✅ **Touch targets optimisés** - Tous les éléments interactifs font au moins 44px  
✅ **Z-index cohérent** - Tous les menus ont un z-index approprié (100+)  
✅ **Collision detection** - Les menus restent toujours dans les limites de l'écran  
✅ **Animations fluides** - Transitions optimisées pour mobile  
✅ **Accessibilité** - Support complet du clavier et des lecteurs d'écran

## 🏗️ Architecture

### Composants de base optimisés

#### 1. `dropdown-menu.tsx`

- Détection automatique mobile/desktop
- Positionnement intelligent selon la taille d'écran
- Collision padding adaptatif
- Animations simplifiées sur mobile

#### 2. `select.tsx`

- Viewport scrollable optimisé pour mobile
- Touch targets de 44px minimum
- Collision detection améliorée
- Animations adaptées

#### 3. `popover.tsx`

- Largeur responsive automatique
- Collision padding mobile
- Animations optimisées

### Hook personnalisé

#### `useMobileMenu`

Hook réutilisable qui gère :

- Calcul de position optimale
- Verrouillage de position avec MutationObserver
- Scroll lock sur le body
- Nettoyage automatique

**Utilisation :**

```tsx
const { lockStyles, isLocked, lockPosition, unlockPosition } = useMobileMenu({
  menuRef,
  isOpen,
  triggerRef,
  lockDelay: 150,
  collisionPadding: 8,
  zIndex: 100,
});
```

### Composant réutilisable

#### `MobileDropdown`

Composant wrapper qui encapsule toute la logique mobile :

```tsx
<MobileDropdown
  trigger={<Button>Menu</Button>}
  align="end"
  side="bottom"
  width={224}
  onOpenChange={setOpen}
>
  <DropdownMenuItem>Option 1</DropdownMenuItem>
  <DropdownMenuItem>Option 2</DropdownMenuItem>
</MobileDropdown>
```

**Props :**

- `trigger` - Élément qui ouvre le menu
- `children` - Contenu du menu
- `align` - Alignement ('start' | 'center' | 'end')
- `side` - Côté d'ouverture ('top' | 'right' | 'bottom' | 'left')
- `sideOffset` - Distance depuis le trigger (défaut: 4)
- `width` - Largeur du menu (string ou number)
- `disableMobileOptimization` - Désactiver l'optimisation mobile
- `onOpenChange` - Callback d'ouverture/fermeture
- `open` - État contrôlé
- `modal` - Mode modal

## 📝 Guide d'utilisation

### Pour les nouveaux menus

**Option 1 : Utiliser MobileDropdown (recommandé)**

```tsx
import { MobileDropdown, DropdownMenuItem } from '@/components/ui/mobile-dropdown';

<MobileDropdown trigger={<Button>Menu</Button>} align="end" width={200}>
  <DropdownMenuItem>Option 1</DropdownMenuItem>
  <DropdownMenuItem>Option 2</DropdownMenuItem>
</MobileDropdown>;
```

**Option 2 : Utiliser les composants de base (déjà optimisés)**

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" mobileOptimized>
    <DropdownMenuItem>Option 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

### Pour les Select

Les composants Select sont automatiquement optimisés :

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choisir..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>;
```

### Pour les Popovers

Les composants Popover sont automatiquement optimisés :

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button>Ouvrir</Button>
  </PopoverTrigger>
  <PopoverContent>Contenu du popover</PopoverContent>
</Popover>;
```

## 🔧 Optimisations techniques

### Positionnement

1. **Détection mobile** : Utilise `window.innerWidth < 768px` pour détecter mobile
2. **Calcul de position** : Prend en compte le trigger et les limites de l'écran
3. **Verrouillage** : Utilise `position: fixed` avec MutationObserver pour maintenir la position
4. **Collision padding** : 8px minimum de chaque côté

### Scroll Lock

- Le body est verrouillé (`overflow: hidden`) quand un menu est ouvert sur mobile
- Restauration automatique à la fermeture

### Touch Targets

- Tous les éléments interactifs ont `min-h-[44px]`
- Classe `touch-manipulation` pour améliorer la réactivité
- Support `active:` pour le feedback visuel

### Z-index

- Menus : `z-[100]` ou `z-[1060]` selon le contexte
- Assure que les menus sont toujours au-dessus

### Animations

- **Mobile** : Animations simplifiées (fade in/out uniquement)
- **Desktop** : Animations complètes (zoom, slide)

## 📊 Composants migrés

### ✅ Composants optimisés

1. **LanguageSwitcher** - Simplifié avec MobileDropdown
2. **TopNavigationBar** - Menu utilisateur optimisé
3. **dropdown-menu.tsx** - Base optimisée
4. **select.tsx** - Base optimisée
5. **popover.tsx** - Base optimisée

### 🔄 Composants à migrer (optionnel)

Les composants suivants utilisent déjà les composants de base optimisés, donc ils bénéficient automatiquement des améliorations :

- `ProductFiltersDashboard`
- `MarketplaceFilters`
- `OrderFilters`
- `PaymentFilters`
- `CurrencySelect`
- Tous les autres composants utilisant Select/DropdownMenu/Popover

## 🧪 Tests recommandés

### Scénarios de test mobile

1. **Ouverture rapide/fermeture rapide**
   - Ouvrir et fermer rapidement plusieurs fois
   - Vérifier qu'il n'y a pas de double-activation

2. **Menu dans un scroll container**
   - Tester dans une page avec scroll
   - Vérifier que le scroll est verrouillé quand le menu est ouvert

3. **Menu proche du bas de l'écran**
   - Tester avec un trigger en bas de page
   - Vérifier que le menu s'affiche au-dessus si nécessaire

4. **Rotation mobile**
   - Tester en rotation portrait/paysage
   - Vérifier que le menu se repositionne correctement

5. **Mode sombre**
   - Tester avec le thème sombre activé
   - Vérifier la visibilité et les contrastes

6. **iOS Safari + Android Chrome**
   - Tester sur les deux plateformes
   - Vérifier le comportement spécifique à chaque navigateur

## 🐛 Dépannage

### Le menu "sursaute" encore

1. Vérifier que `mobileOptimized` est activé (ou utiliser `MobileDropdown`)
2. Vérifier que le `lockDelay` est suffisant (150ms par défaut)
3. Vérifier qu'il n'y a pas de CSS externe qui override les styles

### Le menu sort de l'écran

1. Vérifier que `collisionPadding` est défini (8px par défaut)
2. Vérifier que `avoidCollisions` est activé sur desktop
3. Vérifier la largeur du menu (ne pas dépasser `calc(100vw - 2rem)`)

### Le scroll n'est pas verrouillé

1. Vérifier que le hook `useMobileMenu` est utilisé
2. Vérifier qu'il n'y a pas d'autres composants qui modifient `body.style.overflow`
3. Vérifier que `isMobile` retourne `true`

### Les animations sont saccadées

1. Vérifier que les animations sont simplifiées sur mobile
2. Vérifier que `will-change` n'est pas utilisé de manière excessive
3. Vérifier la performance avec les DevTools

## 📚 Références

- [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select)
- [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## 🚀 Prochaines étapes

1. Migrer progressivement les composants existants vers `MobileDropdown` si nécessaire
2. Ajouter des tests E2E pour les menus sur mobile
3. Monitorer les performances et ajuster si nécessaire
4. Collecter les retours utilisateurs pour améliorer l'expérience
