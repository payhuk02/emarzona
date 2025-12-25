import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop;
      setVisible(scrolled > 300);
    };

    window.addEventListener("scroll", toggleVisible);
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-large hover:shadow-glow transition-all duration-300 touch-manipulation ${
        visible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-16 opacity-0 scale-0 pointer-events-none"
      }`}
      aria-label="Retour en haut de la page"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      <span className="sr-only">Retour en haut</span>
    </Button>
  );
};
