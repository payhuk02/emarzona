/**
 * Composant : ReviewCard
 * Carte d'affichage d'un avis client
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ReviewStars } from './ReviewStars';
import { ReviewMediaGallery } from './ReviewMediaGallery';
import { ReviewVoteButtons } from './ReviewVoteButtons';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Review } from '@/types/review';
import { getDetailedRatingFields, getDetailedRatingLabel } from '@/types/review';

interface ReviewCardProps {
  review: Review;
  onVote?: (isHelpful: boolean) => void;
  onReply?: () => void;
  showReplies?: boolean;
  currentUserVote?: { is_helpful: boolean } | null;
}

const ReviewCardComponent: React.FC<ReviewCardProps> = ({
  review,
  onVote,
  onReply,
  showReplies = true,
  currentUserVote,
  isLoading = false,
}) => {
  const detailedFields = getDetailedRatingFields(review.product_type);

  return (
    <Card style={{ willChange: 'transform' }}>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={review.reviewer_avatar} />
              <AvatarFallback>{review.reviewer_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{review.reviewer_name || 'Anonyme'}</h4>
                {review.verified_purchase && (
                  <Badge variant="secondary" className="text-xs">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Achat vérifié
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-3">
          <ReviewStars rating={review.rating} size="md" showNumber />
        </div>

        {/* Ratings détaillés */}
        {detailedFields.length > 0 && detailedFields.some(f => {
          const reviewWithFields = review as Review & { [key: string]: unknown };
          return reviewWithFields[f];
        }) && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            {detailedFields.map(field => {
              const reviewWithFields = review as Review & { [key: string]: unknown };
              const value = reviewWithFields[field];
              if (!value || typeof value !== 'number') return null;
              return (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{getDetailedRatingLabel(field)} :</span>
                  <ReviewStars rating={value} size="sm" />
                </div>
              );
            })}
          </div>
        )}

        {/* Titre */}
        {review.title && (
          <h5 className="font-semibold mb-2">{review.title}</h5>
        )}

        {/* Contenu */}
        <p className="text-sm whitespace-pre-wrap mb-4">{review.content}</p>

        {/* Media Gallery */}
        {review.media && review.media.length > 0 && (
          <div className="mb-4">
            <ReviewMediaGallery media={review.media} maxVisible={3} />
          </div>
        )}

        {/* Réponses */}
        {showReplies && review.replies && review.replies.length > 0 && (
          <div className="mt-4 space-y-3 pl-4 border-l-2">
            {review.replies.map((reply) => (
              <div key={reply.id} className="bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    {reply.is_official ? '🏪 Vendeur' : reply.user?.full_name || 'Utilisateur'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        {/* Votes améliorés */}
        {onVote && (
          <ReviewVoteButtons
            helpfulCount={review.helpful_count}
            notHelpfulCount={review.not_helpful_count}
            currentUserVote={currentUserVote}
            onVote={onVote}
            isLoading={isLoading}
          />
        )}

        {/* Répondre */}
        {onReply && (
          <Button variant="ghost" size="sm" onClick={onReply}>
            <MessageCircle className="w-4 h-4 mr-1" />
            Répondre ({review.reply_count})
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ReviewCard = React.memo(ReviewCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.review.id === nextProps.review.id &&
    prevProps.review.rating === nextProps.review.rating &&
    prevProps.review.helpful_count === nextProps.review.helpful_count &&
    prevProps.review.reply_count === nextProps.review.reply_count &&
    prevProps.review.created_at === nextProps.review.created_at &&
    prevProps.showReplies === nextProps.showReplies &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.currentUserVote?.is_helpful === nextProps.currentUserVote?.is_helpful &&
    prevProps.onVote === nextProps.onVote &&
    prevProps.onReply === nextProps.onReply
  );
});

ReviewCard.displayName = 'ReviewCard';

