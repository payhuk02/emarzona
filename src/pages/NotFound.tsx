import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.warn('404 Error: User attempted to access non-existent route', { pathname: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="mb-4 text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg sm:text-xl text-muted-foreground px-4">Oops! Page introuvable</p>
        <a href="/" className="text-primary underline hover:text-primary/80 transition-colors text-sm sm:text-base">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
