/**
 * Gestion vendeur des produits complémentaires service (Phase 4).
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { PackagePlus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateServiceProductAddon,
  useDeleteServiceProductAddon,
  useServiceAddonProductPicker,
  useServiceProductAddons,
} from '@/hooks/service/useServiceProductAddons';

interface ServiceProductAddonsManagerProps {
  storeId: string;
  services: Array<{
    serviceProductId: string;
    productId: string;
    name: string;
  }>;
}

export function ServiceProductAddonsManager({
  storeId,
  services,
}: ServiceProductAddonsManagerProps) {
  const { toast } = useToast();
  const [selectedServiceProductId, setSelectedServiceProductId] = useState(
    services[0]?.serviceProductId ?? ''
  );
  const [pickerProductId, setPickerProductId] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const selectedService = useMemo(
    () => services.find(s => s.serviceProductId === selectedServiceProductId),
    [services, selectedServiceProductId]
  );

  const { data: addons = [], isLoading } = useServiceProductAddons(selectedServiceProductId);
  const { data: pickerProducts = [], isLoading: pickerLoading } = useServiceAddonProductPicker(
    storeId,
    selectedService?.productId
  );

  const createAddon = useCreateServiceProductAddon(selectedServiceProductId);
  const deleteAddon = useDeleteServiceProductAddon(selectedServiceProductId);

  const availableProducts = pickerProducts.filter(
    p => !addons.some(a => a.addon_product_id === p.id)
  );

  const handleAdd = async () => {
    if (!selectedServiceProductId || !pickerProductId) return;
    try {
      await createAddon.mutateAsync({
        serviceProductId: selectedServiceProductId,
        addonProductId: pickerProductId,
        storeId,
        isRequired,
        displayOrder: addons.length,
      });
      setPickerProductId('');
      setIsRequired(false);
      toast({ title: 'Produit complémentaire ajouté' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible d’ajouter le produit',
        variant: 'destructive',
      });
    }
  };

  if (!services.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun service actif dans cette boutique.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PackagePlus className="h-5 w-5" />
          Produits complémentaires
        </CardTitle>
        <CardDescription>
          Proposez des articles digital ou physique en option lors d’une réservation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Service</Label>
          <Select value={selectedServiceProductId} onValueChange={setSelectedServiceProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un service" />
            </SelectTrigger>
            <SelectContent>
              {services.map(s => (
                <SelectItem key={s.serviceProductId} value={s.serviceProductId}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <ul className="space-y-2">
            {addons.length === 0 && (
              <li className="text-sm text-muted-foreground">Aucun complément configuré.</li>
            )}
            {addons.map(row => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.addon.name}</span>
                  <Badge variant="secondary" className="capitalize">
                    {row.addon.product_type}
                  </Badge>
                  {row.is_required && <Badge variant="outline">Obligatoire</Badge>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Retirer ${row.addon.name}`}
                  disabled={deleteAddon.isPending}
                  onClick={() => void deleteAddon.mutateAsync(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Ajouter un produit</p>
          <Select value={pickerProductId} onValueChange={setPickerProductId}>
            <SelectTrigger disabled={pickerLoading || availableProducts.length === 0}>
              <SelectValue
                placeholder={
                  pickerLoading
                    ? 'Chargement…'
                    : availableProducts.length
                      ? 'Choisir un produit'
                      : 'Aucun produit éligible'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.product_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="addon-required"
              checked={isRequired}
              onCheckedChange={v => setIsRequired(v === true)}
            />
            <Label htmlFor="addon-required" className="text-sm font-normal">
              Obligatoire avec la réservation
            </Label>
          </div>
          <Button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!pickerProductId || createAddon.isPending}
          >
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
