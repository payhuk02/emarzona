/**
 * Composant pour créer/éditer un segment email
 * Date: 1er Février 2025
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentCriteriaBuilder, type SegmentCriteria } from './SegmentCriteriaBuilder';
import { useCreateEmailSegment, useUpdateEmailSegment } from '@/hooks/email/useEmailSegments';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';
import type {
  EmailSegment,
  CreateSegmentPayload,
  SegmentType,
} from '@/lib/email/email-segment-service';
import { Loader2 } from 'lucide-react';

interface EmailSegmentBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  segment?: EmailSegment | null;
  onSuccess?: () => void;
}

export const EmailSegmentBuilder = ({
  open,
  onOpenChange,
  storeId,
  segment,
  onSuccess,
}: EmailSegmentBuilderProps) => {
  const { useBottomSheet } = useResponsiveModal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SegmentType>('dynamic');
  const [criteria, setCriteria] = useState<SegmentCriteria>({});

  const createSegment = useCreateEmailSegment();
  const updateSegment = useUpdateEmailSegment();

  const isEditing = !!segment;

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || '');
      setType(segment.type);
      setCriteria(segment.criteria || {});
    } else {
      // Reset form
      setName('');
      setDescription('');
      setType('dynamic');
      setCriteria({});
    }
  }, [segment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateSegmentPayload = {
      store_id: storeId,
      name,
      description,
      type,
      criteria,
    };

    try {
      if (isEditing) {
        await updateSegment.mutateAsync({
          segmentId: segment!.id,
          payload,
        });
      } else {
        await createSegment.mutateAsync(payload);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createSegment.isPending || updateSegment.isPending;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <MobileFormField
          label="Nom du segment"
          name="name"
          type="text"
          value={name}
          onChange={setName}
          required
          fieldProps={{
            placeholder: 'Clients VIP',
          }}
        />

        <MobileFormField
          label="Description"
          name="description"
          type="textarea"
          value={description}
          onChange={setDescription}
          fieldProps={{
            placeholder: 'Description du segment...',
            rows: 3,
          }}
        />

        <MobileFormField
          label="Type de segment"
          name="type"
          type="select"
          value={type}
          onChange={value => setType(value as SegmentType)}
          required
          description={
            type === 'static'
              ? "Un segment statique contient une liste manuelle d'utilisateurs"
              : 'Un segment dynamique est calculé automatiquement selon des critères'
          }
          selectOptions={[
            { value: 'static', label: 'Statique (liste manuelle)' },
            { value: 'dynamic', label: 'Dynamique (basé sur des critères)' },
          ]}
        />
      </div>

      {/* Configuration des critères */}
      {type === 'dynamic' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critères de segmentation</CardTitle>
            <CardDescription>
              Filtrez les clients de votre boutique (tags, commandes, montant dépensé).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentCriteriaBuilder criteria={criteria} onChange={setCriteria} />
          </CardContent>
        </Card>
      )}

      {type === 'static' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Segment statique</CardTitle>
            <CardDescription>
              Un segment statique permet d'ajouter manuellement des utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Après la création, vous pourrez ajouter des utilisateurs à ce segment depuis la page
                de prévisualisation.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Enregistrer' : 'Créer le segment'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title={isEditing ? 'Modifier le segment' : 'Nouveau segment'}
            description={
              isEditing
                ? "Modifiez les informations de votre segment d'audience"
                : "Créez un nouveau segment d'audience pour vos campagnes email"
            }
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Modifier le segment' : 'Nouveau segment'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifiez les informations de votre segment d'audience"
                  : "Créez un nouveau segment d'audience pour vos campagnes email"}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
