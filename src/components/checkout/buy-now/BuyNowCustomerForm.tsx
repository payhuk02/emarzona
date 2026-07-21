import type { FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { CheckoutFormData } from '@/pages/checkout/buy-now/checkout-buy-now-types';
import { User } from 'lucide-react';

export interface BuyNowCustomerFormProps {
  formData: CheckoutFormData;
  formErrors: Partial<Record<keyof CheckoutFormData, string>>;
  onFieldChange: (field: keyof CheckoutFormData, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  /** Requis pour produits physiques et œuvres (livraison / COD). */
  requireShippingAddress?: boolean;
}

export default function BuyNowCustomerForm({
  formData,
  formErrors,
  onFieldChange,
  onSubmit,
  requireShippingAddress = false,
}: BuyNowCustomerFormProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
          Informations client
        </CardTitle>
        <CardDescription className="text-sm">
          {requireShippingAddress
            ? 'Coordonnées et adresse de livraison pour la commande'
            : 'Vos informations de contact pour la commande'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form id="checkout-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={e => onFieldChange('firstName', e.target.value)}
                placeholder="Votre prénom"
                className={`min-h-[44px] text-base ${formErrors.firstName ? 'border-destructive' : ''}`}
                required
              />
              {formErrors.firstName && (
                <p className="text-sm text-destructive">{formErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={e => onFieldChange('lastName', e.target.value)}
                placeholder="Votre nom"
                className={`min-h-[44px] text-base ${formErrors.lastName ? 'border-destructive' : ''}`}
                required
              />
              {formErrors.lastName && (
                <p className="text-sm text-destructive">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => onFieldChange('email', e.target.value)}
              placeholder="vous@exemple.com"
              className={`min-h-[44px] text-base ${formErrors.email ? 'border-destructive' : ''}`}
              required
            />
            {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Téléphone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={e => onFieldChange('phone', e.target.value)}
              placeholder="+226 XX XX XX XX"
              className={`min-h-[44px] text-base ${formErrors.phone ? 'border-destructive' : ''}`}
              required
            />
            {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="address">
              Adresse
              {requireShippingAddress ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={e => onFieldChange('address', e.target.value)}
              placeholder="123 Rue Example"
              className={`min-h-[44px] text-base ${formErrors.address ? 'border-destructive' : ''}`}
              required={requireShippingAddress}
            />
            {formErrors.address && <p className="text-sm text-destructive">{formErrors.address}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                Ville
                {requireShippingAddress ? <span className="text-destructive"> *</span> : null}
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={e => onFieldChange('city', e.target.value)}
                placeholder="Ouagadougou"
                className={`min-h-[44px] text-base ${formErrors.city ? 'border-destructive' : ''}`}
                required={requireShippingAddress}
              />
              {formErrors.city && <p className="text-sm text-destructive">{formErrors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={e => onFieldChange('postalCode', e.target.value)}
                placeholder="01 BP"
                className="min-h-[44px] text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">
              Pays
              {requireShippingAddress ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Input
              id="country"
              value={formData.country}
              onChange={e => onFieldChange('country', e.target.value)}
              placeholder="Burkina Faso"
              className={`min-h-[44px] text-base ${formErrors.country ? 'border-destructive' : ''}`}
              required={requireShippingAddress}
            />
            {formErrors.country && <p className="text-sm text-destructive">{formErrors.country}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
