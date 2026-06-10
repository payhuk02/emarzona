import { type ReactNode, useEffect, useRef, useState } from 'react';

type LandingDeferredSectionProps = {
  children: ReactNode;
  /** Hauteur minimale du placeholder pour limiter le CLS */
  minHeight?: string;
  rootMargin?: string;
};

/**
 * Monte la section uniquement quand elle entre (ou approche) le viewport.
 * Réduit le JS initial et le travail de rendu below-the-fold.
 */
export function LandingDeferredSection({
  children,
  minHeight = '12rem',
  rootMargin = '280px 0px',
}: LandingDeferredSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <section ref={ref} className="lp-deferred-section" style={!visible ? { minHeight } : undefined}>
      {visible ? children : null}
    </section>
  );
}
