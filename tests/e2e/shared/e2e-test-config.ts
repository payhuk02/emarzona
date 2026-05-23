/**
 * Configuration partagée des tests E2E Emarzona.
 * Surcharge via variables d'environnement en CI (secrets).
 */
export const E2E_TEST_CONFIG = {
  vendorEmail: process.env.E2E_VENDOR_EMAIL ?? 'vendor-test@emarzona.com',
  vendorPassword: process.env.E2E_VENDOR_PASSWORD ?? 'TestPassword123!',
  buyerEmail: process.env.E2E_BUYER_EMAIL ?? 'buyer-test@emarzona.com',
  buyerPassword: process.env.E2E_BUYER_PASSWORD ?? 'TestPassword123!',
  clientEmail: process.env.E2E_CLIENT_EMAIL ?? 'client-test@emarzona.com',
  clientPassword: process.env.E2E_CLIENT_PASSWORD ?? 'TestPassword123!',
  paymentTimeout: 30_000,
  navigationTimeout: 60_000,
} as const;

export async function gotoApp(
  page: import('@playwright/test').Page,
  path: string
): Promise<import('@playwright/test').Response | null> {
  return page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: E2E_TEST_CONFIG.navigationTimeout,
  });
}

export async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
  await gotoApp(page, '/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|marketplace|account)/, { timeout: 15_000 });
}
