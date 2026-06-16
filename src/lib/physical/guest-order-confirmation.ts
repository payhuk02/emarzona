export type GuestOrderConfirmationParams = {
  orderId: string;
  orderNumber: string;
  productName: string;
  cashOnDelivery?: boolean;
};

export function buildGuestOrderConfirmationPath({
  orderId,
  orderNumber,
  productName,
  cashOnDelivery,
}: GuestOrderConfirmationParams): string {
  const params = new URLSearchParams({
    orderId,
    orderNumber,
    product: productName,
  });
  if (cashOnDelivery) {
    params.set('cod', '1');
  }
  return `/orders/confirmed?${params.toString()}`;
}
