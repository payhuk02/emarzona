import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isNavFeatureEnabled } from '@/lib/navigation/feature-flags';

describe('navigation feature flags', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NAV_AI_CHATBOT', '');
    vi.stubEnv('VITE_NAV_IMAGE_STUDIO', '');
  });

  it('enables nav items by default', () => {
    expect(isNavFeatureEnabled('nav.ai-chatbot')).toBe(true);
    expect(isNavFeatureEnabled(undefined)).toBe(true);
  });

  it('returns true for unknown flags (opt-in disable only)', () => {
    expect(isNavFeatureEnabled('nav.unknown-flag')).toBe(true);
  });
});
