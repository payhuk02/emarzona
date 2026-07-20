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

/** Select a bookable day/slot in ServiceCalendarEnhanced (react-big-calendar). */
export async function selectServiceCalendarDay(page: Page, date: Date): Promise<void> {
  await dismissCookieBannerIfVisible(page);
  await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 30_000 });

  // Seed data creates green "Disponible" events — most reliable path in CI.
  const availableEvent = page
    .locator('.rbc-event')
    .filter({ hasText: /Disponible/i })
    .first();
  if (await availableEvent.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await availableEvent.click();
    const slots = page.locator('[data-testid^="time-slot-"]');
    if (
      await slots
        .first()
        .isVisible({ timeout: 8_000 })
        .catch(() => false)
    ) {
      return;
    }
    // Re-click once — CI can miss the first selection
    await availableEvent.click();
    await expect(slots.first()).toBeVisible({ timeout: 20_000 });
    return;
  }

  // Month view fallback: navigate to target month then pick the day number.
  const monthButton = page.getByRole('button', { name: /^Mois$/i });
  if (await monthButton.isVisible().catch(() => false)) {
    await monthButton.click();
  }

  const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  const toolbar = page.locator('.rbc-toolbar-label');
  const nextMonth = page.getByRole('button', { name: /mois suivant|suivant/i }).first();

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const label = ((await toolbar.textContent()) ?? '').toLowerCase();
    if (label.includes(monthName.toLowerCase()) && label.includes(String(year))) {
      break;
    }
    await nextMonth.click();
  }

  const dayCell = page
    .locator('.rbc-day-bg')
    .filter({
      has: page.locator('.rbc-date-cell').filter({ hasText: new RegExp(`^${date.getDate()}$`) }),
    })
    .first();

  if (await dayCell.isVisible().catch(() => false)) {
    await dayCell.click();
  } else {
    await page
      .locator('.rbc-date-cell')
      .filter({ hasText: new RegExp(`^${date.getDate()}$`) })
      .first()
      .click();
  }

  await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeVisible({
    timeout: 20_000,
  });
}

export async function selectFirstAvailableTimeSlot(page: Page): Promise<void> {
  const slot = page.locator('[data-testid^="time-slot-"]').first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
}
