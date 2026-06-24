import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vitest.config';

/**
 * Sous-ensemble de tests exécuté en CI (évite les suites en dette / OOM).
 * Élargir progressivement en corrigeant les fichiers exclus dans vitest.config.ts.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: [
        'src/lib/__tests__/**/*.test.ts',
        'src/utils/__tests__/**/*.test.ts',
        'src/hooks/__tests__/useDebounce.test.ts',
        'src/hooks/__tests__/useRequire2FA.test.tsx',
        'src/hooks/__tests__/useStorage.test.ts',
        'src/lib/checkout/__tests__/**/*.test.ts',
        'src/lib/payments/__tests__/**/*.test.ts',
        'src/lib/billing/__tests__/initiate-billing-payment.test.ts',
        'src/lib/marketplace/__tests__/initiate-direct-buy.test.ts',
        'src/lib/checkout/__tests__/initiate-balance-payment.test.ts',
        'src/lib/security/__tests__/**/*.test.ts',
        'src/lib/cart/__tests__/**/*.test.ts',
        'src/lib/orders/__tests__/**/*.test.ts',
        'src/lib/shipping/__tests__/**/*.test.ts',
        'src/pages/__tests__/Checkout.test.tsx',
        'src/components/products/tabs/**/__tests__/**',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'src/components/products/tabs/__tests__/ProductAnalyticsTab.test.tsx',
        'src/lib/__tests__/file-security.test.ts',
        'src/lib/__tests__/currency-converter.test.ts',
        'src/lib/__tests__/currency-exchange-api.test.ts',
      ],
      pool: 'forks',
      maxWorkers: 2,
      coverage: {
        include: [
          'src/lib/checkout/**/*.{ts,tsx}',
          'src/lib/payments/**/*.{ts,tsx}',
          'src/lib/cart/cart-data.ts',
          'src/lib/orders/customers-data.ts',
          'src/lib/orders/orders-data.ts',
          'src/lib/orders/order-status.ts',
          'src/lib/orders/resolve-order-number.ts',
          'src/lib/shipping/fedex-policy.ts',
          'src/lib/shipping/fedex-rates-client.ts',
          'src/lib/shipping/fedex-ship-client.ts',
          'src/lib/shipping/fedex-track-client.ts',
          'src/lib/shipping/fedex-cancel-client.ts',
          'src/hooks/useRequire2FA.ts',
        ],
        exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/__tests__/**'],
        // Phase 2 audit — seuils par domaine (checkout, payments, orders, shipping, cart)
        thresholds: {
          lines: 55,
          functions: 45,
          branches: 40,
          statements: 55,
          'src/lib/checkout/**': {
            lines: 55,
            functions: 45,
            branches: 35,
            statements: 55,
          },
          'src/lib/payments/**': {
            lines: 58,
            functions: 54,
            branches: 36,
            statements: 55,
          },
          'src/lib/cart/cart-data.ts': {
            lines: 45,
            functions: 40,
            branches: 35,
            statements: 45,
          },
          'src/lib/orders/**': {
            lines: 50,
            functions: 45,
            branches: 40,
            statements: 50,
          },
          'src/lib/shipping/fedex-policy.ts': {
            lines: 85,
            functions: 80,
            branches: 80,
            statements: 85,
          },
          'src/lib/shipping/fedex-rates-client.ts': {
            lines: 65,
            functions: 60,
            branches: 45,
            statements: 65,
          },
          'src/lib/shipping/fedex-ship-client.ts': {
            lines: 60,
            functions: 60,
            branches: 50,
            statements: 60,
          },
          'src/lib/shipping/fedex-track-client.ts': {
            lines: 60,
            functions: 60,
            branches: 50,
            statements: 60,
          },
          'src/lib/shipping/fedex-cancel-client.ts': {
            lines: 50,
            functions: 50,
            branches: 30,
            statements: 50,
          },
          'src/hooks/useRequire2FA.ts': {
            lines: 70,
            functions: 50,
            branches: 52,
            statements: 60,
          },
        },
      },
    },
  })
);
