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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateEmailSegment, useUpdateEmailSegment } from '@/hooks/email/useEmailSegments';
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SegmentType>('dynamic');
  const [criteria, setCriteria] = useState<Record<string, any>>({});

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
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createSegment.isPending || updateSegment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le segment' : 'Nouveau segment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de votre segment d\'audience'
              : 'Créez un nouveau segment d\'audience pour vos campagnes email'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du segment *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Clients VIP"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du segment..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type">Type de segment *</Label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value as SegmentType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Statique (liste manuelle)</SelectItem>
                  <SelectItem value="dynamic">Dynamique (basé sur des critères)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {type === 'static'
                  ? 'Un segment statique contient une liste manuelle d\'utilisateurs'
                  : 'Un segment dynamique est calculé automatiquement selon des critères'}
              </p>
            </div>
          </div>

          {/* Configuration des critères */}
          {type === 'dynamic' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Critères de segmentation</CardTitle>
                <CardDescription>
                  Définissez les critères pour calculer automatiquement les membres du segment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    La configuration avancée des critères sera disponible dans une prochaine mise à jour.
                    Pour l'instant, vous pouvez créer un segment dynamique de base.
                  </AlertDescription>
                </Alert>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Les critères complexes (achats, comportement, démographie) seront configurables via
                    l'interface avancée de segmentation dans une prochaine version.
                  </p>
                </div>
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
                    Après la création, vous pourrez ajouter des utilisateurs à ce segment depuis
                    la page de prévisualisation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer le segment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

