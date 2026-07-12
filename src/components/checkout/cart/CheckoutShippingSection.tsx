import type { Dispatch, SetStateAction } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GiftCardInput from '@/components/checkout/GiftCardInput';
import { FormFieldWithValidation } from '@/components/checkout/FormFieldWithValidation';
import type { AppliedGiftCard, ShippingAddress } from '@/pages/checkout/cart/checkout-types';
import { validateShippingField } from '@/pages/checkout/cart/checkout-validation';

export interface CheckoutShippingSectionProps {
  formData: ShippingAddress;
  setFormData: Dispatch<SetStateAction<ShippingAddress>>;
  formErrors: Partial<Record<keyof ShippingAddress, string>>;
  setFormErrors: Dispatch<SetStateAction<Partial<Record<keyof ShippingAddress, string>>>>;
  storeId: string | null;
  appliedGiftCard: AppliedGiftCard | null;
  onGiftCardApply: (id: string, balance: number, code: string) => void;
  onGiftCardRemove: () => void;
}

export default function CheckoutShippingSection({
  formData,
  setFormData,
  formErrors,
  setFormErrors,
  storeId,
  appliedGiftCard,
  onGiftCardApply,
  onGiftCardRemove,
}: CheckoutShippingSectionProps) {
  const validateField = validateShippingField;

  return (
    <Card role="region" aria-labelledby="shipping-title" aria-describedby="shipping-description">
      <CardHeader>
        <CardTitle
          id="shipping-title"
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg"
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
          Informations de livraison
        </CardTitle>
        <CardDescription id="shipping-description">
          Où souhaitez-vous recevoir votre commande ?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldWithValidation
            label="Nom complet"
            name="full_name"
            value={formData.full_name}
            onChange={value => {
              setFormData(prev => ({ ...prev, full_name: value }));
              if (formErrors.full_name) {
                const error = validateField('full_name', value);
                setFormErrors(prev => ({ ...prev, full_name: error || undefined }));
              }
            }}
            onBlur={() => {
              const error = validateField('full_name', formData.full_name);
              setFormErrors(prev => ({ ...prev, full_name: error || undefined }));
            }}
            error={formErrors.full_name}
            placeholder="Jean Dupont"
            required
            autoComplete="name"
            validationRules={[
              value => (!value.trim() ? 'Le nom complet est requis' : null),
              value =>
                value.trim().length < 2 ? 'Le nom doit contenir au moins 2 caractères' : null,
            ]}
          />
          <FormFieldWithValidation
            label="Email"
            name="email"
            value={formData.email}
            onChange={value => {
              setFormData(prev => ({ ...prev, email: value }));
              if (formErrors.email) {
                const error = validateField('email', value);
                setFormErrors(prev => ({ ...prev, email: error || undefined }));
              }
            }}
            onBlur={() => {
              const error = validateField('email', formData.email);
              setFormErrors(prev => ({ ...prev, email: error || undefined }));
            }}
            error={formErrors.email}
            type="email"
            placeholder="jean@example.com"
            required
            autoComplete="email"
            validationRules={[
              value => (!value.trim() ? "L'email est requis" : null),
              value =>
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Format d'email invalide" : null,
            ]}
          />
        </div>

        <FormFieldWithValidation
          label="Téléphone"
          name="phone"
          value={formData.phone}
          onChange={value => {
            setFormData(prev => ({ ...prev, phone: value }));
            if (formErrors.phone) {
              const error = validateField('phone', value);
              setFormErrors(prev => ({ ...prev, phone: error || undefined }));
            }
          }}
          onBlur={() => {
            const error = validateField('phone', formData.phone);
            setFormErrors(prev => ({ ...prev, phone: error || undefined }));
          }}
          error={formErrors.phone}
          type="tel"
          placeholder="+226 07 12 34 56 78"
          required
          autoComplete="tel"
          validationRules={[
            value => (!value.trim() ? 'Le téléphone est requis' : null),
            value =>
              !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
                value.replace(/\s/g, '')
              )
                ? 'Format de téléphone invalide'
                : null,
          ]}
        />

        <Separator />

        <FormFieldWithValidation
          label="Adresse"
          name="address_line1"
          value={formData.address_line1}
          onChange={value => {
            setFormData(prev => ({ ...prev, address_line1: value }));
            if (formErrors.address_line1) {
              const error = validateField('address_line1', value);
              setFormErrors(prev => ({ ...prev, address_line1: error || undefined }));
            }
          }}
          onBlur={() => {
            const error = validateField('address_line1', formData.address_line1);
            setFormErrors(prev => ({ ...prev, address_line1: error || undefined }));
          }}
          error={formErrors.address_line1}
          placeholder="123 Rue principale"
          required
          autoComplete="street-address"
          validationRules={[
            value => (!value.trim() ? "L'adresse est requise" : null),
            value =>
              value.trim().length < 5 ? "L'adresse doit contenir au moins 5 caractères" : null,
          ]}
        />

        <div className="space-y-2">
          <Label htmlFor="address_line2">Complément d'adresse (optionnel)</Label>
          <Input
            id="address_line2"
            value={formData.address_line2}
            onChange={e => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
            placeholder="Appartement, étage, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormFieldWithValidation
            label="Ville"
            name="city"
            value={formData.city}
            onChange={value => {
              setFormData(prev => ({ ...prev, city: value }));
              if (formErrors.city) {
                const error = validateField('city', value);
                setFormErrors(prev => ({ ...prev, city: error || undefined }));
              }
            }}
            onBlur={() => {
              const error = validateField('city', formData.city);
              setFormErrors(prev => ({ ...prev, city: error || undefined }));
            }}
            error={formErrors.city}
            placeholder="Ouagadougou"
            required
            autoComplete="address-level2"
            validationRules={[
              value => (!value.trim() ? 'La ville est requise' : null),
              value =>
                value.trim().length < 2 ? 'La ville doit contenir au moins 2 caractères' : null,
            ]}
          />
          <FormFieldWithValidation
            label="Code postal"
            name="postal_code"
            value={formData.postal_code}
            onChange={value => {
              setFormData(prev => ({ ...prev, postal_code: value }));
              if (formErrors.postal_code) {
                const error = validateField('postal_code', value);
                setFormErrors(prev => ({ ...prev, postal_code: error || undefined }));
              }
            }}
            onBlur={() => {
              const error = validateField('postal_code', formData.postal_code);
              setFormErrors(prev => ({ ...prev, postal_code: error || undefined }));
            }}
            error={formErrors.postal_code}
            placeholder="01 BP 1234"
            required
            autoComplete="postal-code"
            validationRules={[
              value => (!value.trim() ? 'Le code postal est requis' : null),
              value =>
                value.trim().length < 3
                  ? 'Le code postal doit contenir au moins 3 caractères'
                  : null,
            ]}
          />
          <div className="space-y-2">
            <Label htmlFor="country">
              Pays <span className="text-red-500">*</span>
            </Label>
            <select
              id="country"
              value={formData.country}
              onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className={`flex min-h-[44px] h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base touch-manipulation cursor-pointer ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.country ? 'border-red-500' : ''}`}
              aria-invalid={!!formErrors.country}
              aria-describedby={formErrors.country ? 'country-error' : undefined}
              autoComplete="country"
            >
              <option value="BF">Burkina Faso</option>
              <option value="CI">Côte d'Ivoire</option>
              <option value="SN">Sénégal</option>
              <option value="ML">Mali</option>
              <option value="BJ">Bénin</option>
              <option value="TG">Togo</option>
              <option value="GN">Guinée</option>
              <option value="NE">Niger</option>
              <option value="CM">Cameroun</option>
              <option value="GA">Gabon</option>
              <option value="CD">Congo</option>
              <option value="CG">Congo-Brazzaville</option>
              <option value="TD">Tchad</option>
              <option value="CF">Centrafrique</option>
              <option value="FR">France</option>
              <option value="BE">Belgique</option>
              <option value="CA">Canada</option>
              <option value="US">États-Unis</option>
            </select>
            {formErrors.country && (
              <p id="country-error" className="text-sm text-red-500" role="alert">
                {formErrors.country}
              </p>
            )}
          </div>
        </div>

        {storeId && (
          <div className="space-y-2 mt-4">
            <GiftCardInput
              storeId={storeId}
              onApply={onGiftCardApply}
              onRemove={onGiftCardRemove}
              appliedGiftCardId={appliedGiftCard?.id || null}
              appliedGiftCardBalance={appliedGiftCard?.balance || null}
              appliedGiftCardCode={appliedGiftCard?.code || null}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
