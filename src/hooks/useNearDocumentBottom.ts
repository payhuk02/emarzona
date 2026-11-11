import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * True quand le sentinelle (bas de contenu) entre dans le viewport.
 * `observeKey` force la ré-attache après un early-return loading (ex. product.id).
 */
export function useNearDocumentBottom(observeKey: string | number | null | undefined = 'default'): {
  sentinelRef: RefObject<HTMLDivElement | null>;
  nearBottom: boolean;
} {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    setNearBottom(false);

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = sentinelRef.current;
        if (!el) {
          setNearBottom(false);
          return;
        }
        const rect = el.getBoundingClientRect();
        setNearBottom(rect.top <= window.innerHeight - 24);
      });
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [observeKey]);

  return { sentinelRef, nearBottom };
}
