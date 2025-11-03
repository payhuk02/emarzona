/**
 * Composant ReturnRequestForm - Formulaire de demande de retour
 * Date: 26 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCreateReturn } from '@/hooks/returns/useReturns';
import {
  RefreshCw,
  AlertCircle,
  Upload,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ReturnRequestFormProps {
  orderId: string;
  orderItemId?: string;
  productId: string;
  itemPrice: number;
  quantity?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RETURN_REASONS = [
  { value: 'defective', label: 'Produit défectueux' },
  { value: 'wrong_item', label: 'Mauvais article reçu' },
  { value: 'not_as_described', label: 'Ne correspond pas à la description' },
  { value: 'damaged', label: 'Produit endommagé à la réception' },
  { value: 'size_fit', label: 'Problème de taille/ajustement' },
  { value: 'quality', label: 'Problème de qualité' },
  { value: 'duplicate', label: 'Commande dupliquée' },
  { value: 'changed_mind', label: 'Changement d\'avis' },
  { value: 'other', label: 'Autre raison' },
];

export function ReturnRequestForm({
  orderId,
  orderItemId,
  productId,
  itemPrice,
  quantity = 1,
  onSuccess,
  onCancel,
}: ReturnRequestFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createReturn = useCreateReturn();

  const [returnReason, setReturnReason] = useState<string>('');
  const [returnReasonDetails, setReturnReasonDetails] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + photos.length > 5) {
      toast({
        title: 'Erreur',
        description: 'Vous pouvez télécharger au maximum 5 photos',
        variant: 'destructive',
      });
      return;
    }

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Créer des URLs de prévisualisation
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Révoquer l'URL de prévisualisation
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviews);
  };

  const handleSubmit = async () => {
    if (!returnReason) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une raison de retour',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour demander un retour',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload photos si disponibles
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        // TODO: Upload vers Supabase Storage
        // Pour l'instant, on garde un tableau vide
        photoUrls = [];
      }

      await createReturn.mutateAsync({
        order_id: orderId,
        order_item_id: orderItemId,
        product_id: productId,
        customer_id: user.id,
        return_reason: returnReason as any,
        return_reason_details: returnReasonDetails,
        quantity,
        item_price: itemPrice,
        total_amount: itemPrice * quantity,
        customer_notes: customerNotes,
        customer_photos: photoUrls,
      });

      toast({
        title: '✅ Demande créée',
        description: 'Votre demande de retour a été soumise avec succès',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la demande de retour',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Demander un Retour
        </CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour demander un retour ou un remboursement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations produit */}
        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Article concerné</div>
              <div className="text-sm text-muted-foreground">
                Quantité: {quantity} | Prix unitaire: {itemPrice.toLocaleString('fr-FR')} XOF
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {(itemPrice * quantity).toLocaleString('fr-FR')} XOF
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Raison du retour */}
        <div className="space-y-2">
          <Label>Raison du retour *</Label>
          <Select value={returnReason} onValueChange={setReturnReason}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une raison" />
            </SelectTrigger>
            <SelectContent>
              {RETURN_REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Détails de la raison */}
        {returnReason && (
          <div className="space-y-2">
            <Label>Détails (optionnel)</Label>
            <Textarea
              value={returnReasonDetails}
              onChange={(e) => setReturnReasonDetails(e.target.value)}
              placeholder="Décrivez plus en détail la raison de votre retour..."
              rows={3}
            />
          </div>
        )}

        {/* Photos */}
        <div className="space-y-2">
          <Label>Photos (optionnel, max 5)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {photoPreviewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={photos.length >= 5}
          />
          <p className="text-xs text-muted-foreground">
            Ajoutez des photos pour aider à comprendre le problème ({photos.length}/5)
          </p>
        </div>

        {/* Notes supplémentaires */}
        <div className="space-y-2">
          <Label>Notes supplémentaires (optionnel)</Label>
          <Textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Toute autre information pertinente..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={createReturn.isPending || !returnReason}
            className="flex-1"
          >
            {createReturn.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Soumettre la demande
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Votre demande sera examinée par le vendeur. Vous recevrez une notification une fois
            votre demande traitée. Les frais de retour peuvent être à votre charge selon la raison
            du retour.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

