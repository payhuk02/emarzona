import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import {
  STORE_COMMERCE_TYPE_LABELS,
  type StoreCommerceType,
} from '@/constants/store-commerce-types';
import { generateSlug } from '@/lib/store-utils';
import {
  isStoreSlugAvailable,
  normalizeStoreCreateInput,
  validateNormalizedCreateInput,
  type StoreCreateInput,
} from '@/lib/store/create-store-service';
import { RequireTermsConsent } from '@/components/store/RequireTermsConsent';

export type StoreCreateFormValues = {
  name: string;
  description: string;
  slug: string;
  commerceType: StoreCommerceType;
};

type StoreCreateFormProps = {
  saving?: boolean;
  onSubmit: (values: StoreCreateFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function StoreCreateForm({
  saving = false,
  onSubmit,
  onCancel,
  submitLabel = 'Créer la boutique',
}: StoreCreateFormProps) {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const [values, setValues] = useState<StoreCreateFormValues>({
    name: '',
    description: '',
    slug: '',
    commerceType: 'physical',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const effectiveSlug = useMemo(
    () => generateSlug(values.slug.trim() || values.name),
    [values.slug, values.name]
  );

  useEffect(() => {
    if (!effectiveSlug || effectiveSlug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const available = await isStoreSlugAvailable(effectiveSlug);
        if (!cancelled) {
          setSlugAvailable(available);
        }
      } catch {
        if (!cancelled) {
          setSlugAvailable(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSlug(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [effectiveSlug]);

  const validateFields = useCallback(() => {
    try {
      const normalized = normalizeStoreCreateInput({
        name: values.name,
        slug: values.slug,
        description: values.description,
        commerce_type: values.commerceType,
      });
      const result = validateNormalizedCreateInput(normalized);
      if (!result.valid) {
        setFieldErrors(result.errors);
        return false;
      }
      setFieldErrors({});
      return true;
    } catch (error) {
      setFieldErrors({
        _general: error instanceof Error ? error.message : 'Données invalides',
      });
      return false;
    }
  }, [values]);

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }
    if (slugAvailable === false) {
      setFieldErrors({ slug: 'Ce slug est déjà utilisé ou réservé' });
      return;
    }

    await onSubmit({
      ...values,
      slug: effectiveSlug,
    });
  };

  return (
    <div className="space-y-4">
      {fieldErrors._general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fieldErrors._general}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="commerce_type">Type de boutique *</Label>
        <Select
          value={values.commerceType}
          onValueChange={value =>
            setValues(prev => ({ ...prev, commerceType: value as StoreCommerceType }))
          }
        >
          <SelectTrigger id="commerce_type">
            <SelectValue placeholder="Choisir un type de boutique" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STORE_COMMERCE_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          L&apos;abonnement est requis uniquement pour le type Produits physiques.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-create-name">Nom de la boutique *</Label>
        <Input
          id="store-create-name"
          value={values.name}
          onChange={e => {
            const name = e.target.value;
            setValues(prev => ({
              ...prev,
              name,
              slug: slugTouched ? prev.slug : generateSlug(name),
            }));
          }}
          onKeyDown={handleSpaceKeyDown}
          placeholder="Ex: Ma Boutique Digitale"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-create-slug">URL de la boutique *</Label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">.myemarzona.shop/</span>
          <div className="relative flex-1">
            <Input
              id="store-create-slug"
              value={values.slug}
              onChange={e => {
                setSlugTouched(true);
                setValues(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
              }}
              placeholder="ma-boutique-digitale"
              aria-invalid={!!fieldErrors.slug || slugAvailable === false}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCheckingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!isCheckingSlug && slugAvailable === true && (
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Slug disponible" />
              )}
              {!isCheckingSlug && slugAvailable === false && (
                <XCircle className="h-4 w-4 text-destructive" aria-label="Slug indisponible" />
              )}
            </div>
          </div>
        </div>
        {fieldErrors.slug && <p className="text-sm text-destructive">{fieldErrors.slug}</p>}
        {!fieldErrors.slug && slugAvailable === false && (
          <p className="text-sm text-destructive">Ce slug est déjà utilisé ou réservé.</p>
        )}
        {effectiveSlug && (
          <p className="text-xs text-muted-foreground">Aperçu : {effectiveSlug}.myemarzona.shop</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-create-description">Description</Label>
        <Textarea
          id="store-create-description"
          value={values.description}
          onChange={e => setValues(prev => ({ ...prev, description: e.target.value }))}
          onKeyDown={handleSpaceKeyDown}
          placeholder="Décrivez votre boutique..."
          rows={3}
        />
        {fieldErrors.description && (
          <p className="text-sm text-destructive">{fieldErrors.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <RequireTermsConsent actionLabel="créer une boutique">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !values.name.trim() || slugAvailable === false || isCheckingSlug}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {submitLabel}
          </Button>
        </RequireTermsConsent>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
}

export type { StoreCreateInput };
