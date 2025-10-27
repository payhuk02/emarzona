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
    detailedFields.forEach(field => {
      if (data[field]) {
        (payload as any)[field] = data[field];
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
              {...register('content', { required: true })}
            />
            {errors.content && (
              <p className="text-sm text-destructive">Le commentaire est requis</p>
            )}
          </div>

          {/* Upload photos/vidéos */}
          <div className="space-y-2">
            <Label>Photos ou vidéos (max 5)</Label>
            <div className="grid grid-cols-5 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 5 && (
                <label className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </label>
              )}
            </div>
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

