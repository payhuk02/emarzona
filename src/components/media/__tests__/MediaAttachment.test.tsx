/**
 * Tests unitaires pour MediaAttachment.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaAttachment } from '../MediaAttachment';
import { useMediaErrorHandler } from '@/hooks/useMediaErrorHandler';
import type { MediaErrorState } from '@/hooks/useMediaErrorHandler';

vi.mock('@/hooks/useMediaErrorHandler', () => ({
  useMediaErrorHandler: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultErrorState: MediaErrorState = {
  hasError: false,
  allAttemptsFailed: false,
  errorStatus: null,
  contentType: null,
  signedUrl: null,
  triedSignedUrl: false,
  isLoading: false,
};

function mockMediaErrorHandler(overrides: Partial<ReturnType<typeof useMediaErrorHandler>> = {}) {
  vi.mocked(useMediaErrorHandler).mockReturnValue({
    state: defaultErrorState,
    handleError: vi.fn().mockResolvedValue(undefined),
    analyzeErrorResponse: vi.fn().mockResolvedValue(undefined),
    handleSuccess: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  });
}

describe('MediaAttachment', () => {
  const mockAttachment = {
    id: 'test-id',
    file_name: 'test-image.jpg',
    file_type: 'image/jpeg',
    file_url: 'https://test.supabase.co/storage/v1/object/public/attachments/test-image.jpg',
    storage_path: 'test-image.jpg',
    file_size: 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaErrorHandler();
  });

  describe('Image rendering', () => {
    it('should render an image for image files', () => {
      render(<MediaAttachment attachment={mockAttachment} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'test-image.jpg');
      expect(img).toHaveAttribute('src', expect.stringContaining('test-image.jpg'));
    });

    it('should use corrected URL', () => {
      render(<MediaAttachment attachment={mockAttachment} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute(
        'src',
        expect.stringContaining('/storage/v1/object/public/attachments/')
      );
    });

    it('should apply size classes correctly', () => {
      const { rerender } = render(<MediaAttachment attachment={mockAttachment} size="thumbnail" />);
      let img = screen.getByRole('img');
      expect(img.className).toContain('max-w-32');

      rerender(<MediaAttachment attachment={mockAttachment} size="medium" />);
      img = screen.getByRole('img');
      expect(img.className).toContain('max-w-[280px]');

      rerender(<MediaAttachment attachment={mockAttachment} size="large" />);
      img = screen.getByRole('img');
      expect(img.className).toContain('max-w-full');
    });

    it('should handle onClick callback', async () => {
      const handleClick = vi.fn();
      render(<MediaAttachment attachment={mockAttachment} onClick={handleClick} />);

      const img = screen.getByRole('img');
      await userEvent.click(img);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should open in new tab if no onClick provided', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<MediaAttachment attachment={mockAttachment} />);

      const img = screen.getByRole('img');
      await userEvent.click(img);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-image.jpg'),
        '_blank'
      );

      windowOpenSpy.mockRestore();
    });
  });

  describe('Video rendering', () => {
    it('should render a video element for video files', () => {
      const videoAttachment = {
        ...mockAttachment,
        file_name: 'test-video.mp4',
        file_type: 'video/mp4',
        file_url: 'https://test.supabase.co/storage/v1/object/public/attachments/test-video.mp4',
      };

      render(<MediaAttachment attachment={videoAttachment} />);

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('controls');
    });
  });

  describe('File rendering', () => {
    it('should render a link for generic files', () => {
      const fileAttachment = {
        ...mockAttachment,
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        file_url: 'https://test.supabase.co/storage/v1/object/public/attachments/document.pdf',
      };

      render(<MediaAttachment attachment={fileAttachment} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', expect.stringContaining('document.pdf'));
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should show file size when showSize is true', () => {
      const fileAttachment = {
        ...mockAttachment,
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        file_size: 2048,
      };

      render(<MediaAttachment attachment={fileAttachment} showSize={true} />);

      expect(screen.getByText(/2\.0 KB/i)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should show fallback link when image fails to load', () => {
      mockMediaErrorHandler({
        state: {
          ...defaultErrorState,
          hasError: true,
          allAttemptsFailed: true,
          errorStatus: 404,
          triedSignedUrl: true,
        },
      });

      render(<MediaAttachment attachment={mockAttachment} />);

      expect(screen.getByText(/ouvrir dans un nouvel onglet/i)).toBeInTheDocument();
      expect(screen.getByText(/image non disponible/i)).toBeInTheDocument();
    });

    it('should call onError callback when provided', async () => {
      const onError = vi.fn();
      const handleError = vi.fn(async () => {
        onError(new Error('File not found'));
      });

      mockMediaErrorHandler({ handleError });

      render(<MediaAttachment attachment={mockAttachment} onError={onError} />);

      fireEvent.error(screen.getByRole('img'));

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<MediaAttachment attachment={mockAttachment} className="custom-class" />);

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing file_name', () => {
      const attachmentWithoutName = {
        ...mockAttachment,
        file_name: '',
      };

      render(<MediaAttachment attachment={attachmentWithoutName} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Image');
    });

    it('should handle missing file_size', () => {
      const attachmentWithoutSize = {
        ...mockAttachment,
        file_size: undefined,
      };

      render(<MediaAttachment attachment={attachmentWithoutSize} showSize={true} />);

      // Ne devrait pas afficher de taille
      expect(screen.queryByText(/KB|MB|B/i)).not.toBeInTheDocument();
    });

    it('should handle missing storage_path', () => {
      const attachmentWithoutPath = {
        ...mockAttachment,
        storage_path: undefined,
      };

      render(<MediaAttachment attachment={attachmentWithoutPath} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });
  });
});
