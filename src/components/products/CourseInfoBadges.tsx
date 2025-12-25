/**
 * Course Info Badges - Composants pour afficher les informations spécifiques aux cours
 * Date: 2 Février 2025
 *
 * Badges pour:
 * - Niveau de difficulté (beginner, intermediate, advanced, all_levels)
 * - Langue du cours
 * - Durée totale
 * - Nombre de modules/leçons
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge Niveau de difficulté
 */
export function CourseDifficultyBadge({
  difficulty,
  size = 'sm',
  className,
}: {
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels' | string | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!difficulty) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const difficultyConfig = {
    beginner: {
      label: 'Débutant',
      className: 'bg-green-500 text-white border-0',
      title: 'Niveau débutant - Aucune connaissance préalable requise',
    },
    intermediate: {
      label: 'Intermédiaire',
      className: 'bg-orange-500 text-white border-0',
      title: 'Niveau intermédiaire - Connaissances de base requises',
    },
    advanced: {
      label: 'Avancé',
      className: 'bg-red-500 text-white border-0',
      title: 'Niveau avancé - Expérience significative requise',
    },
    all_levels: {
      label: 'Tous niveaux',
      className: 'bg-blue-500 text-white border-0',
      title: 'Adapté à tous les niveaux',
    },
  };

  const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || {
    label: difficulty,
    className: 'bg-gray-500 text-white border-0',
    title: `Niveau: ${difficulty}`,
  };

  return (
    <Badge className={cn(sizeClasses[size], config.className, className)} title={config.title}>
      {config.label}
    </Badge>
  );
}

/**
 * Badge Langue
 */
export function CourseLanguageBadge({
  language,
  size = 'sm',
  className,
}: {
  language?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!language) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  const languageLabels: Record<string, string> = {
    fr: '🇫🇷 Français',
    en: '🇬🇧 Anglais',
    es: '🇪🇸 Espagnol',
    pt: '🇵🇹 Portugais',
  };

  const label = languageLabels[language.toLowerCase()] || language;

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-gray-500 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800',
        sizeClasses[size],
        className
      )}
      title={`Langue du cours: ${label}`}
    >
      <Globe className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span>{label}</span>
    </Badge>
  );
}

/**
 * Badge Durée totale
 */
export function CourseDurationBadge({
  totalDuration,
  durationUnit = 'hours',
  size = 'sm',
  className,
}: {
  totalDuration?: number | null;
  durationUnit?: 'hours' | 'minutes' | 'days';
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!totalDuration || totalDuration <= 0) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  let displayDuration = '';
  if (durationUnit === 'hours') {
    displayDuration = `${totalDuration}h`;
  } else if (durationUnit === 'minutes') {
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;
    displayDuration =
      hours > 0 ? `${hours}h${minutes > 0 ? `${minutes}min` : ''}` : `${minutes}min`;
  } else {
    displayDuration = `${totalDuration}j`;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
        sizeClasses[size],
        className
      )}
      title={`Durée totale du cours: ${displayDuration}`}
    >
      <Clock className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">{displayDuration} de contenu</span>
      <span className="sm:hidden">{displayDuration}</span>
    </Badge>
  );
}

/**
 * Badge Nombre de modules/leçons
 */
export function CourseModulesBadge({
  modulesCount,
  lessonsCount,
  size = 'sm',
  className,
}: {
  modulesCount?: number | null;
  lessonsCount?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const count = modulesCount || lessonsCount;
  if (!count || count <= 0) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  const label = modulesCount ? 'modules' : 'leçons';
  const singularLabel = modulesCount ? 'module' : 'leçon';

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
        sizeClasses[size],
        className
      )}
      title={`${count} ${count > 1 ? label : singularLabel}`}
    >
      <BookOpen className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">
        {count} {count > 1 ? label : singularLabel}
      </span>
      <span className="sm:hidden">{count}</span>
    </Badge>
  );
}

