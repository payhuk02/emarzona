import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initiateOrderBalancePayment } from '../initiate-balance-payment';

const initiatePayment = vi.fn();

vi.mock('@/lib/payment-service', () => ({
  initiatePayment: (...args: unknown[]) => initiatePayment(...args),
}));

describe('initiateOrderBalancePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initiatePayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-bal-1',
      checkout_url: 'https://checkout.example/balance',
      provider: 'moneroo',
    });
  });

  it('délègue à initiatePayment avec orderId et metadata balance', async () => {
    const result = await initiateOrderBalancePayment({
      storeId: 'store-1',
      orderId: 'order-1',
      customerId: 'cust-1',
      amount: 4500,
      currency: 'XOF',
      orderNumber: 'EMZ-100',
      customerEmail: 'buyer@example.com',
      customerName: 'Buyer',
      totalAmount: 10000,
      percentagePaid: 5500,
      remainingAmount: 4500,
    });

    expect(result.checkoutUrl).toBe('https://checkout.example/balance');
    expect(result.transactionId).toBe('tx-bal-1');
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        orderId: 'order-1',
        customerId: 'cust-1',
        amount: 4500,
        metadata: expect.objectContaining({
          payment_type: 'balance',
          order_id: 'order-1',
          remaining_amount: 4500,
        }),
      })
    );
  });

  it('propage l’erreur si le paiement échoue', async () => {
    initiatePayment.mockResolvedValue({
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'moneroo',
      error: 'Order locked',
    });

    await expect(
      initiateOrderBalancePayment({
        storeId: 'store-1',
        orderId: 'order-1',
        amount: 100,
        orderNumber: 'EMZ-1',
        customerEmail: 'b@e.com',
        totalAmount: 200,
        percentagePaid: 100,
        remainingAmount: 100,
      })
    ).rejects.toThrow('Order locked');
  });
});
