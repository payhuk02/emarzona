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

async function waitForTimeSlots(page: Page, timeout = 20_000): Promise<boolean> {
  return page
    .locator('[data-testid^="time-slot-"]')
    .first()
    .isVisible({ timeout })
    .catch(() => false);
}

/**
 * Select a bookable day in ServiceCalendarEnhanced so TimeSlotPicker renders.
 * Prefer a future "Disponible" event; fall back to clicking tomorrow's month cell.
 */
export async function selectServiceCalendarDay(page: Page, date: Date): Promise<void> {
  await dismissCookieBannerIfVisible(page);
  await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 30_000 });

  const slotsVisible = () => waitForTimeSlots(page, 8_000);

  // Future "Disponible" events (calendar now generates the full month, skipping past days).
  const availableEvent = page
    .locator('.rbc-event')
    .filter({ hasText: /Disponible/i })
    .first();
  if (await availableEvent.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await availableEvent.scrollIntoViewIfNeeded().catch(() => undefined);
    await availableEvent.click({ force: true });
    if (await slotsVisible()) return;
    await availableEvent.click({ force: true });
    if (await slotsVisible()) return;
  }

  // Month view: click the date cell for the target day (current-month only).
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

  const dayNum = date.getDate();
  // rbc-date-cell and rbc-day-bg are siblings — click the in-month date button/label.
  const inMonthDate = page
    .locator(
      '.rbc-month-view .rbc-date-cell:not(.rbc-off-range) button, .rbc-month-view .rbc-date-cell:not(.rbc-off-range) a, .rbc-month-view .rbc-date-cell:not(.rbc-off-range)'
    )
    .filter({ hasText: new RegExp(`^\\s*${dayNum}\\s*$`) })
    .first();

  if (await inMonthDate.isVisible().catch(() => false)) {
    await inMonthDate.click({ force: true });
  } else {
    // Last resort: click any matching date number, then the day background via evaluate.
    await page.evaluate(targetDay => {
      const cells = Array.from(
        document.querySelectorAll('.rbc-month-view .rbc-date-cell:not(.rbc-off-range)')
      );
      const match = cells.find(cell => (cell.textContent || '').trim() === String(targetDay));
      if (match instanceof HTMLElement) {
        match.click();
        const row = match.closest('.rbc-month-row');
        const idx = match.parentElement
          ? Array.from(match.parentElement.children).indexOf(match)
          : -1;
        const bgs = row?.querySelectorAll('.rbc-day-bg');
        if (idx >= 0 && bgs?.[idx] instanceof HTMLElement) {
          (bgs[idx] as HTMLElement).click();
        }
      }
    }, dayNum);
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
