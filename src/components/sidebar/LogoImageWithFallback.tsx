import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export const LogoImageWithFallback = ({ src, className }: { src: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);

  // Réinitialiser l'erreur si le src change
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setHasError(false);
      setRetryCount(0);
    }
  }, [src, currentSrc]);

  const handleError = () => {
    // Si l'image ne charge pas, essayer le logo par défaut (une seule fois)
    if (currentSrc !== '/emarzona-logo.png' && retryCount === 0) {
      logger.warn('Logo failed to load, trying default', { failedUrl: currentSrc });
      setCurrentSrc('/emarzona-logo.png');
      setHasError(false);
      setRetryCount(1);
    } else {
      // Si même le logo par défaut ne charge pas, afficher le fallback
      setHasError(true);
      logger.error('Default logo also failed to load', {
        attemptedUrl: currentSrc,
        defaultLogo: '/emarzona-logo.png',
      });
    }
  };

  // Valider que l'URL est valide avant de l'utiliser
  const isValidUrl =
    currentSrc &&
    (currentSrc.startsWith('/') ||
      currentSrc.startsWith('http://') ||
      currentSrc.startsWith('https://') ||
      currentSrc.startsWith('data:'));

  if (hasError || !isValidUrl) {
    // Fallback : afficher un placeholder avec la lettre E
    return (
      <div
        className={`${className} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105`}
        style={{ minWidth: '32px', minHeight: '32px' }}
        aria-label="Logo Emarzona"
      >
        <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">E</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ minWidth: '32px', minHeight: '32px' }}>
      <img
        src={currentSrc}
        alt="Logo Emarzona"
        className="object-contain w-full h-full"
        onError={handleError}
        onLoad={() => {
          // Logo chargé avec succès
          setHasError(false);
        }}
        loading="eager"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
};
