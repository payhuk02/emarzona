import type { ShippingAddress } from '@/pages/checkout/cart/checkout-types';

export function validateShippingField(field: keyof ShippingAddress, value: string): string | null {
  switch (field) {
    case 'full_name':
      if (!value.trim()) return 'Le nom complet est requis';
      if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
      return null;
    case 'email':
      if (!value.trim()) return "L'email est requis";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Format d'email invalide";
      return null;
    case 'phone':
      if (!value.trim()) return 'Le téléphone est requis';
      if (
        !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
          value.replace(/\s/g, '')
        )
      ) {
        return 'Format de téléphone invalide';
      }
      return null;
    case 'address_line1':
      if (!value.trim()) return "L'adresse est requise";
      if (value.trim().length < 5) return "L'adresse doit contenir au moins 5 caractères";
      return null;
    case 'city':
      if (!value.trim()) return 'La ville est requise';
      if (value.trim().length < 2) return 'La ville doit contenir au moins 2 caractères';
      return null;
    case 'postal_code':
      if (!value.trim()) return 'Le code postal est requis';
      if (value.trim().length < 3) return 'Le code postal doit contenir au moins 3 caractères';
      return null;
    case 'country':
      if (!value.trim()) return 'Le pays est requis';
      return null;
    default:
      return null;
  }
}

export function validateShippingForm(
  formData: ShippingAddress
): Partial<Record<keyof ShippingAddress, string>> {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};

  const fullNameErr = validateShippingField('full_name', formData.full_name);
  if (fullNameErr) errors.full_name = fullNameErr;

  const emailErr = validateShippingField('email', formData.email);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validateShippingField('phone', formData.phone);
  if (phoneErr) errors.phone = phoneErr;

  const addressErr = validateShippingField('address_line1', formData.address_line1);
  if (addressErr) errors.address_line1 = addressErr;

  const cityErr = validateShippingField('city', formData.city);
  if (cityErr) errors.city = cityErr;

  const postalErr = validateShippingField('postal_code', formData.postal_code);
  if (postalErr) errors.postal_code = postalErr;

  const countryErr = validateShippingField('country', formData.country);
  if (countryErr) errors.country = countryErr;

  return errors;
}
