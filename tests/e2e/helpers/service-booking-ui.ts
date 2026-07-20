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

async function waitForTimeSlots(page: Page, timeout = 12_000): Promise<boolean> {
  return page
    .locator('[data-testid^="time-slot-"]')
    .first()
    .isVisible({ timeout })
    .catch(() => false);
}

/** Select a bookable day so TimeSlotPicker renders (week view + Disponible events). */
export async function selectServiceCalendarDay(page: Page, _date: Date): Promise<void> {
  await dismissCookieBannerIfVisible(page);
  await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 30_000 });

  // Prefer week view — events are larger and include "Disponible" labels.
  const weekButton = page.getByRole('button', { name: /^Semaine$/i });
  if (await weekButton.isVisible().catch(() => false)) {
    await weekButton.click();
  }

  const availableEvent = page
    .locator('.rbc-event')
    .filter({ hasText: /Disponible/i })
    .first();

  await expect(availableEvent).toBeVisible({ timeout: 30_000 });
  await availableEvent.scrollIntoViewIfNeeded().catch(() => undefined);
  await availableEvent.click({ force: true });

  if (await waitForTimeSlots(page)) return;

  // Re-click once (CI can miss the first selection).
  await availableEvent.click({ force: true });
  if (await waitForTimeSlots(page)) return;

  // Advance one week if current week only had past slots filtered out.
  const next = page.getByRole('button', { name: /suivant|next/i }).first();
  if (await next.isVisible().catch(() => false)) {
    await next.click();
    const nextEvent = page
      .locator('.rbc-event')
      .filter({ hasText: /Disponible/i })
      .first();
    await expect(nextEvent).toBeVisible({ timeout: 20_000 });
    await nextEvent.click({ force: true });
  }

  await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeVisible({
    timeout: 25_000,
  });
}

export async function selectFirstAvailableTimeSlot(page: Page): Promise<void> {
  const slot = page.locator('[data-testid^="time-slot-"]').first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
}
