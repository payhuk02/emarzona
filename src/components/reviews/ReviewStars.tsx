/**
 * Composant : ReviewStars
 * Affichage et saisie de notation par étoiles
 * Date : 27 octobre 2025
 */

import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStarsProps {
  rating: number; // 0-5
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showNumber?: boolean;
  className?: string;
}

export const ReviewStars: React.FC<ReviewStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showNumber = false,
  className,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  const renderStar = (index: number) => {
    const value = index + 1;
    const filled = displayRating >= value;
    const halfFilled = displayRating >= value - 0.5 && displayRating < value;

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleClick(value)}
        onMouseEnter={() => handleMouseEnter(value)}
        onMouseLeave={handleMouseLeave}
        disabled={!interactive}
        className={cn(
          'relative',
          interactive && 'cursor-pointer hover:scale-110 transition-transform',
          !interactive && 'cursor-default'
        )}
        aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
      >
        {halfFilled ? (
          <div className="relative">
            <Star className={cn(sizeClasses[size], 'text-gray-300')} />
            <StarHalf
              className={cn(
                sizeClasses[size],
                'text-yellow-400 fill-yellow-400 absolute top-0 left-0'
              )}
            />
          </div>
        ) : (
          <Star
            className={cn(
              sizeClasses[size],
              filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            )}
          />
        )}
      </button>
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      </div>
      {showNumber && (
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

