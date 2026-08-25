import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import type { ServiceProductFormData } from '@/types/service-product';
import type {
  ServiceBriefField,
  ServiceBriefFieldType,
} from '@/lib/services/service-delivery-commerce';

const BRIEF_TYPES: { value: ServiceBriefFieldType; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'url', label: 'URL' },
  { value: 'file', label: 'Fichier' },
  { value: 'image', label: 'Image' },
  { value: 'select', label: 'Liste' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'date', label: 'Date' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'number', label: 'Nombre' },
];

interface ServiceGigBriefFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

function newBriefId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `brief-${Math.random().toString(36).slice(2, 10)}`;
}

export function ServiceGigBriefForm({ data, onUpdate }: ServiceGigBriefFormProps) {
  const fields = data.brief_fields || [];

  const updateField = (index: number, patch: Partial<ServiceBriefField>) => {
    onUpdate({
      brief_fields: fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Brief client
        </CardTitle>
        <CardDescription>
          Questions posées au client lors de la commande projet. Modifiables plus tard dans
          Dashboard → Offres projet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id || index}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 border p-3 rounded-lg"
          >
            <div className="space-y-1 sm:col-span-2">
              <Label>Libellé</Label>
              <Input
                value={field.label}
                placeholder="Décrivez votre projet"
                onChange={e => updateField(index, { label: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={field.type}
                onValueChange={value =>
                  updateField(index, { type: value as ServiceBriefFieldType })
                }
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent mobileVariant="sheet">
                  {BRIEF_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <Switch
                checked={Boolean(field.required)}
                onCheckedChange={checked => updateField(index, { required: checked })}
              />
              <Label>Obligatoire</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto text-destructive"
                onClick={() => onUpdate({ brief_fields: fields.filter((_, i) => i !== index) })}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={() =>
            onUpdate({
              brief_fields: [
                ...fields,
                { id: newBriefId(), label: '', type: 'text', required: false },
              ],
            })
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une question
        </Button>
      </CardContent>
    </Card>
  );
}
