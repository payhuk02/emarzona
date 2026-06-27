/**
 * Gestion seller de la provenance d'une œuvre.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Loader2, Plus } from 'lucide-react';
import {
  useArtworkProvenanceHistory,
  useCreateProvenance,
  type ArtworkProvenance,
} from '@/hooks/artist/useArtworkProvenance';
import { ArtworkProvenanceDisplay } from '@/components/artist/ArtworkProvenanceDisplay';

const PROVENANCE_TYPES: ArtworkProvenance['provenance_type'][] = [
  'creation',
  'ownership',
  'exhibition',
  'publication',
  'restoration',
  'authentication',
  'certification',
  'other',
];

interface ArtworkProvenanceManagerProps {
  productId: string;
  storeId: string;
}

export function ArtworkProvenanceManager({ productId, storeId }: ArtworkProvenanceManagerProps) {
  const { data: history = [], isLoading } = useArtworkProvenanceHistory(productId);
  const createProvenance = useCreateProvenance();
  const [provenanceType, setProvenanceType] =
    useState<ArtworkProvenance['provenance_type']>('ownership');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [currentOwnerName, setCurrentOwnerName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eventDate.trim()) return;

    await createProvenance.mutateAsync({
      product_id: productId,
      store_id: storeId,
      provenance_type: provenanceType,
      event_date: eventDate,
      recorded_date: new Date().toISOString(),
      description: description || undefined,
      current_owner_name: currentOwnerName || undefined,
      is_verified: false,
    });

    setEventDate('');
    setDescription('');
    setCurrentOwnerName('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historique de provenance</CardTitle>
          <CardDescription>
            Documentez la chaîne de propriété et les événements liés à l&apos;œuvre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : (
            <ArtworkProvenanceDisplay provenanceHistory={history} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une entrée</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provenance-type">Type</Label>
                <Select
                  value={provenanceType}
                  onValueChange={value =>
                    setProvenanceType(value as ArtworkProvenance['provenance_type'])
                  }
                >
                  <SelectTrigger id="provenance-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVENANCE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date de l&apos;événement</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-owner">Propriétaire actuel (optionnel)</Label>
              <Input
                id="current-owner"
                value={currentOwnerName}
                onChange={e => setCurrentOwnerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provenance-description">Description</Label>
              <Textarea
                id="provenance-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={createProvenance.isPending}>
              {createProvenance.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter à la provenance
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
