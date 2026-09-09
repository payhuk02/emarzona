import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shouldShowBottomNavigation } from '@/config/navigation.horizontal';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function getScrollTop(): number {
  const main = document.getElementById('main-content');
  if (main instanceof HTMLElement && main.scrollHeight > main.clientHeight) {
    return main.scrollTop;
  }
  return window.scrollY || document.documentElement.scrollTop;
}

function scrollToTopSmooth(): void {
  const main = document.getElementById('main-content');
  if (main instanceof HTMLElement && main.scrollHeight > main.clientHeight) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const liftForBottomNav = isMobile && shouldShowBottomNavigation(location.pathname);

  useEffect(() => {
    const toggleVisible = () => {
      setVisible(getScrollTop() > 300);
    };

    toggleVisible();
    const main = document.getElementById('main-content');
    window.addEventListener('scroll', toggleVisible, { passive: true });
    main?.addEventListener('scroll', toggleVisible, { passive: true });
    return () => {
      window.removeEventListener('scroll', toggleVisible);
      main?.removeEventListener('scroll', toggleVisible);
    };
  }, [location.pathname]);

  return (
    <Button
      onClick={scrollToTopSmooth}
      size="icon"
      className={cn(
        'fixed right-4 sm:right-6 z-50 h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-large hover:shadow-glow transition-all duration-300 touch-manipulation',
        liftForBottomNav ? 'bottom-20 sm:bottom-6' : 'bottom-4 sm:bottom-6',
        visible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-16 opacity-0 scale-0 pointer-events-none'
      )}
      aria-label="Retour en haut de la page"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      <span className="sr-only">Retour en haut</span>
    </Button>
  );
};
