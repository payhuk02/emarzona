/**
 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});

 * Tests pour le hook useMoneroo
 * Couvre les fonctionnalités de paiement Moneroo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneroo } from '@/hooks/useMoneroo';

// Mock monerooClient
vi.mock('@/lib/moneroo-client', () => ({
  monerooClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://moneroo.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useMoneroo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useMoneroo());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { monerooClient } = await import('@/lib/moneroo-client');
    vi.mocked(monerooClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useMoneroo());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useMoneroo());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});








