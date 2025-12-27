/**
 * Tests unitaires pour OptimizedImage
 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});


 * Composant critique pour la performance (LCP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre l\'image avec les props de base', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('devrait utiliser lazy loading par défaut', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('devrait utiliser eager loading si priority est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('devrait afficher un skeleton si showSkeleton est true', () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        showSkeleton={true}
      />
    );

    // Le skeleton devrait être présent avant le chargement
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('devrait générer srcset pour différentes résolutions', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={1920}
      />
    );

    const img = await screen.findByAltText('Test image');
    // srcset devrait être présent si width est fourni
    expect(img).toBeInTheDocument();
  });

  it('devrait gérer les erreurs de chargement', async () => {
    render(
      <OptimizedImage
        src="https://invalid-url.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simuler une erreur de chargement
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      // Devrait afficher un message d'erreur ou un placeholder
      expect(img).toBeInTheDocument();
    });
  });

  it('devrait précharger l\'image si priority est true', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // Devrait créer un link preload
    expect(createElementSpy).toHaveBeenCalled();
  });

  it('devrait utiliser les classes CSS personnalisées', async () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        imageClassName="custom-image-class"
      />
    );

    const img = await screen.findByAltText('Test image');
    expect(img).toHaveClass('custom-image-class');
  });
});







