import { useEffect, useRef, useState } from 'react';

/**
 * Reveal premium au scroll.
 * Robuste pour sections différées (IntersectionObserver + check immédiat + filet 600ms).
 */
export function usePremiumReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.08) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setVisible(true);
      return;
    }

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setVisible(true);
    };

    // Déjà proche du viewport (ex. section montée via LandingDeferredSection)
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '100px 0px 40px 0px' }
    );

    observer.observe(el);
    const fallback = window.setTimeout(reveal, 600);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [threshold]);

  return { ref, visible, className: visible ? 'is-visible' : '' };
}
