import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TrackingAutoRefresh } from '../TrackingAutoRefresh';
import { useAutomaticTracking } from '@/hooks/shipping/useAutomaticTracking';

// Mock dependencies
vi.mock('@/hooks/shipping/useAutomaticTracking');

const mockUseAutomaticTracking = vi.fn();

(useAutomaticTracking as any).mockImplementation(mockUseAutomaticTracking);

describe('TrackingAutoRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useAutomaticTracking with default interval when enabled', () => {
    render(<TrackingAutoRefresh enabled={true} />);
    expect(mockUseAutomaticTracking).toHaveBeenCalledWith(5 * 60 * 1000); // 5 minutes
  });

  it('should call useAutomaticTracking with custom interval', () => {
    render(<TrackingAutoRefresh enabled={true} intervalMs={10 * 60 * 1000} />);
    expect(mockUseAutomaticTracking).toHaveBeenCalledWith(10 * 60 * 1000);
  });

  it('should call useAutomaticTracking with 0 when disabled', () => {
    render(<TrackingAutoRefresh enabled={false} />);
    expect(mockUseAutomaticTracking).toHaveBeenCalledWith(0);
  });

  it('should call useAutomaticTracking with default interval when enabled prop is not provided', () => {
    render(<TrackingAutoRefresh />);
    expect(mockUseAutomaticTracking).toHaveBeenCalledWith(5 * 60 * 1000);
  });

  it('should return null (invisible component)', () => {
    const { container } = render(<TrackingAutoRefresh />);
    expect(container.firstChild).toBeNull();
  });
});











