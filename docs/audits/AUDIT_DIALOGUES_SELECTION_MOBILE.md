# Audit Complet des Dialogues de Sélection sur Mobile

**Date**: 2025-01-04  
**Objectif**: Identifier et corriger les problèmes de positionnement des dialogues de sélection sur mobile

## 🔍 Problème Identifié

Les dialogues de sélection (DropdownMenu, Select, Popover) se repositionnent de manière inattendue sur mobile lors des interactions, notamment :
- Le menu "saute" vers le coin gauche en haut de l'écran
- Impossible de sélectionner un élément car le menu bouge pendant le clic
- Problème particulièrement visible lors du changement de langue

## 📊 Composants Affectés

### 1. DropdownMenu (53 fichiers identifiés)
- `src/components/ui/LanguageSwitcher.tsx` ✅ **CORRIGÉ**
- `src/components/layout/TopNavigationBar.tsx` - Menu utilisateur
- `src/components/products/ProductCardDashboard.tsx` - Actions produits
- `src/components/orders/OrdersTable.tsx` - Actions commandes
- Et 49 autres fichiers...

### 2. Select (257 fichiers identifiés)
- Tous les formulaires avec sélecteurs
- Filtres de tableaux
- Sélecteurs de configuration

### 3. Popover (14 fichiers identifiés)
- Tooltips avancés
- Calendriers
- Date pickers

## ✅ Solution Implémentée

### Hook Réutilisable: `useStableDropdownPosition`

**Fichier**: `src/hooks/use-stable-dropdown-position.tsx`

**Fonctionnalités**:
- Détecte automatiquement si on est sur mobile
- Capture la position initiale du menu une fois positionné par Radix UI
- Surveille les changements de position avec MutationObserver
- Restaure automatiquement la position si elle change

**Usage**:
```tsx
import { useStableDropdownPosition } from '@/hooks/use-stable-dropdown-position';

const MyComponent = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Stabiliser la position sur mobile
  useStableDropdownPosition({
    open,
    menuRef,
    lockDelay: 50, // Délai avant verrouillage (optionnel)
  });
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>...</DropdownMenuTrigger>
      <DropdownMenuContent ref={menuRef}>
        ...
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

## 🔧 Composants Corrigés

### ✅ LanguageSwitcher
- **Fichier**: `src/components/ui/LanguageSwitcher.tsx`
- **Status**: Corrigé avec le hook `useStableDropdownPosition`
- **Test**: À valider sur mobile

## 📋 Composants à Corriger (Priorité)

### Priorité HAUTE
1. **TopNavigationBar** - Menu utilisateur (utilisé partout)
   - Fichier: `src/components/layout/TopNavigationBar.tsx`
   - Impact: Menu utilisateur inaccessible sur mobile

2. **ProductCardDashboard** - Actions produits
   - Fichier: `src/components/products/ProductCardDashboard.tsx`
   - Impact: Actions sur produits difficiles à utiliser

3. **OrdersTable** - Actions commandes
   - Fichier: `src/components/orders/OrdersTable.tsx`
   - Impact: Gestion des commandes compromise

### Priorité MOYENNE
4. Tous les composants avec `DropdownMenu` dans les tableaux
5. Tous les composants avec `Select` dans les formulaires mobiles

### Priorité BASSE
6. Composants `Popover` (moins critiques)

## 🛠️ Guide d'Application

### Étape 1: Identifier le composant
Chercher les patterns suivants:
```tsx
const [open, setOpen] = useState(false);
<DropdownMenu open={open} onOpenChange={setOpen}>
  <DropdownMenuContent>
```

### Étape 2: Ajouter le hook
```tsx
import { useStableDropdownPosition } from '@/hooks/use-stable-dropdown-position';

// Dans le composant
const menuRef = useRef<HTMLDivElement>(null);
useStableDropdownPosition({ open, menuRef });
```

### Étape 3: Passer la ref
```tsx
<DropdownMenuContent ref={menuRef}>
```

### Étape 4: Tester sur mobile
- Ouvrir le menu
- Essayer de sélectionner un élément
- Vérifier que le menu ne bouge pas

## 📝 Notes Techniques

### Pourquoi le problème se produit?
1. Radix UI repositionne automatiquement les menus lors des changements DOM
2. Le changement de langue cause un re-render qui déclenche le repositionnement
3. Sur mobile, les calculs de position sont moins stables

### Comment la solution fonctionne?
1. Capture la position initiale après que Radix UI l'a positionné
2. Surveille les changements avec MutationObserver
3. Restaure la position si elle change de plus de 1px
4. Utilise `position: fixed` pour verrouiller la position

### Limitations
- Nécessite une ref vers le menu
- Fonctionne uniquement sur mobile (détecté automatiquement)
- Peut nécessiter un ajustement du `lockDelay` selon le composant

## 🧪 Tests à Effectuer

1. **LanguageSwitcher**
   - [ ] Ouvrir le menu sur mobile
   - [ ] Sélectionner une langue
   - [ ] Vérifier que le menu ne bouge pas
   - [ ] Vérifier que la sélection fonctionne

2. **TopNavigationBar**
   - [ ] Ouvrir le menu utilisateur
   - [ ] Naviguer dans les options
   - [ ] Vérifier la stabilité

3. **Autres composants**
   - [ ] Tester chaque composant corrigé individuellement
   - [ ] Vérifier qu'il n'y a pas de régression

## 📈 Prochaines Étapes

1. ✅ Créer le hook réutilisable
2. ✅ Corriger LanguageSwitcher
3. ⏳ Corriger TopNavigationBar
4. ⏳ Corriger ProductCardDashboard
5. ⏳ Corriger OrdersTable
6. ⏳ Créer un script pour identifier automatiquement les composants à corriger
7. ⏳ Documenter les bonnes pratiques

## 🔗 Références

- Hook: `src/hooks/use-stable-dropdown-position.tsx`
- Composant corrigé: `src/components/ui/LanguageSwitcher.tsx`
- Documentation Radix UI: https://www.radix-ui.com/primitives/docs/components/dropdown-menu






