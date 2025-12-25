# 🔄 Guide de Migration - Payhula

**Dernière mise à jour** : Janvier 2025

---

## 📋 Table des Matières

1. [Migration des Imports d'Icônes](#migration-des-imports-dicônes)
2. [Migration vers Lazy Loading](#migration-vers-lazy-loading)
3. [Migration des Tests](#migration-des-tests)
4. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🎨 Migration des Imports d'Icônes

### Avant

```typescript
import { ShoppingCart, Package, Users } from 'lucide-react';
```

### Après

```typescript
import { ShoppingCart, Package, Users } from '@/components/icons';
```

### Script de Migration Automatique

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrate-icon-imports.ps1
```

---

## 📦 Migration vers Lazy Loading

### jspdf et jspdf-autotable

#### Avant

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generatePDF() {
  const doc = new jsPDF();
  autoTable(doc, { /* ... */ });
}
```

#### Après

```typescript
import { loadPDFModules } from '@/lib/pdf-loader';

export async function generatePDF() {
  const { jsPDF, autoTable } = await loadPDFModules();
  const doc = new jsPDF();
  autoTable(doc, { /* ... */ });
}
```

### html2canvas

#### Avant

```typescript
import html2canvas from 'html2canvas';

export async function captureElement() {
  const canvas = await html2canvas(element);
}
```

#### Après

```typescript
import { loadHtml2Canvas } from '@/lib/canvas-loader';

export async function captureElement() {
  const html2canvas = await loadHtml2Canvas();
  const canvas = await html2canvas(element);
}
```

---

## 🧪 Migration des Tests

### Fichiers de Test avec JSX

Les fichiers de test qui utilisent JSX doivent avoir l'extension `.tsx` :

```typescript
// ✅ Bon : useComponent.test.tsx
import React from 'react';
import { render } from '@testing-library/react';

// ❌ Mauvais : useComponent.test.ts (ne supporte pas JSX)
```

### Structure Recommandée

```
src/
├── components/
│   └── __tests__/
│       └── Component.test.tsx
├── hooks/
│   └── __tests__/
│       └── useHook.test.tsx
└── contexts/
    └── __tests__/
        └── Context.test.tsx
```

---

## ✅ Bonnes Pratiques

### 1. Toujours Utiliser l'Index Centralisé pour les Icônes

```typescript
// ✅ Bon
import { ShoppingCart, Package } from '@/components/icons';

// ❌ Mauvais
import { ShoppingCart, Package } from 'lucide-react';
```

### 2. Lazy Load les Dépendances Lourdes

```typescript
// ✅ Bon - Charger seulement quand nécessaire
const { jsPDF } = await loadPDFModules();

// ❌ Mauvais - Chargé au démarrage
import jsPDF from 'jspdf';
```

### 3. Utiliser OptimizedImg pour les Images

```typescript
// ✅ Bon
import { OptimizedImg } from '@/components/shared/OptimizedImg';
<OptimizedImg src="/image.jpg" alt="Description" />

// ❌ Mauvais
<img src="/image.jpg" alt="Description" />
```

### 4. Tests avec JSX en .tsx

```typescript
// ✅ Bon
// useComponent.test.tsx
import React from 'react';

// ❌ Mauvais
// useComponent.test.ts (ne supporte pas JSX)
```

---

## 🔧 Checklist de Migration

### Pour un Nouveau Composant

- [ ] Imports d'icônes depuis `@/components/icons`
- [ ] Images avec `OptimizedImg` ou `loading="lazy"`
- [ ] Dépendances lourdes en lazy loading
- [ ] Tests en `.tsx` si JSX nécessaire

### Pour un Composant Existant

- [ ] Migrer les imports d'icônes
- [ ] Remplacer les imports jspdf/html2canvas
- [ ] Ajouter lazy loading sur les images
- [ ] Renommer les tests en `.tsx` si nécessaire

---

## 📝 Exemples Complets

### Exemple 1 : Composant avec Export PDF

```typescript
import { Button } from '@/components/ui/button';
import { Download } from '@/components/icons';
import { loadPDFModules } from '@/lib/pdf-loader';
import { useToast } from '@/hooks/use-toast';

export function ExportButton() {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const { jsPDF, autoTable } = await loadPDFModules();
      const doc = new jsPDF();
      
      // Générer le PDF
      autoTable(doc, { /* ... */ });
      
      doc.save('export.pdf');
      toast({ title: 'Export réussi' });
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'exporter le PDF',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Exporter PDF
    </Button>
  );
}
```

### Exemple 2 : Composant avec Image

```typescript
import { OptimizedImg } from '@/components/shared/OptimizedImg';

export function ProductCard({ image, name }) {
  return (
    <div>
      <OptimizedImg 
        src={image} 
        alt={name}
        priority={false} // lazy par défaut
      />
      <h3>{name}</h3>
    </div>
  );
}
```

---

## 🔗 Ressources

- [Guide Optimisation Icônes](./icon-optimization-guide.md)
- [Guide Optimisation Bundle](./bundle-optimization-guide.md)
- [Guide des Tests](./testing-guide.md)

---

**Dernière mise à jour** : Janvier 2025

