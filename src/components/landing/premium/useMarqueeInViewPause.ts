import { useEffect, useRef, useState } from 'react';

/**
 * Pause les animations marquee CSS hors viewport (et si prefers-reduced-motion).
 * Un seul observer par section.
 */
export function useMarqueeInViewPause<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setPaused(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting);
      },
      { rootMargin: '80px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, pauseClass: paused ? 'is-paused' : '' };
}
