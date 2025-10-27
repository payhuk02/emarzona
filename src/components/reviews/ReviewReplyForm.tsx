/**
 * Composant : ReviewReplyForm
 * Formulaire de réponse à un avis
 * Date : 27 octobre 2025
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useReplyToReview } from '@/hooks/useReviews';

interface ReviewReplyFormProps {
  reviewId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewReplyForm: React.FC<ReviewReplyFormProps> = ({
  reviewId,
  onSuccess,
  onCancel,
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ content: string }>();
  const replyMutation = useReplyToReview();

  const onSubmit = (data: { content: string }) => {
    replyMutation.mutate(
      { reviewId, content: data.content },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        placeholder="Répondre à cet avis..."
        rows={3}
        {...register('content', { required: true, minLength: 10 })}
      />
      {errors.content && (
        <p className="text-sm text-destructive">
          La réponse doit contenir au moins 10 caractères
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={replyMutation.isPending}>
          {replyMutation.isPending ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </form>
  );
};

