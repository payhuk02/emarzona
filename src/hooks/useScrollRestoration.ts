import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const scrollPositions = new Map<string, number>();

export const useScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position when leaving
    const saveScrollPosition = () => {
      scrollPositions.set(location.pathname, window.scrollY);
    };

    // Restore scroll position when entering
    const savedPosition = scrollPositions.get(location.pathname);
    if (savedPosition !== undefined) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: "instant" as ScrollBehavior,
        });
      }, 0);
    } else {
      // Scroll to top for new pages
      window.scrollTo(0, 0);
    }

    // Listen for scroll events to save position
    window.addEventListener("scroll", saveScrollPosition);

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
    };
  }, [location.pathname]);
};
