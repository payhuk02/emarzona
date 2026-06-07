import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SkipLink } from '@/components/accessibility/SkipLink';

function renderSkipLink(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SkipLink />
      <main id="main-content" tabIndex={-1}>
        Contenu principal
      </main>
    </MemoryRouter>
  );
}

describe('SkipLink', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skip link pointing to main content', () => {
    renderSkipLink();

    const link = screen.getByRole('link', { name: /aller au contenu principal/i });
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link).toHaveClass('sr-only');
  });

  it('focuses #main-content on click', () => {
    renderSkipLink();

    const main = document.getElementById('main-content') as HTMLElement;
    const focusSpy = vi.spyOn(main, 'focus');

    fireEvent.click(screen.getByRole('link', { name: /aller au contenu principal/i }));

    expect(focusSpy).toHaveBeenCalled();
    expect(main.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('announces navigation to screen readers', () => {
    renderSkipLink();

    fireEvent.click(screen.getByRole('link', { name: /aller au contenu principal/i }));

    const liveRegion = document.querySelector('[role="status"][aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('Vous êtes maintenant dans le contenu principal');
  });
});
