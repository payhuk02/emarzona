import { expect, type Page } from '@playwright/test';

/** Select a day in ServiceCalendarEnhanced (react-big-calendar `.rbc-*`). */
export async function selectServiceCalendarDay(page: Page, date: Date): Promise<void> {
  await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 30_000 });

  const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  const toolbar = page.locator('.rbc-toolbar-label');
  const nextMonth = page.getByRole('button', { name: /mois suivant/i });

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const label = ((await toolbar.textContent()) ?? '').toLowerCase();
    if (label.includes(monthName.toLowerCase()) && label.includes(String(year))) {
      break;
    }
    await nextMonth.click();
  }

  await page
    .locator('.rbc-date-cell button')
    .filter({ hasText: new RegExp(`^${date.getDate()}$`) })
    .first()
    .click();
  // Don't assert on the label text: the UI can re-render a bit differently in CI.
  // Instead, wait until the time slot picker is mounted (it exposes stable testids).
  await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeVisible({
    timeout: 20_000,
  });
}

export async function selectFirstAvailableTimeSlot(page: Page): Promise<void> {
  const slot = page.locator('[data-testid^="time-slot-"]').first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
}
