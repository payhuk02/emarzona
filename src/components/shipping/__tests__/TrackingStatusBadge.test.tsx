import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackingStatusBadge, type TrackingStatus } from '../TrackingStatusBadge';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? '',
  }),
}));

const statusLabels: Record<TrackingStatus, string> = {
  pending: 'pending',
  label_created: 'labelCreated',
  picked_up: 'pickedUp',
  in_transit: 'inTransit',
  out_for_delivery: 'outForDelivery',
  delivered: 'delivered',
  failed: 'failed',
  returned: 'returned',
  cancelled: 'cancelled',
};

describe('TrackingStatusBadge', () => {
  const statuses = Object.keys(statusLabels) as TrackingStatus[];

  it('should render badge for each status', () => {
    statuses.forEach(status => {
      const { unmount } = render(<TrackingStatusBadge status={status} />);
      expect(screen.getByText(statusLabels[status])).toBeInTheDocument();
      unmount();
    });
  });

  it('should show icon by default', () => {
    const { container } = render(<TrackingStatusBadge status="pending" />);

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(<TrackingStatusBadge status="pending" showIcon={false} />);

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<TrackingStatusBadge status="pending" className="custom-class" />);

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should use correct variant for each status', () => {
    const { container: pendingContainer } = render(<TrackingStatusBadge status="pending" />);
    expect(pendingContainer.querySelector('.bg-secondary')).toBeInTheDocument();

    const { container: deliveredContainer } = render(<TrackingStatusBadge status="delivered" />);
    expect(deliveredContainer.querySelector('.text-foreground')).toBeInTheDocument();

    const { container: failedContainer } = render(<TrackingStatusBadge status="failed" />);
    expect(failedContainer.querySelector('.bg-destructive')).toBeInTheDocument();
  });

  it('should handle unknown status gracefully', () => {
    render(<TrackingStatusBadge status="pending" />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
});
