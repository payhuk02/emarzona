import { expect, type Page } from '@playwright/test';

async function dismissCookieBannerIfVisible(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.cookie = 'emarzona_consent=true; path=/; max-age=31536000; SameSite=Lax';
    localStorage.setItem('cookieConsentGiven', 'true');
  });
  const acceptAll = page.getByRole('button', { name: /Tout accepter/i });
  if (await acceptAll.isVisible().catch(() => false)) {
    await acceptAll.click();
  }
}

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Select a bookable day via stable quick-day buttons (avoids flaky react-big-calendar clicks).
 */
export async function selectServiceCalendarDay(page: Page, date?: Date): Promise<void> {
  await dismissCookieBannerIfVisible(page);

  const quickDays = page.getByTestId('service-quick-days');
  await expect(quickDays).toBeVisible({ timeout: 45_000 });

  if (date) {
    const specific = page.getByTestId(`service-quick-day-${localDayKey(date)}`);
    if (await specific.isVisible().catch(() => false)) {
      await specific.click();
      await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeVisible({
        timeout: 20_000,
      });
      return;
    }
  }

  await page.locator('[data-testid^="service-quick-day-"]').first().click();
  await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeVisible({
    timeout: 20_000,
  });
}

export async function selectFirstAvailableTimeSlot(page: Page): Promise<void> {
  const slot = page.locator('[data-testid^="time-slot-"]').first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
}
