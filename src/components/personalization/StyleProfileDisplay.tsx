/**
 * Composant pour afficher le profil de style utilisateur
 * Utilisé dans les pages de recommandations personnalisées
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { StyleProfile } from './StyleQuiz';

interface StyleProfileDisplayProps {
  styleProfile:
    | (StyleProfile & {
        primaryStyle?: string;
        secondaryStyle?: string;
        colorPalette?: string[];
      })
    | null;
  variant?: 'inline' | 'detailed';
  className?: string;
}

export const StyleProfileDisplay: React.FC<StyleProfileDisplayProps> = ({
  styleProfile,
  variant = 'inline',
  className = '',
}) => {
  if (!styleProfile) return null;

  // Pour compatibilité avec les deux formats de StyleProfile
  // Le format depuis useStylePreferences a primaryStyle/secondaryStyle
  // Le format depuis StyleQuiz a aesthetic/colorPalette
  const primaryStyle =
    'primaryStyle' in styleProfile
      ? styleProfile.primaryStyle
      : styleProfile.aesthetic || 'personnalisé';
  const secondaryStyle = 'secondaryStyle' in styleProfile ? styleProfile.secondaryStyle : undefined;
  const colorPalette = 'colorPalette' in styleProfile ? styleProfile.colorPalette : [];

  if (variant === 'inline') {
    return (
      <p
        className={`text-sm sm:text-base lg:text-lg text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-500 delay-200 ${className}`}
      >
        Basé sur votre style{' '}
        <Badge variant="secondary" className="ml-1">
          {primaryStyle}
        </Badge>
        {secondaryStyle && (
          <>
            {' '}
            et{' '}
            <Badge variant="outline" className="ml-1">
              {secondaryStyle}
            </Badge>
          </>
        )}
      </p>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <p className="text-muted-foreground mb-4">
        Basé sur votre style <Badge variant="secondary">{primaryStyle}</Badge>
        {secondaryStyle && (
          <>
            {' '}
            et <Badge variant="outline">{secondaryStyle}</Badge>
          </>
        )}
      </p>

      {colorPalette && colorPalette.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground mr-2">Palette préférée:</span>
          {colorPalette.slice(0, 3).map((color, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Couleur ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
