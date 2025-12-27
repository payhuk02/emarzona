/**
 * Composant pour gérer le favicon dynamiquement
 * Met à jour le favicon selon la configuration de la plateforme
 * Priorité : favicon personnalisé > logo light > favicon par défaut
 */

import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { usePlatformFavicon, usePlatformLogoLight } from '@/hooks/usePlatformLogo';

export const DynamicFavicon = () => {
  const favicon = usePlatformFavicon();
  const logoLight = usePlatformLogoLight();
  const previousUrlRef = useRef<string | null>(null);

  // Utiliser le favicon personnalisé s'il existe, sinon le logo light, sinon le favicon par défaut
  // Si logoLight est null, utiliser uniquement le favicon par défaut pour éviter le clignotement
  // Note: logoLight peut être null si aucun logo personnalisé n'est configuré
  const faviconUrl = favicon || (logoLight ? logoLight : '/favicon.ico');

  useEffect(() => {
    // Éviter les mises à jour inutiles
    if (previousUrlRef.current === faviconUrl) {
      return;
    }

    previousUrlRef.current = faviconUrl;

    // Mettre à jour tous les liens favicon dans le head
    const updateFavicon = (href: string) => {
      // Supprimer les anciens liens favicon (sauf celui par défaut dans index.html)
      const existingLinks = document.querySelectorAll('link[rel*="icon"]:not(#favicon-default)');
      existingLinks.forEach(link => link.remove());

      // Déterminer le type MIME selon l'extension
      const getMimeType = (url: string): string => {
        if (url.endsWith('.ico')) return 'image/x-icon';
        if (url.endsWith('.png')) return 'image/png';
        if (url.endsWith('.svg')) return 'image/svg+xml';
        if (url.endsWith('.webp')) return 'image/webp';
        return 'image/png'; // Par défaut
      };

      const mimeType = getMimeType(href);
      const timestamp = Date.now();

      // Favicon principal
      const linkIcon = document.createElement('link');
      linkIcon.rel = 'icon';
      linkIcon.type = mimeType;
      linkIcon.href = `${href}?v=${timestamp}`;
      document.head.appendChild(linkIcon);

      // Favicon PNG 32x32
      const linkIcon32 = document.createElement('link');
      linkIcon32.rel = 'icon';
      linkIcon32.type = 'image/png';
      linkIcon32.sizes = '32x32';
      linkIcon32.href = `${href}?v=${timestamp}`;
      document.head.appendChild(linkIcon32);

      // Favicon PNG 16x16
      const linkIcon16 = document.createElement('link');
      linkIcon16.rel = 'icon';
      linkIcon16.type = 'image/png';
      linkIcon16.sizes = '16x16';
      linkIcon16.href = `${href}?v=${timestamp}`;
      document.head.appendChild(linkIcon16);

      // Apple Touch Icon
      const linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon';
      linkApple.sizes = '180x180';
      linkApple.href = `${href}?v=${timestamp}`;
      document.head.appendChild(linkApple);

      // Mask Icon (Safari)
      const linkMask = document.createElement('link');
      linkMask.rel = 'mask-icon';
      linkMask.href = `${href}?v=${timestamp}`;
      linkMask.setAttribute('color', '#007bff');
      document.head.appendChild(linkMask);
    };

    updateFavicon(faviconUrl);
  }, [faviconUrl]);

  return (
    <Helmet>
      <link rel="icon" type="image/png" sizes="32x32" href={`${faviconUrl}?v=${Date.now()}`} />
      <link rel="icon" type="image/png" sizes="16x16" href={`${faviconUrl}?v=${Date.now()}`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`${faviconUrl}?v=${Date.now()}`} />
    </Helmet>
  );
};







