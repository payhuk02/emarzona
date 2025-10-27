/**
 * Composant : ReviewsStats
 * Affichage des statistiques et distribution des notes
 * Date : 27 octobre 2025
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ReviewStars } from './ReviewStars';
import type { ProductReviewStats } from '@/types/review';

interface ReviewsStatsProps {
  stats: ProductReviewStats | null;
  onFilterByRating?: (rating: number) => void;
}

export const ReviewsStats: React.FC<ReviewsStatsProps> = ({
  stats,
  onFilterByRating,
}) => {
  if (!stats || stats.total_reviews === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Aucun avis pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  const ratingDistribution = [
    { rating: 5, count: stats.rating_5_count },
    { rating: 4, count: stats.rating_4_count },
    { rating: 3, count: stats.rating_3_count },
    { rating: 2, count: stats.rating_2_count },
    { rating: 1, count: stats.rating_1_count },
  ];

  const getPercentage = (count: number) => {
    return stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes et avis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Note moyenne */}
        <div className="flex items-center gap-6 mb-6 pb-6 border-b">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">
              {stats.average_rating.toFixed(1)}
            </div>
            <ReviewStars rating={stats.average_rating} size="md" />
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total_reviews} avis
            </p>
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Recommandation</p>
            <div className="text-2xl font-bold text-primary">
              {Math.round(
                ((stats.rating_5_count + stats.rating_4_count) / stats.total_reviews) * 100
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              des clients recommandent ce produit
            </p>
          </div>
        </div>

        {/* Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count }) => (
            <button
              key={rating}
              onClick={() => onFilterByRating?.(rating)}
              className="w-full flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors"
            >
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm font-medium">{rating}</span>
                <ReviewStars rating={rating} size="sm" />
              </div>
              <Progress value={getPercentage(count)} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Stats supplémentaires */}
        {stats.verified_purchases_count > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {stats.verified_purchases_count}
              </span>{' '}
              avis avec achat vérifié
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

