/**
 * Dynamic Imports Utility - Enterprise-grade lazy loading
 * Centralizes dynamic imports for heavy dependencies to reduce initial bundle size
 * Only loads dependencies when actually needed
 */

import { lazy, ComponentType, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Generic skeleton for loading states
const LoadingSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
);

/**
 * HOC for creating lazy-loaded components with skeleton fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackHeight?: number
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingSkeleton height={fallbackHeight} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Three.js dynamic imports - Only load on 3D/artist pages
 */
export const LazyThreeCanvas = createLazyComponent(
  () => import('@react-three/fiber').then(m => ({ default: m.Canvas })),
  400
);

export const LazyThreeOrbitControls = createLazyComponent(
  () => import('@react-three/drei').then(m => ({ default: m.OrbitControls })),
  300
);

export const LazyThreeGLTFLoader = createLazyComponent(
  () => import('@react-three/drei').then(m => ({ default: m.GLTFLoader })),
  300
);

/**
 * TipTap Editor dynamic imports - Only load on content editing pages
 */
export const LazyTipTapEditor = createLazyComponent(
  () => import('@tiptap/react').then(m => ({ default: m.Editor })),
  400
);

export const LazyTipTapExtensions = createLazyComponent(
  () => import('@/components/editor/TipTapExtensions').then(m => ({ default: m.default })),
  300
);

/**
 * Framer Motion dynamic imports - Only load when animations are needed
 */
export const LazyMotion = createLazyComponent(
  () => import('framer-motion').then(m => ({ default: m.motion })),
  300
);

export const LazyAnimatePresence = createLazyComponent(
  () => import('framer-motion').then(m => ({ default: m.AnimatePresence })),
  200
);

export const LazyUseAnimation = createLazyComponent(
  () => import('framer-motion').then(m => ({ default: m.useAnimation })),
  200
);

/**
 * PDF Generation dynamic imports - Only load on export pages
 */
export const LazyJsPDF = createLazyComponent(
  () => import('jspdf').then(m => ({ default: m.default })),
  300
);

export const LazyJsPDFAutoTable = createLazyComponent(
  () => import('jspdf-autotable').then(m => ({ default: m.default })),
  300
);

/**
 * QR Code dynamic imports - Only load on QR generation pages
 */
export const LazyQRCode = createLazyComponent(
  () => import('qrcode').then(m => ({ default: m.default })),
  200
);

export const LazyHTML5QRCode = createLazyComponent(
  () => import('html5-qrcode').then(m => ({ default: m.Html5Qrcode })),
  300
);

/**
 * Canvas/Image processing dynamic imports - Only load on image editing pages
 */
export const LazyHtml2Canvas = createLazyComponent(
  () => import('html2canvas').then(m => ({ default: m.default })),
  400
);

/**
 * Data processing dynamic imports - Only load on data export/import pages
 */
export const LazyPapaParse = createLazyComponent(
  () => import('papaparse').then(m => ({ default: m.default })),
  300
);

export const LazyXLSX = createLazyComponent(
  () => import('xlsx').then(m => ({ default: m.default })),
  400
);

/**
 * Barcode scanner dynamic imports - Only load on physical inventory pages
 */
export const LazyHtml5QrcodeScanner = createLazyComponent(
  () => import('html5-qrcode').then(m => ({ default: m.Html5QrcodeScanner })),
  400
);

/**
 * Calendar advanced features dynamic imports - Only load on calendar pages
 */
export const LazyBigCalendar = createLazyComponent(
  () => import('react-big-calendar').then(m => ({ default: m.Calendar })),
  500
);

/**
 * Hook to preload a dependency in advance
 * Useful for preloading dependencies when user is likely to need them
 */
export function usePreloadDependency(importFn: () => Promise<any>) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    importFn()
      .then(() => setIsLoaded(true))
      .catch(setError);
  }, [importFn]);

  return { isLoaded, error };
}

/**
 * Preload multiple dependencies in parallel
 */
export async function preloadDependencies(
  importFns: Array<() => Promise<any>>
): Promise<void> {
  try {
    await Promise.all(importFns.map(fn => fn()));
  } catch (error) {
    console.error('Failed to preload dependencies:', error);
  }
}

/**
 * Dynamic import hook with retry logic
 */
export function useDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  options?: { retries?: number; delay?: number }
) {
  const [component, setComponent] = React.useState<ComponentType<T> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const { retries = 3, delay = 1000 } = options || {};

  React.useEffect(() => {
    let mounted = true;
    let attempt = 0;

    const loadComponent = async () => {
      try {
        const module = await importFn();
        if (mounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      } catch (err) {
        attempt++;
        if (attempt < retries && mounted) {
          setTimeout(loadComponent, delay * attempt);
        } else if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [importFn, retries, delay]);

  return { component, loading, error };
}
