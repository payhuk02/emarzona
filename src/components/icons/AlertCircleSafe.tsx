/**
 * Wrapper sécurisé pour AlertCircle
 * Utilise AlertCircleIcon (SVG inline) comme fallback si AlertCircle de lucide-react n'est pas disponible
 * Cela évite les erreurs "AlertCircle is not defined" en production
 */

import React from 'react';
import { AlertCircleIcon } from './AlertCircleIcon';
import { logger } from '@/lib/logger';

// Essayer d'importer AlertCircle de lucide-react, mais utiliser AlertCircleIcon en fallback
let AlertCircle: React.ComponentType<any> | null = null;

try {
  // Import dynamique pour éviter les problèmes de bundling
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lucideReact = require('lucide-react');
  if (lucideReact && lucideReact.AlertCircle) {
    AlertCircle = lucideReact.AlertCircle;
  }
} catch (error) {
  // Si l'import échoue, on utilisera AlertCircleIcon
  logger.debug('AlertCircle from lucide-react not available, using AlertCircleIcon fallback');
}

interface AlertCircleSafeProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  [key: string]: any; // Pour les autres props de lucide-react
}

/**
 * Composant AlertCircle sécurisé qui utilise AlertCircleIcon en fallback
 * Utilisez ce composant au lieu de AlertCircle directement pour éviter les erreurs en production
 */
export const AlertCircleSafe: React.FC<AlertCircleSafeProps> = (props) => {
  // Si AlertCircle est disponible, l'utiliser, sinon utiliser AlertCircleIcon
  if (AlertCircle) {
    return <AlertCircle {...props} />;
  }
  
  // Fallback vers AlertCircleIcon
  return <AlertCircleIcon {...props} />;
};

// Export par défaut pour faciliter l'import
export default AlertCircleSafe;

