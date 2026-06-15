import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UtilityBarHeader } from '@/components/layout/UtilityBarHeader';
import { dispatchOpenCommandPalette } from '@/lib/vendor-command-palette';

vi.mock('@/components/notifications/NotificationBell', () => ({
  NotificationBell: () => <button type="button">Notifications</button>,
}));

vi.mock('@/components/layout/UserUtilityActions', () => ({
  UserUtilityActions: () => <div data-testid="user-utility-actions">User actions</div>,
}));

vi.mock('@/lib/vendor-command-palette', () => ({
  dispatchOpenCommandPalette: vi.fn(),
}));

describe('UtilityBarHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification bell and user actions', () => {
    render(<UtilityBarHeader />);

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByTestId('user-utility-actions')).toBeInTheDocument();
  });

  it('opens the command palette from the search control', async () => {
    const user = userEvent.setup();
    render(<UtilityBarHeader />);

    const toolbar = screen.getByRole('toolbar');
    const paletteButton = within(toolbar)
      .getAllByRole('button')
      .find(button => button !== screen.getByRole('button', { name: 'Notifications' }));
    expect(paletteButton).toBeDefined();
    await user.click(paletteButton!);
    expect(dispatchOpenCommandPalette).toHaveBeenCalledTimes(1);
  });
});
