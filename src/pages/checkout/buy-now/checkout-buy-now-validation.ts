import type { CheckoutFormData } from '@/pages/checkout/buy-now/checkout-buy-now-types';

export function validateBuyNowForm(
  formData: CheckoutFormData
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

  return errors;
}
