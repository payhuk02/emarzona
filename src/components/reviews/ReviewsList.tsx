/**
 * Composant : ReviewsList
 * Liste des avis avec pagination et filtres
 * Date : 27 octobre 2025
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ReviewCard } from './ReviewCard';
import { ReviewFilter } from './ReviewFilter';
import { Button } from '@/components/ui/button';
import { Loader2 } from '@/components/icons';
import { useProductReviews, useVoteReview } from '@/hooks/useReviews';
import type { ReviewFilters } from '@/types/review';
import { ReviewsListSkeleton } from './ReviewSkeleton';

interface ReviewsListProps {
  productId: string;
  onReplyToReview?: (reviewId: string) => void;
}

const  ReviewsListComponent: React.FC<ReviewsListProps> = ({
  productId,
  onReplyToReview,
}) => {
  const [filters, setFilters] = useState<ReviewFilters>({
    sort_by: 'recent',
    limit: 10,
    offset: 0,
  });

  const { data: reviews, isLoading } = useProductReviews(productId, filters);
  const voteReview = useVoteReview();

  const handleVote = useCallback((reviewId: string, isHelpful: boolean) => {
    voteReview.mutate({ reviewId, isHelpful });
  }, [voteReview]);

  const handleLoadMore = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 10),
    }));
  }, []);

  // Mémoriser le calcul de hasMore
  const hasMore = useMemo(() => {
    return reviews ? reviews.length >= (filters.limit || 10) : false;
  }, [reviews, filters.limit]);

  if (isLoading) {
    return <ReviewsListSkeleton count={3} />;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewFilter filters={filters} onFiltersChange={setFilters} />

      <div className="space-y-4">
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            onVote={(isHelpful) => handleVote(review.id, isHelpful)}
            onReply={onReplyToReview ? () => onReplyToReview(review.id) : undefined}
            currentUserVote={review.user_vote}
            isLoading={voteReview.isPending}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button onClick={handleLoadMore} variant="outline">
            Charger plus d'avis
          </Button>
        </div>
      )}
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ReviewsList = React.memo(ReviewsListComponent, (prevProps, nextProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.onReplyToReview === nextProps.onReplyToReview
  );
});

ReviewsList.displayName = 'ReviewsList';







