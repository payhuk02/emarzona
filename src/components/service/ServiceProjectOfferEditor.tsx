/**
 * Seller editor: delivery packages + gig extras + brief fields (project fulfillment)
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, Package, Sparkles, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useReplaceDeliveryPackages,
  useReplaceGigExtras,
  useServiceBriefFields,
  useServiceDeliveryPackages,
  useServiceGigExtras,
  useUpdateServiceBriefFields,
  type ServiceBriefField,
} from '@/hooks/service/useServiceDeliveryCommerce';
import type { ServiceBriefFieldType } from '@/lib/services/service-delivery-commerce';
import { createDefaultGigPackageDrafts } from '@/lib/services/service-gig-package-drafts';

type DraftExtra = {
  name: string;
  description: string;
  price: number;
  extra_days: number;
};

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

interface ServiceProjectOfferEditorProps {
  serviceProductId: string;
  productId: string;
  storeId: string;
  currency?: string;
}

export function ServiceProjectOfferEditor({
  serviceProductId,
  productId,
  storeId,
  currency = 'XOF',
}: ServiceProjectOfferEditorProps) {
  const { toast } = useToast();
  const { data: packages = [], isLoading: packagesLoading } =
    useServiceDeliveryPackages(serviceProductId);
  const { data: extras = [], isLoading: extrasLoading } = useServiceGigExtras(serviceProductId);
  const { data: briefFields = [], isLoading: briefLoading } =
    useServiceBriefFields(serviceProductId);

  const replacePackages = useReplaceDeliveryPackages(serviceProductId);
  const replaceExtras = useReplaceGigExtras(serviceProductId);
  const updateBrief = useUpdateServiceBriefFields(serviceProductId);

  const [draftPackages, setDraftPackages] = useState(createDefaultGigPackageDrafts(15000));
  const [draftExtras, setDraftExtras] = useState<DraftExtra[]>([]);
  const [draftBrief, setDraftBrief] = useState<ServiceBriefField[]>([]);

  useEffect(() => {
    if (packagesLoading) return;
    if (packages.length > 0) {
      setDraftPackages(
        packages.map(pkg => ({
          name: pkg.name,
          tier: pkg.tier,
          description: pkg.description ?? '',
          price: pkg.price,
          delivery_days: pkg.delivery_days,
          revisions: pkg.revisions,
          featuresText: pkg.features.join('\n'),
          is_featured: pkg.is_featured,
        }))
      );
    }
  }, [packages, packagesLoading]);

  useEffect(() => {
    if (extrasLoading) return;
    setDraftExtras(
      extras.map(e => ({
        name: e.name,
        description: e.description ?? '',
        price: e.price,
        extra_days: e.extra_days,
      }))
    );
  }, [extras, extrasLoading]);

  useEffect(() => {
    if (briefLoading) return;
    setDraftBrief(briefFields);
  }, [briefFields, briefLoading]);

  const handleSaveAll = async () => {
    try {
      await replacePackages.mutateAsync({
        serviceProductId,
        productId,
        storeId,
        packages: draftPackages.map((pkg, index) => ({
          name: pkg.name,
          tier: pkg.tier,
          description: pkg.description,
          price: pkg.price,
          delivery_days: pkg.delivery_days,
          revisions: pkg.revisions,
          features: pkg.featuresText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
          is_featured: pkg.is_featured,
          sort_order: index,
        })),
      });
      await replaceExtras.mutateAsync({
        serviceProductId,
        storeId,
        extras: draftExtras.map((extra, index) => ({
          name: extra.name,
          description: extra.description,
          price: extra.price,
          extra_days: extra.extra_days,
          currency,
          display_order: index,
        })),
      });
      await updateBrief.mutateAsync(draftBrief);
      toast({
        title: 'Offre projet enregistrée',
        description: 'Packages, extras et brief à jour.',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Enregistrement impossible',
        variant: 'destructive',
      });
    }
  };

  const saving = replacePackages.isPending || replaceExtras.isPending || updateBrief.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Packages (Basic / Standard / Premium)
          </CardTitle>
          <CardDescription>
            Définissez les niveaux d&apos;offre pour les prestations sur projet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {draftPackages.map((pkg, index) => (
            <div key={`${pkg.tier}-${index}`} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={pkg.is_featured ? 'default' : 'outline'}>{pkg.tier}</Badge>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Populaire</Label>
                  <Switch
                    checked={pkg.is_featured}
                    onCheckedChange={v =>
                      setDraftPackages(prev =>
                        prev.map((p, i) => (i === index ? { ...p, is_featured: v } : p))
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive"
                    onClick={() => setDraftPackages(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nom</Label>
                  <Input
                    value={pkg.name}
                    onChange={e =>
                      setDraftPackages(prev =>
                        prev.map((p, i) => (i === index ? { ...p, name: e.target.value } : p))
                      )
                    }
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prix ({currency})</Label>
                  <Input
                    type="number"
                    value={pkg.price}
                    onChange={e =>
                      setDraftPackages(prev =>
                        prev.map((p, i) =>
                          i === index ? { ...p, price: Number(e.target.value) || 0 } : p
                        )
                      )
                    }
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Délai (jours)</Label>
                  <Input
                    type="number"
                    value={pkg.delivery_days}
                    onChange={e =>
                      setDraftPackages(prev =>
                        prev.map((p, i) =>
                          i === index ? { ...p, delivery_days: Number(e.target.value) || 0 } : p
                        )
                      )
                    }
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Révisions</Label>
                  <Input
                    type="number"
                    value={pkg.revisions}
                    onChange={e =>
                      setDraftPackages(prev =>
                        prev.map((p, i) =>
                          i === index ? { ...p, revisions: Number(e.target.value) || 0 } : p
                        )
                      )
                    }
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  value={pkg.description}
                  onChange={e =>
                    setDraftPackages(prev =>
                      prev.map((p, i) => (i === index ? { ...p, description: e.target.value } : p))
                    )
                  }
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Fonctionnalités (une par ligne)</Label>
                <Textarea
                  value={pkg.featuresText}
                  onChange={e =>
                    setDraftPackages(prev =>
                      prev.map((p, i) => (i === index ? { ...p, featuresText: e.target.value } : p))
                    )
                  }
                  rows={3}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            onClick={() =>
              setDraftPackages(prev => [
                ...prev,
                {
                  name: 'Custom',
                  tier: 'custom',
                  description: '',
                  price: 0,
                  delivery_days: 7,
                  revisions: 1,
                  featuresText: '',
                  is_featured: false,
                },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un package
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Extras
          </CardTitle>
          <CardDescription>Options payantes avec délai supplémentaire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draftExtras.map((extra, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end border p-3 rounded-lg"
            >
              <div className="sm:col-span-2 space-y-1">
                <Label>Nom</Label>
                <Input
                  value={extra.name}
                  onChange={e =>
                    setDraftExtras(prev =>
                      prev.map((x, i) => (i === index ? { ...x, name: e.target.value } : x))
                    )
                  }
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Prix</Label>
                <Input
                  type="number"
                  value={extra.price}
                  onChange={e =>
                    setDraftExtras(prev =>
                      prev.map((x, i) =>
                        i === index ? { ...x, price: Number(e.target.value) || 0 } : x
                      )
                    )
                  }
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex gap-2">
                <div className="space-y-1 flex-1">
                  <Label>+ jours</Label>
                  <Input
                    type="number"
                    value={extra.extra_days}
                    onChange={e =>
                      setDraftExtras(prev =>
                        prev.map((x, i) =>
                          i === index ? { ...x, extra_days: Number(e.target.value) || 0 } : x
                        )
                      )
                    }
                    className="min-h-[44px]"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 text-destructive"
                  onClick={() => setDraftExtras(prev => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            onClick={() =>
              setDraftExtras(prev => [
                ...prev,
                { name: '', description: '', price: 0, extra_days: 1 },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un extra
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Brief client
          </CardTitle>
          <CardDescription>
            Questions demandées au client avant ou après la commande.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draftBrief.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 border p-3 rounded-lg"
            >
              <div className="space-y-1 sm:col-span-2">
                <Label>Libellé</Label>
                <Input
                  value={field.label}
                  onChange={e =>
                    setDraftBrief(prev =>
                      prev.map((f, i) => (i === index ? { ...f, label: e.target.value } : f))
                    )
                  }
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={field.type}
                  onValueChange={v =>
                    setDraftBrief(prev =>
                      prev.map((f, i) =>
                        i === index ? { ...f, type: v as ServiceBriefFieldType } : f
                      )
                    )
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRIEF_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-3">
                <Switch
                  checked={Boolean(field.required)}
                  onCheckedChange={v =>
                    setDraftBrief(prev =>
                      prev.map((f, i) => (i === index ? { ...f, required: v } : f))
                    )
                  }
                />
                <Label>Obligatoire</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-destructive"
                  onClick={() => setDraftBrief(prev => prev.filter((_, i) => i !== index))}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            onClick={() =>
              setDraftBrief(prev => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  label: '',
                  type: 'text',
                  required: true,
                },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter une question
          </Button>
        </CardContent>
      </Card>

      <Button
        onClick={() => void handleSaveAll()}
        disabled={saving}
        className="min-h-[44px] w-full sm:w-auto"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Enregistrement…' : 'Enregistrer packages, extras et brief'}
      </Button>
    </div>
  );
}
