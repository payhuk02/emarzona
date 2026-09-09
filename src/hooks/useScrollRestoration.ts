import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

function getScrollTarget(): HTMLElement | Window {
  if (typeof document === 'undefined') return window;
  const main = document.getElementById('main-content');
  if (main instanceof HTMLElement) {
    const style = window.getComputedStyle(main);
    const canScroll =
      (style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        main.scrollHeight > main.clientHeight) &&
      main.clientHeight > 0;
    if (canScroll) return main;
  }
  return window;
}

function readScrollTop(target: HTMLElement | Window): number {
  return target === window ? window.scrollY : (target as HTMLElement).scrollTop;
}

function writeScrollTop(target: HTMLElement | Window, top: number): void {
  if (target === window) {
    window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
  } else {
    (target as HTMLElement).scrollTop = top;
  }
}

/** Restaure le scroll de `#main-content` (shell) ou de `window` (pages bare). */
export const useScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    let target = getScrollTarget();

    const saveScrollPosition = () => {
      scrollPositions.set(pathname, readScrollTop(target));
    };

    const restore = () => {
      target = getScrollTarget();
      const savedPosition = scrollPositions.get(pathname);
      if (savedPosition !== undefined) {
        writeScrollTop(target, savedPosition);
      } else {
        writeScrollTop(target, 0);
      }
    };

    // DOM may not have #main-content until after Suspense resolves
    const frame = window.requestAnimationFrame(() => {
      restore();
    });
    const timeout = window.setTimeout(restore, 50);

    const onScroll = () => saveScrollPosition();
    const attach = () => {
      target = getScrollTarget();
      if (target === window) {
        window.addEventListener('scroll', onScroll, { passive: true });
      } else {
        (target as HTMLElement).addEventListener('scroll', onScroll, { passive: true });
      }
    };
    attach();
    const attachTimeout = window.setTimeout(attach, 60);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(attachTimeout);
      saveScrollPosition();
      if (target === window) {
        window.removeEventListener('scroll', onScroll);
      } else {
        (target as HTMLElement).removeEventListener('scroll', onScroll);
      }
    };
  }, [location.pathname]);
};
