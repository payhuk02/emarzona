/**
 * Composant : ReviewsList
 * Liste des avis avec pagination et filtres
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { ReviewCard } from './ReviewCard';
import { ReviewFilter } from './ReviewFilter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useProductReviews, useVoteReview } from '@/hooks/useReviews';
import type { ReviewFilters } from '@/types/review';
import { ReviewsListSkeleton } from './ReviewSkeleton';

interface ReviewsListProps {
  productId: string;
  onReplyToReview?: (reviewId: string) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
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

  const handleVote = (reviewId: string, isHelpful: boolean) => {
    voteReview.mutate({ reviewId, isHelpful });
  };

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 10),
    }));
  };

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
          />
        ))}
      </div>

      {reviews.length >= (filters.limit || 10) && (
        <div className="text-center">
          <Button onClick={handleLoadMore} variant="outline">
            Charger plus d'avis
          </Button>
        </div>
      )}
    </div>
  );
};

