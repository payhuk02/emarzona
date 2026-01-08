# 🔍 Script de Vérification Responsive

## Guide pour Vérifier Automatiquement les Pages Restantes

---

## 📋 Checklist Mobile-First

Pour chaque page, vérifier ces patterns :

### ❌ Patterns à Éviter (Non Mobile-First)

1. **Grid sans version mobile**

   ```tsx
   ❌ className="grid md:grid-cols-2"
   ✅ className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
   ```

2. **Padding fixe**

   ```tsx
   ❌ className="p-6"
   ✅ className="p-3 sm:p-4 md:p-6"
   ```

3. **Text fixe**

   ```tsx
   ❌ className="text-3xl"
   ✅ className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
   ```

4. **Header non responsive**

   ```tsx
   ❌ className="flex items-center justify-between"
   ✅ className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
   ```

5. **Gap fixe**
   ```tsx
   ❌ className="gap-4"
   ✅ className="gap-3 sm:gap-4"
   ```

---

## 🔧 Commandes de Vérification

### Rechercher les patterns problématiques

```bash
# Rechercher les grids non mobile-first
grep -r "grid.*md:grid-cols" src/pages --include="*.tsx" | grep -v "grid-cols-1"

# Rechercher les paddings fixes
grep -r "className.*p-[0-9]" src/pages --include="*.tsx" | grep -v "sm:"

# Rechercher les headers non responsive
grep -r "flex items-center justify-between" src/pages --include="*.tsx" | grep -v "flex-col"
```

---

## 📝 Template de Correction

### Avant

```tsx
<div className="container mx-auto p-6 space-y-6">
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">Titre</h1>
  </div>
  <div className="grid gap-4 md:grid-cols-4">{/* Cards */}</div>
</div>
```

### Après

```tsx
<div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
    <div>
      <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">Titre</h1>
    </div>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">{/* Cards */}</div>
</div>
```

---

## 🎯 Priorités de Vérification

### Priorité 1 : Pages avec Tables

- Vérifier l'utilisation de `MobileTableCard`
- Vérifier la responsivité des tables

### Priorité 2 : Pages avec Formulaires

- Vérifier les sections collapsibles
- Vérifier les inputs touch-friendly

### Priorité 3 : Pages avec Graphiques

- Vérifier `overflow-x-auto`
- Vérifier la taille responsive

---

**Dernière mise à jour** : 30 Janvier 2025
