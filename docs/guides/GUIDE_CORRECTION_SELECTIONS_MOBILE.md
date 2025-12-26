# 🚀 Guide de Correction Rapide - Sélections Mobile

> **Guide pratique pour corriger les problèmes critiques identifiés dans l'audit**

---

## 🔴 CORRECTION 1: Unifier la Détection Mobile

### Problème

Détection mobile incohérente avec 3 méthodes différentes.

### Solution

**Étape 1**: Créer un hook centralisé amélioré

```typescript
// src/hooks/use-mobile.tsx
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

**Étape 2**: Remplacer dans `select.tsx`

```typescript
// src/components/ui/select.tsx
import { useIsMobile } from '@/hooks/use-mobile';

const SelectContent = React.forwardRef<...>(({ className, children, position = "popper", ...props }, ref) => {
  const isMobile = useIsMobile(); // ✅ Utiliser le hook

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        // ... reste du code
      >
```

**Étape 3**: Remplacer dans `dropdown-menu.tsx`

```typescript
// src/components/ui/dropdown-menu.tsx
import { useIsMobile } from '@/hooks/use-mobile';

const DropdownMenuContent = React.forwardRef<...>(({ className, sideOffset = 4, mobileOptimized = true, ...props }, ref) => {
  const isMobile = useIsMobile(); // ✅ Utiliser le hook

  return (
    <DropdownMenuPrimitive.Portal>
      // ... reste du code
```

**Étape 4**: Remplacer dans `DropdownMenuItem`

```typescript
// src/components/ui/dropdown-menu.tsx
import { useIsMobile } from '@/hooks/use-mobile';

const DropdownMenuItem = React.forwardRef<...>(({ className, inset, onSelect, ...props }, ref) => {
  const isMobile = useIsMobile(); // ✅ Utiliser le hook

  return (
    <DropdownMenuPrimitive.Item
      // ... reste du code
```

---

## 🔴 CORRECTION 2: Nettoyer le Code Mort

### Problème

Code commenté et variables inutilisées dans `mobile-dropdown.tsx`.

### Solution

**Fichier**: `src/components/ui/mobile-dropdown.tsx`

**Supprimer** (lignes 107-111):

```typescript
// ❌ SUPPRIMER
// DÉSACTIVÉ: Ne plus utiliser le hook de verrouillage agressif
// Utiliser uniquement les props de Radix UI pour le positionnement
// const { lockStyles, isLocked } = useMobileMenu({...});
const lockStyles = undefined;
const isLocked = false;
```

**Remplacer par**:

```typescript
// ✅ Code propre
// Le positionnement est géré par Radix UI via les props
// Pas besoin de hook supplémentaire
```

---

## 🔴 CORRECTION 3: Corriger les Types TypeScript

### Problème

Props manquantes dans les interfaces TypeScript.

### Solution

**Fichier**: `src/components/ui/LanguageSwitcher.tsx`

**Avant**:

```typescript
interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  showLabel?: boolean;
  // ❌ variant manquant
}
```

**Après**:

```typescript
interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
  open?: boolean; // ✅ Pour état contrôlé
  onOpenChange?: (open: boolean) => void; // ✅ Pour état contrôlé
}
```

---

## 🟡 CORRECTION 4: Créer des Constantes Centralisées

### Solution

**Créer**: `src/constants/mobile.ts`

```typescript
/**
 * Constantes pour l'optimisation mobile
 */

// Breakpoints (cohérents avec Tailwind)
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1280;

// Touch targets (Apple/Google guidelines)
export const MIN_TOUCH_TARGET = 44; // pixels

// Spacing pour mobile
export const MOBILE_COLLISION_PADDING = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
};

export const DESKTOP_COLLISION_PADDING = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
};

// Side offsets
export const MOBILE_SIDE_OFFSET = 4;
export const DESKTOP_SIDE_OFFSET = 8;

// Délais (si nécessaire)
export const MOBILE_ANIMATION_DELAY = 0; // ms
export const DESKTOP_ANIMATION_DELAY = 0; // ms
```

**Utiliser dans les composants**:

```typescript
// src/components/ui/select.tsx
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from '@/constants/mobile';

const SelectContent = React.forwardRef<...>(({ ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <SelectPrimitive.Content
      collisionPadding={isMobile ? MOBILE_COLLISION_PADDING : DESKTOP_COLLISION_PADDING}
      // ...
    >
```

---

## 🟡 CORRECTION 5: Améliorer la Documentation

### Solution

**Ajouter JSDoc complet**:

````typescript
/**
 * Composant Select optimisé pour mobile
 *
 * @example
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choisir..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="1">Option 1</SelectItem>
 *     <SelectItem value="2">Option 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
export const Select = SelectPrimitive.Root;

/**
 * Props pour SelectTrigger
 */
interface SelectTriggerProps {
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  /**
   * Contenu du trigger (généralement SelectValue)
   */
  children: React.ReactNode;
  /**
   * Désactiver le trigger
   */
  disabled?: boolean;
}
````

---

## 🟡 CORRECTION 6: Optimiser le Changement de Langue

### Solution

**Fichier**: `src/components/ui/LanguageSwitcher.tsx`

**Avant**:

```typescript
const changeLanguage = useCallback(
  (langCode: LanguageCode) => {
    setOpen(false);

    setTimeout(
      () => {
        i18n.changeLanguage(langCode);
        localStorage.setItem('emarzona_language', langCode);
        document.documentElement.lang = langCode;
      },
      isMobile ? 100 : 50
    ); // ❌ Délai artificiel
  },
  [i18n, isMobile]
);
```

**Après**:

```typescript
const [isChanging, setIsChanging] = useState(false);

const changeLanguage = useCallback(
  (langCode: LanguageCode) => {
    if (isChanging) return; // ✅ Prévenir les doubles clics

    setIsChanging(true);
    setOpen(false);

    // ✅ Changement immédiat (pas de délai)
    i18n.changeLanguage(langCode);
    localStorage.setItem('emarzona_language', langCode);
    document.documentElement.lang = langCode;

    // ✅ Réactiver après un court délai pour le feedback
    setTimeout(() => setIsChanging(false), 100);
  },
  [i18n, isChanging]
);
```

**Utiliser dans le JSX**:

```typescript
<Button
  variant={variant}
  size="sm"
  className={cn('gap-2 touch-manipulation', buttonClassName)}
  aria-label="Change language"
  disabled={isChanging} // ✅ Désactiver pendant le changement
>
  {isChanging ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <>
      <Globe className="h-4 w-4" />
      <span className="text-lg">{currentLanguage.flag}</span>
    </>
  )}
</Button>
```

---

## ✅ Checklist de Correction

### Corrections Critiques

- [ ] Remplacer toutes les détections inline par `useIsMobile()`
- [ ] Nettoyer le code mort dans `mobile-dropdown.tsx`
- [ ] Corriger les interfaces TypeScript

### Corrections Moyennes

- [ ] Créer `src/constants/mobile.ts`
- [ ] Utiliser les constantes dans tous les composants
- [ ] Ajouter JSDoc complet
- [ ] Optimiser le changement de langue

### Tests

- [ ] Tester sur mobile réel (iOS/Android)
- [ ] Tester le changement d'orientation
- [ ] Tester avec lecteurs d'écran
- [ ] Vérifier les performances

---

## 📚 Références

- [Rapport d'audit complet](docs/audits/AUDIT_SELECTIONS_MOBILE_MAINTENABILITE.md)
- [Documentation Radix UI](https://www.radix-ui.com/primitives/docs/components/select)
- [Apple HIG - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)

---

_Guide créé le 2025-01-30_
