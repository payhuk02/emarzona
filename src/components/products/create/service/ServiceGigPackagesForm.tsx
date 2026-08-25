import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Package } from 'lucide-react';
import type { ServiceProductFormData } from '@/types/service-product';
import {
  createDefaultGigPackageDrafts,
  type ServiceGigPackageDraft,
} from '@/lib/services/service-gig-package-drafts';

interface ServiceGigPackagesFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

export function ServiceGigPackagesForm({ data, onUpdate }: ServiceGigPackagesFormProps) {
  const packages = data.delivery_packages || [];
  const currency = data.currency || 'XOF';

  useEffect(() => {
    if (packages.length > 0) return;
    const base = Number(data.promotional_price || data.price || 0);
    onUpdate({ delivery_packages: createDefaultGigPackageDrafts(base) });
  }, [packages.length, data.promotional_price, data.price, onUpdate]);

  const updatePackage = (index: number, patch: Partial<ServiceGigPackageDraft>) => {
    onUpdate({
      delivery_packages: packages.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Formules Basic / Standard / Premium
        </CardTitle>
        <CardDescription>
          Comme sur Fiverr : le client choisit une formule. Le prix catalogue est aligné sur le
          tarif le plus bas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {packages.map((pkg, index) => (
          <div key={`${pkg.tier}-${index}`} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{pkg.name || pkg.tier}</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Mise en avant</Label>
                <Switch
                  checked={pkg.is_featured}
                  onCheckedChange={checked => updatePackage(index, { is_featured: checked })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nom</Label>
                <Input
                  value={pkg.name}
                  onChange={e => updatePackage(index, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Prix ({currency})</Label>
                <Input
                  type="number"
                  min={0}
                  value={pkg.price || ''}
                  onChange={e => updatePackage(index, { price: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label>Délai (jours)</Label>
                <Input
                  type="number"
                  min={1}
                  value={pkg.delivery_days || ''}
                  onChange={e =>
                    updatePackage(index, { delivery_days: Number(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Révisions</Label>
                <Input
                  type="number"
                  min={0}
                  value={pkg.revisions}
                  onChange={e => updatePackage(index, { revisions: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Inclus (une ligne par point)</Label>
              <Textarea
                rows={3}
                value={pkg.featuresText}
                onChange={e => updatePackage(index, { featuresText: e.target.value })}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
