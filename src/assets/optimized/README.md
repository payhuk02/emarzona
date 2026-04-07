# 📁 Images Optimisées

Ce répertoire contient les versions optimisées des images du projet.

## 📋 Structure

```
optimized/
├── testimonial-1.webp          # Version WebP originale
├── testimonial-1.avif          # Version AVIF originale
├── testimonial-1-320w.webp     # Version responsive 320px
├── testimonial-1-640w.webp     # Version responsive 640px
├── testimonial-1-768w.webp     # Version responsive 768px
├── testimonial-1-1024w.webp    # Version responsive 1024px
├── testimonial-1-1280w.webp    # Version responsive 1280px
└── testimonial-1-1920w.webp    # Version responsive 1920px
```

## 🚀 Utilisation

### Dans les Composants

Utilisez le hook `useOptimizedImage` ou les utilitaires de `image-optimizer.ts` :

```typescript
import { useOptimizedImage } from '@/utils/image-optimizer';
import testimonial1 from '@/assets/testimonial-1.jpg';

function MyComponent() {
  const { src, srcSet, fallback } = useOptimizedImage(testimonial1, {
    format: 'auto', // 'webp' | 'avif' | 'auto'
    responsive: true,
  });

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      alt="Testimonial"
      loading="lazy"
    />
  );
}
```

### Avec OptimizedImage Component

Le composant `OptimizedImage` détecte automatiquement les formats optimisés :

```typescript
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import testimonial1 from '@/assets/testimonial-1.jpg';

<OptimizedImage
  src={testimonial1}
  alt="Testimonial"
  width={640}
  height={480}
  format="auto"
  priority={false}
/>
```

## 🔄 Régénération

Pour régénérer les images optimisées :

```bash
npm run optimize:images
```

Ou directement :

```bash
node scripts/optimize-images.js
```

## 📊 Formats Supportés

- **WebP** : Supporté par tous les navigateurs modernes (95%+)
- **AVIF** : Meilleure compression mais moins supporté (85%+)
- **Fallback** : JPG/PNG original si les formats modernes ne sont pas supportés

## ⚠️ Note

Les images optimisées sont générées automatiquement et ne doivent **pas** être modifiées manuellement.

Pour modifier une image :

1. Modifier l'image originale dans `src/assets/`
2. Régénérer les versions optimisées avec `npm run optimize:images`
