/**
 * Provider PostHog — init unique au montage.
 * Si non configuré, rend les children sans client (no-op).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { PostHogProvider as PHProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { initPostHog } from '@/lib/analytics/posthog';
import { isPostHogConfigured } from '@/lib/analytics/posthog-config';

export function PostHogAppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initPostHog();
    setReady(true);
  }, []);

  if (!isPostHogConfigured()) {
    return <>{children}</>;
  }

  // Wait one tick so init runs before provider consumers in same tree
  if (!ready) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
