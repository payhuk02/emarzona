import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TFunction } from 'i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PremiumNavDesktopMenu } from '../PremiumNavMega';

const t = ((key: string) => key) as TFunction;

function renderDesktopNav() {
  return render(
    <MemoryRouter>
      <PremiumNavDesktopMenu t={t} pathname="/" />
    </MemoryRouter>
  );
}

describe('PremiumNavDesktopMenu', () => {
  it('renders five top-level items with mega triggers', () => {
    renderDesktopNav();
    expect(screen.getByTestId('lp-nav-link-marketplace')).toHaveAttribute('href', '/marketplace');
    expect(screen.getByTestId('lp-nav-trigger-solutions')).toHaveAttribute('href', '/#solutions');
    expect(screen.getByTestId('lp-nav-trigger-features')).toHaveAttribute(
      'href',
      '/#fonctionnalites'
    );
    expect(screen.getByTestId('lp-nav-link-pricing')).toHaveAttribute('href', '/#tarifs');
    expect(screen.getByTestId('lp-nav-trigger-resources')).toHaveAttribute('href', '/blog');
  });

  it('opens the solutions panel from the trigger and keeps vendor rails out', async () => {
    const user = userEvent.setup();
    renderDesktopNav();
    await user.click(screen.getByTestId('lp-nav-trigger-solutions'));
    const panel = await screen.findByTestId('lp-nav-panel-solutions');
    expect(panel).toBeVisible();
    expect(panel.textContent).not.toMatch(/MoneyFusion|GeniusPay|Stripe|PayPal/i);
    expect(screen.getByTestId('lp-nav-item-solutions-physical')).toHaveAttribute(
      'href',
      '/solutions/physical'
    );
    expect(screen.getByTestId('lp-nav-item-solutions-protect')).toHaveAttribute(
      'href',
      '/solutions/protect'
    );
  });
});
