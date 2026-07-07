export type GuestOrderConfirmationParams = {
  orderId: string;
  orderNumber: string;
  productName: string;
  customerEmail?: string;
  cashOnDelivery?: boolean;
};

export function buildGuestOrderConfirmationPath({
  orderId,
  orderNumber,
  productName,
  customerEmail,
  cashOnDelivery,
}: GuestOrderConfirmationParams): string {
  const params = new URLSearchParams({
    orderId,
    orderNumber,
    product: productName,
  });
  if (customerEmail?.trim()) {
    params.set('email', customerEmail.trim());
  }
  if (cashOnDelivery) {
    params.set('cod', '1');
  }
  return `/orders/confirmed?${params.toString()}`;
}
