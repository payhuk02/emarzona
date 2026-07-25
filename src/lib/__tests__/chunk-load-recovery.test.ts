import { afterEach, describe, expect, it, vi } from 'vitest';
import { installChunkLoadRecovery, isChunkLoadErrorMessage } from '@/lib/chunk-load-recovery';

describe('isChunkLoadErrorMessage', () => {
  it('detects Vite dynamic import failures', () => {
    expect(
      isChunkLoadErrorMessage('Failed to fetch dynamically imported module: https://x/js/a.js')
    ).toBe(true);
  });

  it('detects MIME text/html module script failures (SPA fallback)', () => {
    expect(
      isChunkLoadErrorMessage(
        'Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.'
      )
    ).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isChunkLoadErrorMessage('NetworkError when attempting to fetch resource.')).toBe(false);
  });
});

describe('installChunkLoadRecovery', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('reloads once on vite:preloadError', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    installChunkLoadRecovery();
    window.dispatchEvent(new Event('vite:preloadError'));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
