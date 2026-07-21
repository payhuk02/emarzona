/**
 * Configuration partagée des tests E2E Emarzona.
 * Surcharge via variables d'environnement en CI (secrets).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const E2E_TEST_CONFIG = {
  vendorEmail: process.env.E2E_VENDOR_EMAIL ?? 'vendor-test@emarzona.com',
  vendorPassword: process.env.E2E_VENDOR_PASSWORD ?? 'TestPassword123!',
  buyerEmail: process.env.E2E_BUYER_EMAIL ?? 'buyer-test@emarzona.com',
  buyerPassword: process.env.E2E_BUYER_PASSWORD ?? 'TestPassword123!',
  clientEmail: process.env.E2E_CLIENT_EMAIL ?? 'client-test@emarzona.com',
  clientPassword: process.env.E2E_CLIENT_PASSWORD ?? 'TestPassword123!',
  /** Mot de passe fixe pour utilisateurs créés via admin API (évite caractères instables dans runId). */
  seededUserPassword: 'E2eTestPass1!',
  paymentTimeout: 30_000,
  navigationTimeout: 90_000,
  appReadyTimeout: 90_000,
  authTimeout: 60_000,
} as const;

type PlaywrightPage = import('@playwright/test').Page;

/** Attend que React ait monté dans #root (évite le faux positif sur #seo-fallback). */
export async function waitForReactApp(page: PlaywrightPage): Promise<void> {
  // Seed consent before the cookie banner's 2s timer can show the fixed footer overlay.
  await page
    .evaluate(() => {
      try {
        document.cookie = 'emarzona_consent=true; path=/; max-age=31536000; SameSite=Lax';
        localStorage.setItem('cookieConsentGiven', 'true');
        localStorage.setItem(
          'cookiePreferences',
          JSON.stringify({
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true,
          })
        );
      } catch {
        /* ignore */
      }
    })
    .catch(() => undefined);

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

/** Wait until StoreContext has selected a vendor store (wizard pages need it). */
export async function waitForVendorStoreReady(page: PlaywrightPage): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const selected = localStorage.getItem('selectedStoreId');
        if (selected?.trim()) return true;
        return Object.keys(localStorage).some(key => {
          if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) return false;
          return Boolean(localStorage.getItem(key));
        });
      },
      { timeout: E2E_TEST_CONFIG.appReadyTimeout }
    )
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
  const emailInput = page.locator('input[name="email-login"], input[type="email"]').first();
  await emailInput.fill(email);
  await page.locator('#password-login').fill(password);
  await page
    .locator('form')
    .filter({ has: page.locator('#password-login') })
    .locator('button[type="submit"]')
    .click();

  try {
    await page.waitForURL(/\/(dashboard|marketplace|account|admin)/, {
      timeout: E2E_TEST_CONFIG.authTimeout,
      waitUntil: 'domcontentloaded',
    });
  } catch {
    const alertText = await page
      .locator('[role="alert"]')
      .first()
      .textContent()
      .catch(() => null);
    throw new Error(
      `Login failed for ${email} (url=${page.url()})${alertText ? `: ${alertText.trim()}` : ''}`
    );
  }
  await waitForReactApp(page);
}

/** Connexion UI fiable quand le mot de passe est connu (utilisateurs seedés admin API). */
export async function loginAsSeededUserWithPassword(
  page: PlaywrightPage,
  email: string,
  password: string,
  redirectPath = '/dashboard'
): Promise<void> {
  await loginAs(page, email, password);
  if (!page.url().includes(redirectPath.split('?')[0])) {
    await gotoApp(page, redirectPath);
  }
  await waitForReactApp(page);
}

/**
 * Connexion fiable pour utilisateurs créés via service role — évite signIn UI quand la clé publishable locale est invalide/tronquée.
 */
export async function loginAsSeededUser(
  page: PlaywrightPage,
  admin: SupabaseClient,
  email: string,
  redirectPath = '/dashboard',
  password?: string
): Promise<void> {
  if (password) {
    await loginAsSeededUserWithPassword(page, email, password, redirectPath);
    return;
  }

  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:8080';
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL missing for loginAsSeededUser');
  }
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseURL}${redirectPath}` },
  });

  if (error || !data.properties?.action_link) {
    throw error ?? new Error(`generateLink(magiclink) failed for ${email}`);
  }

  await page.goto(data.properties.action_link, {
    waitUntil: 'domcontentloaded',
    timeout: E2E_TEST_CONFIG.navigationTimeout,
  });

  await page
    .waitForFunction(() => /access_token=/.test(window.location.hash), {
      timeout: E2E_TEST_CONFIG.authTimeout,
    })
    .catch(() => undefined);

  const tokens = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      expires_in: params.get('expires_in'),
      token_type: params.get('token_type') ?? 'bearer',
    };
  });

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(`Magic link did not yield session tokens (url=${page.url()})`);
  }

  const expiresIn = Number(tokens.expires_in ?? 3600);
  const session = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: tokens.token_type,
    user: data.user,
  };

  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: E2E_TEST_CONFIG.navigationTimeout,
  });
  await page.evaluate(
    ({ key, value }) => {
      sessionStorage.setItem(key, value);
    },
    { key: storageKey, value: JSON.stringify(session) }
  );

  await gotoApp(page, redirectPath);
  await page.waitForURL(/\/(dashboard|marketplace|account|admin)/, {
    timeout: E2E_TEST_CONFIG.authTimeout,
    waitUntil: 'domcontentloaded',
  });
  await waitForReactApp(page);
}
