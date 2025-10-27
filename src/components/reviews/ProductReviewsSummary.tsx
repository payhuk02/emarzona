/**
 * Composant : ProductReviewsSummary
 * Composant principal - Résumé et gestion complète des avis d'un produit
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { ReviewsStats } from './ReviewsStats';
import { ReviewsList } from './ReviewsList';
import { ReviewForm } from './ReviewForm';
import { ReviewReplyForm } from './ReviewReplyForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, AlertCircle } from 'lucide-react';
import {
  useProductReviewStats,
  useCanReview,
  useCreateReview,
} from '@/hooks/useReviews';
import type { ProductType } from '@/types/product';
import { ReviewsErrorBoundary, FormErrorBoundary, ReviewsPlaceholder } from '@/components/errors';

interface ProductReviewsSummaryProps {
  productId: string;
  productType: ProductType;
}

export const ProductReviewsSummary: React.FC<ProductReviewsSummaryProps> = ({
  productId,
  productType,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyToReviewId, setReplyToReviewId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | undefined>();

  const { data: stats } = useProductReviewStats(productId);
  const { data: canReview } = useCanReview(productId);
  const createReview = useCreateReview();

  const handleCreateReview = (data: any) => {
    createReview.mutate(data, {
      onSuccess: () => {
        setShowReviewForm(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Avis clients</h2>
        {canReview?.can_review && (
          <Button onClick={() => setShowReviewForm(true)}>
            <Star className="w-4 h-4 mr-2" />
            Laisser un avis
          </Button>
        )}
      </div>

      {/* Info si pas encore acheté */}
      {canReview && !canReview.can_review && canReview.reason === 'No purchase found' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez acheter ce produit pour laisser un avis
          </AlertDescription>
        </Alert>
      )}

      {/* Info si déjà avis existant */}
      {canReview && !canReview.can_review && canReview.reason === 'Already reviewed' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous avez déjà laissé un avis pour ce produit
          </AlertDescription>
        </Alert>
      )}

      {/* Layout */}
      <ReviewsErrorBoundary fallback={<ReviewsPlaceholder />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statistiques */}
          <div className="lg:col-span-1">
            <ReviewsStats
              stats={stats}
              onFilterByRating={setSelectedRating}
            />
          </div>

          {/* Liste des avis */}
          <div className="lg:col-span-2">
            <ReviewsList
              productId={productId}
              onReplyToReview={setReplyToReviewId}
            />
          </div>
        </div>
      </ReviewsErrorBoundary>

      {/* Dialog formulaire de review */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laisser un avis</DialogTitle>
          </DialogHeader>
          <FormErrorBoundary
            formName="Review Form"
            onReset={() => setShowReviewForm(false)}
          >
            <ReviewForm
              productId={productId}
              productType={productType}
              onSubmit={handleCreateReview}
              onCancel={() => setShowReviewForm(false)}
              isLoading={createReview.isPending}
            />
          </FormErrorBoundary>
        </DialogContent>
      </Dialog>

      {/* Dialog réponse à une review */}
      <Dialog open={!!replyToReviewId} onOpenChange={() => setReplyToReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à l'avis</DialogTitle>
          </DialogHeader>
          {replyToReviewId && (
            <FormErrorBoundary
              formName="Review Reply Form"
              onReset={() => setReplyToReviewId(null)}
            >
              <ReviewReplyForm
                reviewId={replyToReviewId}
                onSuccess={() => setReplyToReviewId(null)}
                onCancel={() => setReplyToReviewId(null)}
              />
            </FormErrorBoundary>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

