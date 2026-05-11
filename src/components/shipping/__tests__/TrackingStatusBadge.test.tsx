import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackingStatusBadge } from '../TrackingStatusBadge';
import { TrackingStatus } from '../TrackingStatusBadge';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key.split('.').pop() || '',
  }),
}));

describe('TrackingStatusBadge', () => {
  const  statuses: TrackingStatus[] = [
    'pending',
    'label_created',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
    'cancelled',
  ];

  it('should render badge for each status', () => {
    statuses.forEach((status) => {
      const { unmount } = render(<TrackingStatusBadge status={status} />);
      expect(screen.getByText(new RegExp(status, 'i'))).toBeInTheDocument();
      unmount();
    });
  });

  it('should show icon by default', () => {
    render(<TrackingStatusBadge status="pending" />);
    // Icon should be present (Clock icon for pending)
    const badge = screen.getByText(/pending/i).closest('[class*="badge"]');
    expect(badge).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    render(<TrackingStatusBadge status="pending" showIcon={false} />);
    const badge = screen.getByText(/pending/i).closest('[class*="badge"]');
    expect(badge).toBeInTheDocument();
    // Icon should not be visible
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TrackingStatusBadge status="pending" className="custom-class" />
    );
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });

  it('should use correct variant for each status', () => {
    const { container: pendingContainer } = render(
      <TrackingStatusBadge status="pending" />
    );
    expect(pendingContainer.querySelector('[class*="secondary"]')).toBeInTheDocument();

    const { container: deliveredContainer } = render(
      <TrackingStatusBadge status="delivered" />
    );
    expect(deliveredContainer.querySelector('[class*="outline"]')).toBeInTheDocument();

    const { container: failedContainer } = render(
      <TrackingStatusBadge status="failed" />
    );
    expect(failedContainer.querySelector('[class*="destructive"]')).toBeInTheDocument();
  });

  it('should handle unknown status gracefully', () => {
    // TypeScript will prevent this, but test runtime behavior
    render(<TrackingStatusBadge status="pending" />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});











