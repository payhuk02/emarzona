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
import { ThumbsUp, ThumbsDown, MessageCircle, ShieldCheck } from 'lucide-react';
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

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onVote,
  onReply,
  showReplies = true,
  currentUserVote,
}) => {
  const [showAllImages, setShowAllImages] = useState(false);
  const detailedFields = getDetailedRatingFields(review.product_type);

  const imagesToShow = showAllImages 
    ? review.media?.filter(m => m.media_type === 'image') 
    : review.media?.filter(m => m.media_type === 'image').slice(0, 3);

  return (
    <Card>
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
        {detailedFields.length > 0 && detailedFields.some(f => (review as any)[f]) && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            {detailedFields.map(field => {
              const value = (review as any)[field];
              if (!value) return null;
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

        {/* Media */}
        {review.media && review.media.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2">
              {imagesToShow?.map((media) => (
                <img
                  key={media.id}
                  src={media.media_url}
                  alt="Review media"
                  className="w-full aspect-square object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(media.media_url, '_blank')}
                />
              ))}
            </div>
            {review.media.length > 3 && !showAllImages && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setShowAllImages(true)}
              >
                Voir {review.media.length - 3} photo{review.media.length - 3 > 1 ? 's' : ''} de plus
              </Button>
            )}
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
        {/* Votes */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote?.(true)}
            className={currentUserVote?.is_helpful ? 'text-primary' : ''}
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            Utile ({review.helpful_count})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote?.(false)}
            className={currentUserVote && !currentUserVote.is_helpful ? 'text-destructive' : ''}
          >
            <ThumbsDown className="w-4 h-4 mr-1" />
            Pas utile ({review.not_helpful_count})
          </Button>
        </div>

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

