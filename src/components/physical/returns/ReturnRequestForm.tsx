/**
 * Return Request Form Component
 * Formulaire pour les clients pour demander un retour
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateReturn, type CreateReturnData } from '@/hooks/physical/useReturns';
import { Upload, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface ReturnRequestFormProps {
  orderId: string;
  orderItemId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  onSuccess?: () => void;
}

export const ReturnRequestForm = ({
  orderId,
  orderItemId,
  productName,
  productImage,
  quantity,
  onSuccess,
}: ReturnRequestFormProps) => {
  const { toast } = useToast();
  const createReturn = useCreateReturn();
  
  const [returnReason, setReturnReason] = useState<CreateReturnData['return_reason']>('changed_mind');
  const [returnReasonDetails, setReturnReasonDetails] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [refundMethod, setRefundMethod] = useState<'original_payment' | 'store_credit' | 'exchange'>('original_payment');
  const [customerNotes, setCustomerNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user ID for upload path
  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || 'anonymous';
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const userId = await getUserId();
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} n'est pas une image valide`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} est trop volumineux (max 5MB)`);
        }

        const { url, error } = await uploadToSupabaseStorage(file, {
          bucket: 'product-images',
          path: `returns/${userId}`,
          filePrefix: 'return-photo',
          maxSizeBytes: 5 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          onProgress: (progress) => {
            const totalProgress = ((index + progress / 100) / files.length) * 100;
            setUploadProgress(Math.round(totalProgress));
          },
        });

        if (error) throw new Error(error);
        if (!url) throw new Error('Upload échoué');

        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        setPhotos(prev => [...prev, ...validUrls]);
        toast({
          title: '✅ Photos uploadées',
          description: `${validUrls.length} photo(s) ajoutée(s) avec succès`,
        });
      }
    } catch (error: any) {
      logger.error('Erreur upload photos retour', error);
      toast({
        title: '❌ Erreur d\'upload',
        description: error.message || 'Impossible de télécharger les photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (returnQuantity > quantity) {
      toast({
        title: '❌ Erreur',
        description: 'La quantité ne peut pas dépasser la quantité commandée',
        variant: 'destructive',
      });
      return;
    }

    createReturn.mutate(
      {
        order_id: orderId,
        order_item_id: orderItemId,
        return_reason: returnReason,
        return_reason_details: returnReasonDetails,
        quantity: returnQuantity,
        refund_method: refundMethod,
        photos,
        customer_notes: customerNotes,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demander un Retour</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Produit */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{productName}</h3>
              <p className="text-sm text-muted-foreground">Quantité commandée: {quantity}</p>
            </div>
          </div>

          {/* Raison du retour */}
          <div className="space-y-2">
            <Label htmlFor="return-reason">Raison du retour *</Label>
            <Select
              value={returnReason}
              onValueChange={(value) => setReturnReason(value as CreateReturnData['return_reason'])}
            >
              <SelectTrigger id="return-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defective">Produit défectueux</SelectItem>
                <SelectItem value="wrong_item">Mauvais article</SelectItem>
                <SelectItem value="not_as_described">Pas comme décrit</SelectItem>
                <SelectItem value="damaged">Endommagé à la livraison</SelectItem>
                <SelectItem value="size_issue">Problème de taille</SelectItem>
                <SelectItem value="color_issue">Problème de couleur</SelectItem>
                <SelectItem value="changed_mind">Changement d'avis</SelectItem>
                <SelectItem value="late_delivery">Livraison tardive</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Détails de la raison */}
          <div className="space-y-2">
            <Label htmlFor="return-reason-details">Détails (optionnel)</Label>
            <Textarea
              id="return-reason-details"
              value={returnReasonDetails}
              onChange={(e) => setReturnReasonDetails(e.target.value)}
              placeholder="Décrivez le problème ou la raison du retour..."
              rows={3}
            />
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="return-quantity">Quantité à retourner *</Label>
            <Select
              value={returnQuantity.toString()}
              onValueChange={(value) => setReturnQuantity(parseInt(value))}
            >
              <SelectTrigger id="return-quantity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...Array(quantity)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Méthode de remboursement */}
          <div className="space-y-2">
            <Label htmlFor="refund-method">Méthode de remboursement *</Label>
            <Select
              value={refundMethod}
              onValueChange={(value) => setRefundMethod(value as typeof refundMethod)}
            >
              <SelectTrigger id="refund-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original_payment">Remboursement méthode de paiement originale</SelectItem>
                <SelectItem value="store_credit">Crédit store</SelectItem>
                <SelectItem value="exchange">Échange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos du produit (recommandé)</Label>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Les photos aident à traiter votre retour plus rapidement. Montrez le produit et tout dommage éventuel.
              </AlertDescription>
            </Alert>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter des photos
                </>
              )}
            </Button>
            
            {/* Photo previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="customer-notes">Notes supplémentaires (optionnel)</Label>
            <Textarea
              id="customer-notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Toute information supplémentaire..."
              rows={3}
            />
          </div>

          {/* Info */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Votre demande de retour sera examinée et vous recevrez une réponse sous 2-3 jours ouvrables.
            </AlertDescription>
          </Alert>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={createReturn.isPending}
          >
            {createReturn.isPending ? 'Envoi en cours...' : 'Soumettre la demande de retour'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

