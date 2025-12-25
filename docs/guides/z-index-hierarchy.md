# Hiérarchie Z-Index - Plateforme Emarzona

**Date**: 4 décembre 2025  
**Objectif**: Documenter la hiérarchie des z-index pour éviter les conflits et assurer un rendu correct des overlays, modals, et éléments de navigation.

---

## 📋 Vue d'Ensemble

La plateforme utilise une hiérarchie de z-index cohérente pour gérer les différents niveaux de superposition des éléments UI.

### Règle Générale
- **Plus le z-index est élevé, plus l'élément est au-dessus**
- **Les z-index sont organisés par tranches de 10** pour faciliter l'ajout d'éléments intermédiaires
- **Les valeurs sont documentées ici pour référence**

---

## 🎯 Hiérarchie Complète

### Niveau 0-50 : Éléments de Base
```
z-0    → Éléments de base (contenu principal)
z-10   → Éléments légèrement au-dessus (cards, etc.)
z-20   → Éléments interactifs de base
z-30   → Sidebar desktop (fixed)
z-40   → Sidebar contextuelle desktop
z-50   → Top navigation bar
```

**Fichiers concernés**:
- `src/components/layout/TopNavigationBar.tsx`: `z-50`
- `src/components/layout/BaseContextSidebar.tsx`: `z-40` (desktop sidebar)
- `src/components/AppSidebar.tsx`: `z-30` (via Sidebar component)

---

### Niveau 60-100 : Navigation Mobile
```
z-60   → Hamburger button (mobile)
z-70   → Mobile menu drawer
z-80   → Mobile bottom navigation (si applicable)
z-100  → Navigation mobile principale
```

**Fichiers concernés**:
- `src/components/layout/BaseContextSidebar.tsx`: `z-[60]` (hamburger)
- `src/components/ui/MobileBottomNav.tsx`: `z-50` (peut être augmenté si nécessaire)
- `src/components/layout/TopNavigationBar.tsx`: Mobile menu drawer

---

### Niveau 100-1000 : Overlays et Modals
```
z-[100] → Navigation mobile sticky
z-[110] → Bottom navigation contextuelle (mobile)
z-[1040] → Dialog/AlertDialog Overlay
z-[1050] → Dialog/AlertDialog Content
z-[1060] → Sheet Overlay
z-[1070] → Sheet Content
z-[1080] → Popover
z-[1090] → Tooltip
z-[1100] → Dropdown Menu
z-[1200] → Toast notifications (Sonner)
```

**Fichiers concernés**:
- `src/components/ui/dialog.tsx`: 
  - Overlay: `z-[1040]`
  - Content: `z-[1050]`
- `src/components/ui/alert-dialog.tsx`:
  - Overlay: `z-[1040]`
  - Content: `z-[1050]`
- `src/components/ui/sheet.tsx`:
  - Overlay: `z-50` (par défaut Radix)
  - Content: `z-50` (par défaut Radix)
- `src/components/layout/BaseContextSidebar.tsx`: 
  - Bottom nav: `z-[110]`
- `src/components/ui/toast.tsx`: `z-[1200]` (Sonner)

---

### Niveau 1000+ : Éléments Critiques
```
z-[9999] → Loading bar (top)
z-[10000] → Error boundaries (si nécessaire)
```

**Fichiers concernés**:
- `src/components/navigation/LoadingBar.tsx`: `z-[9999]`

---

## 📐 Règles d'Utilisation

### ✅ Bonnes Pratiques

1. **Utiliser les valeurs documentées**
   - Ne pas créer de nouvelles valeurs sans les documenter ici
   - Utiliser les valeurs existantes quand possible

2. **Respecter la hiérarchie**
   - Un modal doit toujours être au-dessus de son overlay
   - La navigation mobile doit être au-dessus du contenu mais sous les modals

3. **Utiliser des tranches de 10**
   - Facilite l'ajout d'éléments intermédiaires
   - Exemple: `z-[1050]` pour Dialog, `z-[1060]` pour Sheet si nécessaire

4. **Documenter les exceptions**
   - Si une valeur spéciale est nécessaire, la documenter ici

---

### ❌ À Éviter

1. **Ne pas utiliser de valeurs arbitraires**
   - Éviter `z-[1234]` sans raison
   - Préférer les valeurs documentées

2. **Ne pas créer de conflits**
   - Vérifier qu'un nouvel élément n'entre pas en conflit avec un élément existant

3. **Ne pas utiliser `z-index` pour le layout**
   - Utiliser `z-index` uniquement pour les overlays et modals
   - Pour le layout, utiliser flexbox/grid

---

## 🔍 Cas d'Usage Spécifiques

### Dialog sur Mobile
```
Overlay: z-[1040]
Content: z-[1050]
```
Le Dialog est au-dessus de tout sauf les toasts.

### Navigation Mobile
```
Hamburger: z-[60]
Bottom nav: z-[110]
```
La bottom nav est au-dessus du hamburger pour être accessible.

### Sidebar Desktop
```
AppSidebar: z-30 (via Sidebar component)
ContextSidebar: z-40
TopNav: z-50
```
La TopNav est au-dessus des sidebars.

---

## 🛠️ Comment Ajouter un Nouvel Élément

1. **Identifier le niveau approprié**
   - Navigation? → 60-100
   - Modal/Overlay? → 1000-1100
   - Toast/Notification? → 1200+

2. **Choisir une valeur disponible**
   - Vérifier qu'elle n'est pas déjà utilisée
   - Utiliser une tranche de 10

3. **Documenter ici**
   - Ajouter l'élément dans la hiérarchie
   - Indiquer le fichier concerné

4. **Utiliser dans le code**
   ```tsx
   className="z-[1050]" // Documenté dans z-index-hierarchy.md
   ```

---

## 📝 Changelog

### 4 décembre 2025
- Documentation initiale créée
- Hiérarchie complète documentée
- Règles d'utilisation définies

---

## 🔗 Références

- [MDN: z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)
- [Radix UI: Portal](https://www.radix-ui.com/primitives/docs/components/portal)
- [Tailwind CSS: z-index](https://tailwindcss.com/docs/z-index)

---

**Maintenu par**: Équipe de développement Emarzona  
**Dernière mise à jour**: 4 décembre 2025

