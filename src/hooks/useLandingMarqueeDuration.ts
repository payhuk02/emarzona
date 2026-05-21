import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

/** Durées en secondes (valeurs simples, compatibles animation CSS mobile). */
export function useLandingMarqueeDuration(storeCount: number) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const count = Math.max(storeCount, 1);
  const storesSec = isMobile ? Math.max(70, count * 7) : Math.max(50, count * 4);

  return { storesSec, isMobile };
}
