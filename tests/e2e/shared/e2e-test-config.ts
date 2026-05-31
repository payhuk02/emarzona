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
  navigationTimeout: 90_000,
  appReadyTimeout: 90_000,
} as const;

type PlaywrightPage = import('@playwright/test').Page;

/** Attend que React ait monté dans #root (évite le faux positif sur #seo-fallback). */
export async function waitForReactApp(page: PlaywrightPage): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return Boolean(root && root.children.length > 0 && root.textContent?.trim().length);
    },
    { timeout: E2E_TEST_CONFIG.appReadyTimeout }
  );
  // seo-fallback retiré par main.tsx après hydratation
  await page
    .waitForFunction(() => !document.getElementById('seo-fallback'), {
      timeout: 10_000,
    })
    .catch(() => undefined);
}

export async function gotoApp(
  page: PlaywrightPage,
  path: string
): Promise<import('@playwright/test').Response | null> {
  const response = await page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: E2E_TEST_CONFIG.navigationTimeout,
  });
  await waitForReactApp(page);
  return response;
}

/** Queries limitées à l'app React (hors bloc SEO statique hors écran). */
export function appLocator(page: PlaywrightPage) {
  return page.locator('#root');
}

export async function loginAs(
  page: PlaywrightPage,
  email: string,
  password: string
): Promise<void> {
  await gotoApp(page, '/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|marketplace|account)/, { timeout: 30_000 });
  await waitForReactApp(page);
}
