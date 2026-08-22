/**
 * Public buyer UI: pick delivery package + extras + fill brief (project fulfillment)
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Check, Clock, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { computeProjectQuote } from '@/lib/services/service-delivery-commerce';
import {
  useServiceBriefFields,
  useServiceDeliveryPackages,
  useServiceGigExtras,
} from '@/hooks/service/useServiceDeliveryCommerce';
import { cn } from '@/lib/utils';

interface ServiceProjectOrderPanelProps {
  serviceProductId: string;
  productId: string;
  currency?: string;
  onContinue: (payload: {
    packageId: string;
    packageName: string;
    totalPrice: number;
    totalDays: number;
    extraIds: string[];
    briefAnswers: Record<string, string | boolean>;
  }) => void;
}

export function ServiceProjectOrderPanel({
  serviceProductId,
  productId: _productId,
  currency = 'XOF',
  onContinue,
}: ServiceProjectOrderPanelProps) {
  const { data: packages = [], isLoading: packagesLoading } =
    useServiceDeliveryPackages(serviceProductId);
  const { data: extras = [], isLoading: extrasLoading } = useServiceGigExtras(serviceProductId);
  const { data: briefFields = [] } = useServiceBriefFields(serviceProductId);

  const activePackages = packages.filter(p => p.is_active);
  const activeExtras = extras.filter(e => e.is_active);

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [briefAnswers, setBriefAnswers] = useState<Record<string, string | boolean>>({});

  const selectedPackage =
    activePackages.find(p => p.id === selectedPackageId) ||
    activePackages.find(p => p.is_featured) ||
    activePackages[0] ||
    null;

  const effectivePackageId = selectedPackage?.id ?? null;

  const quote = useMemo(() => {
    if (!selectedPackage) return { totalPrice: 0, totalDays: 0 };
    const indexes = selectedExtraIds
      .map(id => activeExtras.findIndex(e => e.id === id))
      .filter(i => i >= 0);
    return computeProjectQuote({
      packagePrice: selectedPackage.price,
      extras: activeExtras,
      selectedExtraIndexes: indexes,
      deliveryDays: selectedPackage.delivery_days,
    });
  }, [selectedPackage, selectedExtraIds, activeExtras]);

  const missingRequired = briefFields.filter(
    f => f.required && (briefAnswers[f.id] === undefined || briefAnswers[f.id] === '')
  );

  if (packagesLoading || extrasLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de l&apos;offre…</p>;
  }

  if (activePackages.length === 0 && activeExtras.length === 0) {
    return null;
  }

  if (activePackages.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Options supplémentaires</CardTitle>
          <CardDescription>
            Ces extras s’ajoutent à une formule projet. Publiez un package dans Offres projet pour
            permettre la commande.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeExtras.map(extra => (
            <div
              key={extra.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium text-sm">{extra.name}</p>
                {extra.description && (
                  <p className="text-xs text-muted-foreground">{extra.description}</p>
                )}
              </div>
              <p className="text-xs whitespace-nowrap">
                +{formatCurrency(extra.price, extra.currency || currency)}
                {extra.extra_days > 0 ? ` · +${extra.extra_days} j` : ''}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {activePackages.map(pkg => {
          const selected = (effectivePackageId || selectedPackageId) === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedPackageId(pkg.id)}
              className={cn(
                'text-left rounded-xl border p-4 transition-colors min-h-[44px]',
                selected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold">{pkg.name}</span>
                {pkg.is_featured && <Badge>Populaire</Badge>}
              </div>
              <p className="text-lg font-bold">{formatCurrency(pkg.price, currency)}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {pkg.delivery_days} j
                </span>
                <span className="inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> {pkg.revisions} rév.
                </span>
              </div>
              {pkg.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pkg.description}</p>
              )}
              <ul className="mt-3 space-y-1">
                {pkg.features.slice(0, 5).map(feat => (
                  <li key={feat} className="text-xs flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {activeExtras.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Extras</CardTitle>
            <CardDescription>Options supplémentaires (prix & délai)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeExtras.map(extra => {
              const checked = selectedExtraIds.includes(extra.id);
              return (
                <label
                  key={extra.id}
                  className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={v => {
                      setSelectedExtraIds(prev =>
                        v ? [...prev, extra.id] : prev.filter(id => id !== extra.id)
                      );
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{extra.name}</p>
                    {extra.description && (
                      <p className="text-xs text-muted-foreground">{extra.description}</p>
                    )}
                    <p className="text-xs mt-1">
                      +{formatCurrency(extra.price, extra.currency || currency)}
                      {extra.extra_days > 0 ? ` · +${extra.extra_days} j` : ''}
                    </p>
                  </div>
                </label>
              );
            })}
          </CardContent>
        </Card>
      )}

      {briefFields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Brief</CardTitle>
            <CardDescription>Informations pour démarrer la prestation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {briefFields.map(field => (
              <div key={field.id} className="space-y-1.5">
                <Label>
                  {field.label}
                  {field.required ? ' *' : ''}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={String(briefAnswers[field.id] ?? '')}
                    onChange={e =>
                      setBriefAnswers(prev => ({ ...prev, [field.id]: e.target.value }))
                    }
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={String(briefAnswers[field.id] ?? '')}
                    onValueChange={v => setBriefAnswers(prev => ({ ...prev, [field.id]: v }))}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map(opt => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={Boolean(briefAnswers[field.id])}
                      onCheckedChange={v =>
                        setBriefAnswers(prev => ({ ...prev, [field.id]: Boolean(v) }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">Oui</span>
                  </div>
                ) : (
                  <Input
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'date'
                          ? 'date'
                          : field.type === 'phone'
                            ? 'tel'
                            : field.type === 'url'
                              ? 'url'
                              : 'text'
                    }
                    value={String(briefAnswers[field.id] ?? '')}
                    onChange={e =>
                      setBriefAnswers(prev => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="min-h-[44px]"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Total estimé</p>
            <p className="text-2xl font-bold">{formatCurrency(quote.totalPrice, currency)}</p>
            <p className="text-xs text-muted-foreground">Délai : {quote.totalDays} jour(s)</p>
          </div>
          <Button
            className="min-h-[44px]"
            disabled={!selectedPackage || missingRequired.length > 0}
            onClick={() => {
              if (!selectedPackage) return;
              onContinue({
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                totalPrice: quote.totalPrice,
                totalDays: quote.totalDays,
                extraIds: selectedExtraIds,
                briefAnswers,
              });
            }}
          >
            Continuer vers le paiement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
