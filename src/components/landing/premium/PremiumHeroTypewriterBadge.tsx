import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const TYPING_MS = 28;
const DELETING_MS = 16;
const PAUSE_FULL_MS = 2600;
const PAUSE_EMPTY_MS = 700;

export function PremiumHeroTypewriterBadge() {
  const { t } = useLandingPremiumT();
  const reducedMotion = useReducedMotion();
  const fullText = t('hero.typewriterBadge');
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(fullText);
      return;
    }

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
  }, [displayed, fullText, isDeleting, reducedMotion]);

  return (
    <p
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
