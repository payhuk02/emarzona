/**
 * Composant : ReviewVoteButtons
 * Boutons améliorés pour voter sur les reviews avec feedback visuel
 * Date : 31 Janvier 2025
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewVoteButtonsProps {
  helpfulCount: number;
  notHelpfulCount: number;
  currentUserVote?: { is_helpful: boolean } | null;
  onVote: (isHelpful: boolean) => void;
  isLoading?: boolean;
  className?: string;
}

export const ReviewVoteButtons: React.FC<ReviewVoteButtonsProps> = ({
  helpfulCount,
  notHelpfulCount,
  currentUserVote,
  onVote,
  isLoading = false,
  className = '',
}) => {
  const hasVoted = currentUserVote !== null && currentUserVote !== undefined;
  const votedHelpful = currentUserVote?.is_helpful === true;
  const votedNotHelpful = currentUserVote?.is_helpful === false;

  const handleVote = (isHelpful: boolean) => {
    // Si l'utilisateur clique sur le même vote, on le retire
    if (hasVoted && currentUserVote?.is_helpful === isHelpful) {
      // Optionnel : permettre de retirer le vote
      // Pour l'instant, on change juste de vote
      onVote(!isHelpful);
    } else {
      onVote(isHelpful);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(true)}
        disabled={isLoading}
        className={cn(
          'transition-all',
          votedHelpful
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'hover:bg-green-50 dark:hover:bg-green-900/10',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading && votedHelpful ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <ThumbsUp
            className={cn(
              'w-4 h-4 mr-1.5',
              votedHelpful && 'fill-current'
            )}
          />
        )}
        <span className="font-medium">
          Utile
        </span>
        {helpfulCount > 0 && (
          <span className="ml-1.5 text-xs opacity-75">
            ({helpfulCount})
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(false)}
        disabled={isLoading}
        className={cn(
          'transition-all',
          votedNotHelpful
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            : 'hover:bg-red-50 dark:hover:bg-red-900/10',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading && votedNotHelpful ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <ThumbsDown
            className={cn(
              'w-4 h-4 mr-1.5',
              votedNotHelpful && 'fill-current'
            )}
          />
        )}
        <span className="font-medium">
          Pas utile
        </span>
        {notHelpfulCount > 0 && (
          <span className="ml-1.5 text-xs opacity-75">
            ({notHelpfulCount})
          </span>
        )}
      </Button>

      {/* Indicateur de pourcentage */}
      {hasVoted && helpfulCount + notHelpfulCount > 0 && (
        <div className="ml-2 text-xs text-muted-foreground">
          {Math.round((helpfulCount / (helpfulCount + notHelpfulCount)) * 100)}% utile
        </div>
      )}
    </div>
  );
};







