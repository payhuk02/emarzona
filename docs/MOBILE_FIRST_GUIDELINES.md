# Mobile-First Design Guidelines

## 📱 Vue d'ensemble

Ce document définit les standards et bonnes pratiques pour développer une application 100% mobile-first, offrant une expérience native sur tous les appareils mobiles.

## 🎯 Principes fondamentaux

### 1. Mobile-First Approach

- **Toujours commencer par mobile** (320px - 767px)
- Puis adapter pour tablette (768px - 1023px)
- Enfin optimiser pour desktop (1024px+)

### 2. Touch-First Design

- Toutes les zones interactives ≥ 44px (WCAG 2.5.5)
- Espacement minimum de 8px entre les éléments cliquables
- Feedback visuel immédiat sur toutes les interactions

### 3. Performance First

- Optimiser pour les connexions lentes
- Lazy loading des images et composants
- Réduire les animations sur mobile

## 📐 Système de design

### Typographie Mobile-First

```css
/* Mobile (base) */
h1: 24px (1.5rem)
h2: 20px (1.25rem)
h3: 18px (1.125rem)
h4-h6: 16px (1rem)
body: 16px (1rem) - IMPORTANT: prévient le zoom iOS
small: 14px (0.875rem)

/* Tablet */
h1: 30px (1.875rem)
h2: 24px (1.5rem)
h3: 20px (1.25rem)

/* Desktop */
h1: 36px (2.25rem)
h2: 30px (1.875rem)
h3: 24px (1.5rem)
```

**Règle d'or :** Toujours utiliser `font-size: 16px` minimum pour les inputs afin d'éviter le zoom automatique sur iOS.

### Espacement Mobile-First

```css
/* Mobile */
--spacing-xs: 4px --spacing-sm: 8px --spacing-md: 12px --spacing-base: 16px --spacing-lg: 24px
  --spacing-xl: 32px /* Container padding */ Mobile: 16px Tablet: 24px Desktop: 32px;
```

### Touch Targets

- **Minimum :** 44x44px (WCAG 2.5.5)
- **Confortable :** 48x48px
- **Espacement entre cibles :** 8px minimum

```tsx
// ✅ Bon
<Button className="min-h-[44px] min-w-[44px]">Action</Button>

// ❌ Mauvais
<Button className="h-8 w-8">Action</Button>
```

## 🎨 Composants Mobile-First

### Buttons

```tsx
// Toujours inclure min-height et min-width
<Button
  className="min-h-[44px] min-w-[44px] touch-manipulation"
  size="default" // h-11 avec min-h-[44px]
>
  Action
</Button>
```

### Inputs

```tsx
// Toujours font-size: 16px pour éviter le zoom iOS
<Input
  className="min-h-[44px] text-base" // text-base = 16px
  type="text"
/>
```

### Modales / Dialogs

**Sur mobile :** Utiliser `BottomSheet` au lieu de `Dialog`

```tsx
// Mobile: BottomSheet
<BottomSheet>
  <BottomSheetTrigger>Ouvrir</BottomSheetTrigger>
  <BottomSheetContent title="Titre">
    Contenu
  </BottomSheetContent>
</BottomSheet>

// Desktop: Dialog classique
<Dialog>
  <DialogContent>
    Contenu
  </DialogContent>
</Dialog>
```

### Selects / Dropdowns

```tsx
// Toujours mobile-optimized
<Select>
  <SelectTrigger className="min-h-[44px] text-base">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>{/* Options */}</SelectContent>
</Select>
```

## 📱 Layouts Mobile-First

### Container

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">{/* Contenu */}</div>
```

### Grid System

```tsx
// Mobile: 1 colonne, Tablet: 2 colonnes, Desktop: 3 colonnes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{/* Items */}</div>
```

### Flexbox Mobile-First

```tsx
// Mobile: colonne, Desktop: ligne
<div className="flex flex-col md:flex-row gap-4">{/* Items */}</div>
```

## 🚫 À éviter

### ❌ Largeurs fixes

```tsx
// ❌ Mauvais
<div className="w-96">Content</div>

// ✅ Bon
<div className="w-full sm:w-96">Content</div>
```

### ❌ Hauteurs fixes trop petites

```tsx
// ❌ Mauvais
<Button className="h-8">Action</Button>

// ✅ Bon
<Button className="min-h-[44px] h-11">Action</Button>
```

### ❌ Font-size < 16px sur inputs

```tsx
// ❌ Mauvais - cause le zoom iOS
<Input className="text-sm" />

// ✅ Bon
<Input className="text-base" />
```

### ❌ Scroll horizontal

```tsx
// ❌ Mauvais
<div className="w-[1200px]">Content</div>

// ✅ Bon
<div className="w-full max-w-full overflow-x-hidden">Content</div>
```

## ✅ Bonnes pratiques

### 1. Safe Areas iOS

```tsx
<div className="safe-all">{/* Respecte les safe areas (notch, barre d'accueil) */}</div>
```

### 2. Touch Manipulation

```tsx
<Button className="touch-manipulation">{/* Améliore la réactivité tactile */}</Button>
```

### 3. Prevent Zoom iOS

```tsx
// Toujours utiliser text-base (16px) sur les inputs
<Input className="text-base" />
<SelectTrigger className="text-base" />
<Textarea className="text-base" />
```

### 4. Lazy Loading Images

```tsx
<img src={src} loading="lazy" className="w-full h-auto" alt="Description" />
```

### 5. Skeleton Loading

```tsx
// Afficher un skeleton pendant le chargement
{
  isLoading ? <Skeleton className="h-44 w-full" /> : <Content />;
}
```

## 🧪 Tests Mobile

### Devices à tester

- **iPhone SE (1st gen)** : 320px
- **iPhone 12/13/14** : 390px
- **iPhone 14 Pro Max** : 430px
- **Samsung Galaxy S20** : 360px
- **iPad Mini** : 768px
- **iPad Pro** : 1024px

### Scénarios de test

1. ✅ Rotation portrait/paysage
2. ✅ Zoom in/out
3. ✅ Scroll vertical/horizontal
4. ✅ Interactions tactiles rapides
5. ✅ Clavier virtuel (iOS/Android)
6. ✅ Safe areas (notch, barre d'accueil)
7. ✅ Connexion lente (3G simulation)
8. ✅ Mode sombre

## 📊 Checklist Mobile-First

Pour chaque composant/page :

- [ ] Touch targets ≥ 44px
- [ ] Font-size ≥ 16px sur inputs
- [ ] Pas de scroll horizontal
- [ ] Safe areas respectées
- [ ] Responsive sur 320px - 768px
- [ ] Images optimisées (lazy loading)
- [ ] Animations légères
- [ ] Accessibilité (ARIA, focus visible)
- [ ] Performance (Lighthouse mobile > 90)

## 🔧 Outils et ressources

### Breakpoints Tailwind

```js
screens: {
  'xs': '320px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
}
```

### Hooks utiles

- `useIsMobile()` - Détecte si on est sur mobile
- `useHapticFeedback()` - Feedback haptique
- `useSafeArea()` - Gère les safe areas

### Composants mobile-first

- `BottomSheet` - Modale mobile
- `MobileDropdown` - Menu mobile optimisé
- `MobileSelect` - Select mobile optimisé

## 📚 Références

- [WCAG 2.5.5 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
