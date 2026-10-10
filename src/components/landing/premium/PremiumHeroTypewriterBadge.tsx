import { useEffect, useRef, useState } from 'react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const TYPING_MS = 36;
const DELETING_MS = 22;
const PAUSE_FULL_MS = 2800;
const PAUSE_EMPTY_MS = 800;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function PremiumHeroTypewriterBadge() {
  const { t } = useLandingPremiumT();
  const reducedMotion = usePrefersReducedMotion();
  const fullText = t('hero.typewriterBadge');
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        setInView(entries.some(e => e.isIntersecting));
      },
      { rootMargin: '40px', threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(fullText);
      return;
    }
    if (!inView || document.hidden) return;

    let timeout: number;

    if (!isDeleting && displayed.length < fullText.length) {
      timeout = window.setTimeout(() => {
        setDisplayed(fullText.slice(0, displayed.length + 1));
      }, TYPING_MS);
    } else if (!isDeleting && displayed.length === fullText.length) {
      timeout = window.setTimeout(() => setIsDeleting(true), PAUSE_FULL_MS);
    } else if (isDeleting && displayed.length > 0) {
      timeout = window.setTimeout(() => {
        setDisplayed(fullText.slice(0, displayed.length - 1));
      }, DELETING_MS);
    } else {
      timeout = window.setTimeout(() => setIsDeleting(false), PAUSE_EMPTY_MS);
    }

    return () => window.clearTimeout(timeout);
  }, [displayed, fullText, inView, isDeleting, reducedMotion]);

  return (
    <p
      ref={rootRef}
      className="lp-hero-typewriter-badge mb-5 w-full self-center lg:self-start"
      aria-live="polite"
    >
      <span className="lp-hero-typewriter-badge__ghost" aria-hidden>
        {fullText}
      </span>
      <span className="lp-hero-typewriter-badge__live">
        {displayed}
        {!reducedMotion && <span className="lp-hero-typewriter-badge__cursor" aria-hidden />}
      </span>
      <span className="sr-only">{fullText}</span>
    </p>
  );
}
