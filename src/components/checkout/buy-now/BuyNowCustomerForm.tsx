import type { FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { CheckoutFormData } from '@/pages/checkout/buy-now/checkout-buy-now-types';
import { User, MapPin, Mail, Phone } from 'lucide-react';

export interface BuyNowCustomerFormProps {
  formData: CheckoutFormData;
  formErrors: Partial<Record<keyof CheckoutFormData, string>>;
  onFieldChange: (field: keyof CheckoutFormData, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  /** Requis pour produits physiques et œuvres (livraison / COD). */
  requireShippingAddress?: boolean;
}

type FieldProps = {
  id: keyof CheckoutFormData;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel';
  onChange: (value: string) => void;
};

function Field({
  id,
  label,
  value,
  error,
  required = false,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  onChange,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`min-h-[46px] text-base rounded-lg bg-background/60 transition-shadow focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.08)] ${
          error ? 'border-destructive focus-visible:ring-destructive' : ''
        }`}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function BuyNowCustomerForm({
  formData,
  formErrors,
  onFieldChange,
  onSubmit,
  requireShippingAddress = false,
}: BuyNowCustomerFormProps) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="p-5 sm:p-7 pb-4 sm:pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl tracking-tight">Informations client</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              {requireShippingAddress
                ? 'Coordonnées et adresse de livraison'
                : 'Vos informations de contact — rapide et sans compte'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-7 pt-0 sm:pt-0">
        <form id="checkout-form" onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field
              id="firstName"
              label="Prénom"
              value={formData.firstName}
              error={formErrors.firstName}
              required
              placeholder="Votre prénom"
              autoComplete="given-name"
              onChange={v => onFieldChange('firstName', v)}
            />
            <Field
              id="lastName"
              label="Nom"
              value={formData.lastName}
              error={formErrors.lastName}
              required
              placeholder="Votre nom"
              autoComplete="family-name"
              onChange={v => onFieldChange('lastName', v)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Email
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={e => onFieldChange('email', e.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                inputMode="email"
                required
                aria-invalid={formErrors.email ? true : undefined}
                className={`min-h-[46px] text-base rounded-lg bg-background/60 ${
                  formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
              />
              {formErrors.email ? (
                <p className="text-sm text-destructive" role="alert">
                  {formErrors.email}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Votre reçu et l’accès à votre achat seront envoyés à cette adresse.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground/90">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Téléphone
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={e => onFieldChange('phone', e.target.value)}
                placeholder="+226 XX XX XX XX"
                autoComplete="tel"
                inputMode="tel"
                required
                aria-invalid={formErrors.phone ? true : undefined}
                className={`min-h-[46px] text-base rounded-lg bg-background/60 ${
                  formErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
              />
              {formErrors.phone ? (
                <p className="text-sm text-destructive" role="alert">
                  {formErrors.phone}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Utilisé pour la confirmation du paiement mobile money.
                </p>
              )}
            </div>
          </div>

          {requireShippingAddress && (
            <>
              <Separator className="my-1" />

              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base tracking-tight">
                    Adresse de livraison
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Où souhaitez-vous recevoir votre commande ?
                  </p>
                </div>
              </div>

              <Field
                id="address"
                label="Adresse"
                value={formData.address}
                error={formErrors.address}
                required
                placeholder="123 Rue Example"
                autoComplete="address-line1"
                onChange={v => onFieldChange('address', v)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <Field
                  id="city"
                  label="Ville"
                  value={formData.city}
                  error={formErrors.city}
                  required
                  placeholder="Ouagadougou"
                  autoComplete="address-level2"
                  onChange={v => onFieldChange('city', v)}
                />
                <Field
                  id="postalCode"
                  label="Code postal"
                  value={formData.postalCode}
                  placeholder="01 BP"
                  autoComplete="postal-code"
                  onChange={v => onFieldChange('postalCode', v)}
                />
              </div>

              <Field
                id="country"
                label="Pays"
                value={formData.country}
                error={formErrors.country}
                required
                placeholder="Burkina Faso"
                autoComplete="country-name"
                onChange={v => onFieldChange('country', v)}
              />
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
