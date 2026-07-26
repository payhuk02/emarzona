import { describe, expect, it } from 'vitest';
import {
  formatDurationMs,
  mapPlatformVisitorAnalyticsPayload,
} from '@/lib/admin/admin-platform-visitors';

describe('admin-platform-visitors', () => {
  it('maps RPC payload to UI model', () => {
    const mapped = mapPlatformVisitorAnalyticsPayload({
      period_days: 7,
      total_page_views: 120,
      unique_sessions: 40,
      unique_users: 12,
      avg_session_duration_ms: 95000,
      bounce_rate: 33.5,
      by_country: [{ country: 'Burkina Faso', region: 'Centre', sessions: 20, page_views: 60 }],
      by_device: [{ device_type: 'mobile', sessions: 25, page_views: 70 }],
      by_browser: [{ browser: 'Chrome', sessions: 30 }],
      by_os: [{ os: 'Android', sessions: 22 }],
      top_pages: [{ page_path: '/', views: 50, sessions: 30, avg_duration_ms: 12000 }],
      recent_sessions: [
        {
          session_id: 'pvs_1',
          user_id: null,
          country: 'Burkina Faso',
          region: 'Centre',
          device_type: 'mobile',
          browser: 'Chrome',
          os: 'Android',
          page_views: 3,
          duration_ms: 45000,
          landing_page: '/',
          last_page: '/marketplace',
          started_at: '2026-07-22T10:00:00Z',
          last_seen_at: '2026-07-22T10:05:00Z',
        },
      ],
      daily_trend: [{ date: '2026-07-22', sessions: 10, page_views: 30 }],
    });

    expect(mapped.periodDays).toBe(7);
    expect(mapped.uniqueSessions).toBe(40);
    expect(mapped.byCountry[0]?.label).toBe('Burkina Faso');
    expect(mapped.topPages[0]?.pagePath).toBe('/');
    expect(mapped.recentSessions[0]?.landingPage).toBe('/');
    expect(formatDurationMs(95000)).toBe('1m 35s');
  });
});
