import type { CheckoutFormData } from '@/pages/checkout/buy-now/checkout-buy-now-types';

export function validateBuyNowForm(
  formData: CheckoutFormData,
  options?: { requireShippingAddress?: boolean }
): Partial<Record<keyof CheckoutFormData, string>> {
  const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

  if (!formData.firstName.trim()) {
    errors.firstName = 'Le prénom est requis';
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Le nom est requis';
  }

  if (!formData.email.trim()) {
    errors.email = "L'email est requis";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Email invalide';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Le téléphone est requis';
  }

  if (options?.requireShippingAddress) {
    if (!formData.address.trim()) {
      errors.address = "L'adresse de livraison est requise";
    }
    if (!formData.city.trim()) {
      errors.city = 'La ville est requise';
    }
    if (!formData.country.trim()) {
      errors.country = 'Le pays est requis';
    }
  }

  return errors;
}
