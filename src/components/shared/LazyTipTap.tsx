/**
 * LazyTipTap - Wrapper pour le lazy loading de TipTap
 * Optimise les performances en chargeant TipTap uniquement quand nécessaire
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Composant de chargement pour TipTap
const TipTapLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[200px] w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Export lazy de TipTap React
 * Utilisez ceci au lieu d'importer directement @tiptap/react
 */
export const LazyTipTapReact = lazy(() =>
  import('@tiptap/react').then(module => ({
    default: module.EditorContent,
    useEditor: module.useEditor,
  }))
);

/**
 * Export lazy des extensions TipTap
 */
export const LazyTipTapExtensions = lazy(async () => {
  const [starterKit, underline, textAlign, link, textStyle, color] = await Promise.all([
    import('@tiptap/starter-kit'),
    import('@tiptap/extension-underline'),
    import('@tiptap/extension-text-align'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-text-style'),
    import('@tiptap/extension-color'),
  ]);

  return {
    StarterKit: starterKit.default,
    Underline: underline.default,
    TextAlign: textAlign.default,
    Link: link.default,
    TextStyle: textStyle.default,
    Color: color.default,
  };
});

/**
 * Wrapper pour les composants utilisant TipTap
 */
export function withLazyTipTap<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  return function LazyTipTapWrapper(props: P) {
    return (
      <Suspense fallback={<TipTapLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
