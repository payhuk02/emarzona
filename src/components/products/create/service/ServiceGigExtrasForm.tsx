import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import type { ServiceProductFormData } from '@/types/service-product';
import type { ServiceGigExtraDraft } from '@/lib/services/service-gig-package-drafts';

interface ServiceGigExtrasFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

const EMPTY_EXTRA: ServiceGigExtraDraft = {
  name: '',
  description: '',
  price: 0,
  extra_days: 1,
};

export function ServiceGigExtrasForm({ data, onUpdate }: ServiceGigExtrasFormProps) {
  const extras = data.gig_extras || [];
  const currency = data.currency || 'XOF';

  const updateExtra = (index: number, patch: Partial<ServiceGigExtraDraft>) => {
    onUpdate({
      gig_extras: extras.map((extra, i) => (i === index ? { ...extra, ...patch } : extra)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Extras (optionnel)
        </CardTitle>
        <CardDescription>
          Options payantes que le client peut ajouter (livraison express, fichier source, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {extras.map((extra, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end rounded-lg border p-3"
          >
            <div className="sm:col-span-2 space-y-1">
              <Label>Nom</Label>
              <Input
                value={extra.name}
                placeholder="Livraison express"
                onChange={e => updateExtra(index, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Prix ({currency})</Label>
              <Input
                type="number"
                min={0}
                value={extra.price || ''}
                onChange={e => updateExtra(index, { price: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex gap-2 items-end">
              <div className="space-y-1 flex-1">
                <Label>+ jours</Label>
                <Input
                  type="number"
                  min={0}
                  value={extra.extra_days}
                  onChange={e => updateExtra(index, { extra_days: Number(e.target.value) || 0 })}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-destructive"
                onClick={() => onUpdate({ gig_extras: extras.filter((_, i) => i !== index) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onUpdate({ gig_extras: [...extras, { ...EMPTY_EXTRA }] })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un extra
        </Button>
      </CardContent>
    </Card>
  );
}
