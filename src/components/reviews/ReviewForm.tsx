/**
 * Composant : ReviewForm
 * Formulaire universel de création/édition d'avis
 * Adaptatif selon le type de produit (Digital, Physical, Service, Course)
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewStars } from './ReviewStars';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductType } from '@/types/product';
import type { CreateReviewPayload } from '@/types/review';
import { getDetailedRatingFields, getDetailedRatingLabel } from '@/types/review';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

interface ReviewFormProps {
  productId: string;
  productType: ProductType;
  orderId?: string;
  onSubmit: (data: CreateReviewPayload) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productType,
  orderId,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const rating = watch('rating', 0);
  const detailedFields = getDetailedRatingFields(productType);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 5) {
      alert('Maximum 5 photos/vidéos');
      return;
    }

    // Créer previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = (data: any) => {
    const payload: CreateReviewPayload = {
      product_id: productId,
      product_type: productType,
      order_id: orderId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      media_files: mediaFiles,
    };

    // Ajouter les ratings détaillés selon le type de produit
    interface ReviewPayload {
      product_id: string;
      rating: number;
      comment?: string;
      // Ratings détaillés optionnels
      quality_rating?: number;
      value_rating?: number;
      service_rating?: number;
      delivery_rating?: number;
      [key: string]: unknown;
    }
    const reviewPayload: ReviewPayload = {
      product_id: data.product_id,
      rating: data.rating,
      comment: data.comment,
    };
    detailedFields.forEach(field => {
      if (data[field]) {
        reviewPayload[field] = data[field];
      }
    });

    onSubmit(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laisser un avis</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardContent className="space-y-6">
          {/* Note globale */}
          <div className="space-y-2">
            <Label>
              Note globale <span className="text-destructive">*</span>
            </Label>
            <ReviewStars
              rating={rating}
              size="xl"
              interactive
              onChange={(value) => setValue('rating', value)}
            />
            {errors.rating && (
              <p className="text-sm text-destructive">La note est requise</p>
            )}
          </div>

          {/* Ratings détaillés */}
          {detailedFields.length > 0 && (
            <div className="space-y-4">
              <Label>Détails (optionnel)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedFields.map(field => (
                  <div key={field} className="space-y-1">
                    <Label className="text-sm font-normal">
                      {getDetailedRatingLabel(field)}
                    </Label>
                    <ReviewStars
                      rating={watch(field, 0)}
                      size="md"
                      interactive
                      onChange={(value) => setValue(field, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de votre avis (optionnel)</Label>
            <Input
              id="title"
              placeholder="Résumez votre expérience..."
              onKeyDown={handleSpaceKeyDown}
              {...register('title')}
            />
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Votre commentaire <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Partagez votre expérience avec ce produit..."
              rows={5}
              onKeyDown={handleSpaceKeyDown}
              {...register('content', { required: true })}
            />
            {errors.content && (
              <p className="text-sm text-destructive">Le commentaire est requis</p>
            )}
          </div>

          {/* Upload photos/vidéos amélioré */}
          <div className="space-y-2">
            <Label>Photos ou vidéos (max 5)</Label>
            <div className="grid grid-cols-5 gap-2">
              {mediaPreviews.map((preview, index) => {
                const file = mediaFiles[index];
                const isVideo = file?.type.startsWith('video/');
                return (
                  <div key={index} className="relative aspect-square group">
                    {isVideo ? (
                      <div className="w-full h-full bg-black rounded-md flex items-center justify-center relative">
                        <video
                          src={preview}
                          className="w-full h-full object-cover rounded-md opacity-70"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2">
                            <Upload className="w-4 h-4 text-black" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {mediaFiles.length < 5 && (
                <label className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/50">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center px-1">
                    Ajouter
                  </span>
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptés : JPG, PNG, GIF, MP4, WebM (max 10MB par fichier)
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !rating}>
            {isLoading ? 'Publication...' : 'Publier l\'avis'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

