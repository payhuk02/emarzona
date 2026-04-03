/**
 * Tests unitaires pour MediaAttachment.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaAttachment } from '../MediaAttachment';
import * as supabase from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        list: vi.fn(),
        createSignedUrl: vi.fn(),
      })),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

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
      expect(img).toHaveAttribute('src', expect.stringContaining('/storage/v1/object/public/attachments/'));
    });

    it('should apply size classes correctly', () => {
      const { rerender } = render(<MediaAttachment attachment={mockAttachment} size="thumbnail" />);
      let  img= screen.getByRole('img');
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
    it('should show fallback link when image fails to load', async () => {
      const mockList = vi.fn().mockResolvedValue({ data: [{ name: 'test-image.jpg' }], error: null });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://test.supabase.co/storage/v1/object/sign/attachments/test-image.jpg?token=abc' },
        error: null,
      });

      vi.mocked(supabase.supabase.storage.from).mockReturnValue({
        list: mockList,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      render(<MediaAttachment attachment={mockAttachment} />);
      
      const img = screen.getByRole('img');
      
      // Simuler une erreur de chargement
      const errorEvent = new Event('error');
      img.dispatchEvent(errorEvent);

      // Attendre que le fallback soit généré
      await waitFor(() => {
        const fallbackLink = screen.queryByText(/Ouvrir/i);
        expect(fallbackLink).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should call onError callback when provided', async () => {
      const onError = vi.fn();
      // Simuler un fichier qui n'existe pas dans le bucket
      const mockList = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('File not found'),
      });
      
      vi.mocked(supabase.supabase.storage.from).mockReturnValue({
        list: mockList,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      render(<MediaAttachment attachment={mockAttachment} onError={onError} />);
      
      const img = screen.getByRole('img');
      
      // Simuler une erreur de chargement
      const errorEvent = new Event('error');
      img.dispatchEvent(errorEvent);

      // Attendre que le fallback soit affiché
      await waitFor(() => {
        const fallbackLink = screen.queryByText(/Ouvrir/i);
        expect(fallbackLink).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // onError devrait être appelé quand le fichier n'existe pas
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      }, { timeout: 2000 });
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






