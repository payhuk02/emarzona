/**
 * Résumé compact des avis dans le hero produit (Epic 3.2.4)
 */

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewStars } from '@/components/reviews/ReviewStars';
import { useProductReviewStats } from '@/hooks/useReviews';
import { cn } from '@/lib/utils';

interface ProductReviewsHeroSummaryProps {
  productId: string;
  onViewReviews?: () => void;
  className?: string;
}

export function ProductReviewsHeroSummary({
  productId,
  onViewReviews,
  className,
}: ProductReviewsHeroSummaryProps) {
  const { data: stats, isLoading } = useProductReviewStats(productId);

  if (isLoading) {
    return <Skeleton className={cn('h-6 w-40', className)} />;
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>Aucun avis pour le moment</p>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <ReviewStars rating={stats.average_rating} size="sm" showNumber />
      <span className="text-sm text-muted-foreground">
        ({stats.total_reviews} avis{stats.total_reviews > 1 ? '' : ''})
      </span>
      {onViewReviews && (
        <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={onViewReviews}>
          Voir les avis
        </Button>
      )}
    </div>
  );
}
