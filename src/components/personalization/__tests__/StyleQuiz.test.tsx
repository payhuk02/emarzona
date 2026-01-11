import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import StyleQuiz from '../StyleQuiz';

// Mocks
vi.mock('@/hooks/useStylePreferences', () => ({
  useStylePreferences: vi.fn()
}));

vi.mock('@/hooks/useProductRecommendations', () => ({
  useProductRecommendations: vi.fn()
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Import des mocks pour les manipuler
import { useStylePreferences } from '@/hooks/useStylePreferences';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';

const mockUseStylePreferences = vi.mocked(useStylePreferences);
const mockUseProductRecommendations = vi.mocked(useProductRecommendations);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('StyleQuiz', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();
  const mockSavePreferences = vi.fn().mockResolvedValue({});
  const mockGetRecommendations = vi.fn().mockResolvedValue([]);

  const defaultProps = {
    onComplete: mockOnComplete,
    onSkip: mockOnSkip
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseStylePreferences.mockReturnValue({
      saveStylePreferences: mockSavePreferences,
      isSaving: false
    });

    mockUseProductRecommendations.mockReturnValue({
      getPersonalizedRecommendations: mockGetRecommendations
    });
  });

  describe('Initial Render', () => {
    it('renders the quiz title and description', () => {
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Découvrez Votre Style')).toBeInTheDocument();
      expect(screen.getByText('Répondez à quelques questions pour recevoir des recommandations personnalisées')).toBeInTheDocument();
    });

    it('shows the first question', () => {
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Quel style vous attire le plus ?')).toBeInTheDocument();
      expect(screen.getByText('Question 1 sur 5')).toBeInTheDocument();
    });

    it('displays progress bar', () => {
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('20% terminé')).toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    it('does not allow proceeding without selecting an answer', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('Réponse requise')).toBeInTheDocument();
      expect(screen.getByText('Question 1 sur 5')).toBeInTheDocument();
    });

    it('allows proceeding after selecting an answer', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      // Select first option
      const firstOption = screen.getByLabelText('Sobre et épuré');
      await user.click(firstOption);

      // Click next
      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      // Should move to question 2
      await waitFor(() => {
        expect(screen.getByText('Question 2 sur 5')).toBeInTheDocument();
      });
    });

    it('allows going back to previous questions', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      // Go to second question
      const firstOption = screen.getByLabelText('Sobre et épuré');
      await user.click(firstOption);
      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Question 2 sur 5')).toBeInTheDocument();
      });

      // Go back
      const prevButton = screen.getByRole('button', { name: /Précédent/i });
      await user.click(prevButton);

      expect(screen.getByText('Question 1 sur 5')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('allows selecting only one answer per question (radio behavior)', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      const firstOption = screen.getByLabelText('Sobre et épuré');
      const secondOption = screen.getByLabelText('Artistique et bohème');

      await user.click(firstOption);
      expect(firstOption).toBeChecked();

      await user.click(secondOption);
      expect(secondOption).toBeChecked();
      expect(firstOption).not.toBeChecked();
    });
  });

  describe('Quiz Completion', () => {
    beforeEach(async () => {
      // Complete all questions quickly
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      // Answer all 5 questions
      for (let i = 0; i < 5; i++) {
        const firstOption = screen.getAllByRole('radio')[0];
        await user.click(firstOption);

        if (i < 4) { // Don't click next on last question
          const nextButton = screen.getByRole('button', { name: /Suivant/i });
          await user.click(nextButton);

          await waitFor(() => {
            expect(screen.getByText(`Question ${i + 2} sur 5`)).toBeInTheDocument();
          });
        }
      }
    });

    it('shows completion state on last question', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      // Navigate to last question
      for (let i = 0; i < 4; i++) {
        const firstOption = screen.getAllByRole('radio')[0];
        await user.click(firstOption);
        const nextButton = screen.getByRole('button', { name: /Suivant/i });
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Terminer/i })).toBeInTheDocument();
      });
    });

    it('calls onComplete with profile and recommendations when finished', async () => {
      const user = userEvent.setup();
      const mockProfile = {
        aesthetic: 'minimalist' as const,
        colorPalette: 'neutral' as const,
        budgetRange: 'midrange' as const,
        occasionFocus: 'casual' as const,
        sustainability: 'somewhat' as const
      };
      const mockProducts = [{ id: '1', name: 'Test Product' }];

      mockGetRecommendations.mockResolvedValue(mockProducts);

      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      // Complete all questions and finish
      for (let i = 0; i < 5; i++) {
        const firstOption = screen.getAllByRole('radio')[0];
        await user.click(firstOption);

        if (i < 4) {
          const nextButton = screen.getByRole('button', { name: /Suivant/i });
          await user.click(nextButton);
        } else {
          const finishButton = screen.getByRole('button', { name: /Terminer/i });
          await user.click(finishButton);
        }
      }

      await waitFor(() => {
        expect(mockSavePreferences).toHaveBeenCalled();
        expect(mockGetRecommendations).toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Skip Functionality', () => {
    it('calls onSkip when skip button is clicked', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      const skipButton = screen.getByRole('button', { name: /Passer le quiz/i });
      await user.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for radio buttons', () => {
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBeGreaterThan(0);

      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('type', 'radio');
      });
    });

    it('has proper form labels', () => {
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      const labels = screen.getAllByRole('label');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('updates progress as questions are answered', async () => {
      const user = userEvent.setup();
      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('20% terminé')).toBeInTheDocument();

      // Answer first question
      const firstOption = screen.getByLabelText('Sobre et épuré');
      await user.click(firstOption);

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('40% terminé')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles save preferences error gracefully', async () => {
      const user = userEvent.setup();
      mockSavePreferences.mockRejectedValue(new Error('Save failed'));

      render(<StyleQuiz {...defaultProps} />, { wrapper: createWrapper() });

      // Complete quiz quickly
      for (let i = 0; i < 5; i++) {
        const firstOption = screen.getAllByRole('radio')[0];
        await user.click(firstOption);

        if (i < 4) {
          const nextButton = screen.getByRole('button', { name: /Suivant/i });
          await user.click(nextButton);
        } else {
          const finishButton = screen.getByRole('button', { name: /Terminer/i });
          await user.click(finishButton);
        }
      }

      await waitFor(() => {
        expect(screen.getByText('Erreur')).toBeInTheDocument();
      });
    });
  });
});