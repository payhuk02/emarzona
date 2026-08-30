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
import { MousePointerClick } from 'lucide-react';
import {
  DEFAULT_SERVICE_CTA_LABEL,
  SERVICE_CTA_BUTTON_PRESETS,
} from '@/constants/service-checkout-options';
import { normalizeServiceCtaButtonLabel } from '@/lib/service/service-checkout-display';

export interface ServiceCtaButtonFieldsProps {
  value?: string | null;
  onChange: (label: string) => void;
  compact?: boolean;
}

export function ServiceCtaButtonFields({
  value,
  onChange,
  compact = false,
}: ServiceCtaButtonFieldsProps) {
  const serviceCtaLabel = normalizeServiceCtaButtonLabel(value);
  const isPreset = SERVICE_CTA_BUTTON_PRESETS.includes(
    serviceCtaLabel as (typeof SERVICE_CTA_BUTTON_PRESETS)[number]
  );

  const fields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-cta-preset">Suggestions</Label>
        <Select
          value={isPreset ? serviceCtaLabel : 'custom'}
          onValueChange={preset => {
            if (preset !== 'custom') onChange(preset);
          }}
        >
          <SelectTrigger id="service-cta-preset">
            <SelectValue placeholder="Choisir un libellé" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_CTA_BUTTON_PRESETS.map(label => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Personnalisé…</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-cta-custom">Libellé affiché sur la carte</Label>
        <Input
          id="service-cta-custom"
          value={serviceCtaLabel}
          maxLength={40}
          onChange={e => onChange(e.target.value)}
          placeholder="Ex. Voir les formules"
        />
        <p className="text-xs text-muted-foreground">
          Aperçu :{' '}
          <span className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs text-white">
            {serviceCtaLabel || DEFAULT_SERVICE_CTA_LABEL}
          </span>
        </p>
      </div>
    </div>
  );

  if (compact) return fields;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MousePointerClick className="h-5 w-5" />
          Bouton sur la carte marketplace
        </CardTitle>
        <CardDescription>
          Ce libellé remplace le bouton principal sur la carte produit. Il mène vos clients vers la
          fiche service complète (formules, détails, brief) avant le paiement.
        </CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
