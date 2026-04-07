/**
 * Digital Info Badges - Composants pour afficher les informations spécifiques aux produits digitaux
 * Date: 2 Février 2025
 *
 * Badges pour:
 * - Type de produit digital (ebook, software, template, etc.)
 * - Limite de téléchargements
 * - Version (déjà géré dans DigitalProductCard, mais peut être amélioré)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge Type de produit digital
 */
export function DigitalTypeBadge({
  digitalType,
  size = 'sm',
  className,
}: {
  digitalType?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!digitalType) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  // Icônes et labels pour les types digitaux
  const  digitalTypeLabels: Record<string, string> = {
    ebook: '📚 Ebook',
    software: '💻 Logiciel',
    template: '🎨 Template',
    plugin: '🔌 Plugin',
    music: '🎵 Musique',
    video: '🎬 Vidéo',
    graphic: '🖼️ Graphisme',
    game: '🎮 Jeu',
    app: '📱 Application',
    document: '📄 Document',
    data: '📊 Données',
    other: '📦 Autre',
  };

  const label = digitalTypeLabels[digitalType.toLowerCase()] || digitalType;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 capitalize',
        sizeClasses[size],
        className
      )}
      title={`Type: ${label}`}
    >
      {label}
    </Badge>
  );
}

/**
 * Badge Limite de téléchargements
 */
export function DigitalDownloadLimitBadge({
  downloadLimit,
  size = 'sm',
  className,
}: {
  downloadLimit?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  // Ne pas afficher si limite illimitée ou non définie
  if (!downloadLimit || downloadLimit === -1 || downloadLimit < 0) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
        sizeClasses[size],
        className
      )}
      title={`${downloadLimit} téléchargement${downloadLimit > 1 ? 's' : ''} autorisé${downloadLimit > 1 ? 's' : ''}`}
    >
      <Download className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">{downloadLimit} téléchargements</span>
      <span className="sm:hidden">{downloadLimit}x</span>
    </Badge>
  );
}

/**
 * Badge Version amélioré
 */
export function DigitalVersionBadge({
  version,
  size = 'sm',
  className,
}: {
  version?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!version) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 font-mono',
        sizeClasses[size],
        className
      )}
      title={`Version ${version}`}
    >
      v{version}
    </Badge>
  );
}







