import { describe, expect, it } from 'vitest';
import {
  buildDailyRoomUrl,
  canShowServiceMeetingJoin,
  dailyRoomNameForBooking,
  parseDailyDomain,
  resolveServiceBookingEmailJoinUrl,
  resolveServiceMeetingPlatform,
  zonedLocalDateTimeToUtc,
} from '../daily-meeting';

describe('parseDailyDomain', () => {
  it('parses a subdomain', () => {
    expect(parseDailyDomain('emarzona')).toEqual({
      subdomain: 'emarzona',
      host: 'emarzona.daily.co',
    });
  });

  it('parses a Daily host', () => {
    expect(parseDailyDomain('emarzona.daily.co')).toEqual({
      subdomain: 'emarzona',
      host: 'emarzona.daily.co',
    });
  });

  it('parses a URL', () => {
    expect(parseDailyDomain('https://emarzona.daily.co/')).toEqual({
      subdomain: 'emarzona',
      host: 'emarzona.daily.co',
    });
  });

  it('rejects empty or invalid values', () => {
    expect(parseDailyDomain('')).toBeNull();
    expect(parseDailyDomain('https://zoom.us')).toBeNull();
  });
});

describe('buildDailyRoomUrl', () => {
  it('builds a room URL with an optional token', () => {
    expect(buildDailyRoomUrl('emarzona.daily.co', 'emz-abc')).toBe(
      'https://emarzona.daily.co/emz-abc'
    );
    expect(buildDailyRoomUrl('emarzona.daily.co', 'emz-abc', 'tok+1')).toBe(
      'https://emarzona.daily.co/emz-abc?t=tok%2B1'
    );
  });
});

describe('dailyRoomNameForBooking', () => {
  it('is stable and Daily-safe', () => {
    expect(dailyRoomNameForBooking('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'emz-a1b2c3d4e5f67890abcdef1234567890'
    );
  });
});

describe('resolveServiceMeetingPlatform', () => {
  it('defaults to Daily when configured', () => {
    expect(resolveServiceMeetingPlatform({ dailyConfigured: true })).toBe('daily');
  });

  it('ignores a stale Zoom preference when Daily is configured', () => {
    expect(
      resolveServiceMeetingPlatform({
        preferred: 'zoom',
        dailyConfigured: true,
      })
    ).toBe('daily');
  });

  it('honors an explicit Zoom request even when Daily is configured', () => {
    expect(
      resolveServiceMeetingPlatform({
        requested: 'zoom',
        preferred: 'google_meet',
        dailyConfigured: true,
      })
    ).toBe('zoom');
  });

  it('falls back from Daily when the platform key is missing', () => {
    expect(resolveServiceMeetingPlatform({ dailyConfigured: false })).toBe('zoom');
    expect(
      resolveServiceMeetingPlatform({
        preferred: 'google_meet',
        dailyConfigured: false,
      })
    ).toBe('google_meet');
  });
});

describe('zonedLocalDateTimeToUtc', () => {
  it('converts Europe/Paris summer time to UTC', () => {
    expect(zonedLocalDateTimeToUtc('2026-08-22', '14:30:00', 'Europe/Paris').toISOString()).toBe(
      '2026-08-22T12:30:00.000Z'
    );
  });

  it('converts Europe/Paris winter time to UTC', () => {
    expect(zonedLocalDateTimeToUtc('2026-01-15', '14:30:00', 'Europe/Paris').toISOString()).toBe(
      '2026-01-15T13:30:00.000Z'
    );
  });

  it('keeps UTC wall time as UTC', () => {
    expect(zonedLocalDateTimeToUtc('2026-08-22', '14:30', 'UTC').toISOString()).toBe(
      '2026-08-22T14:30:00.000Z'
    );
  });
});

describe('canShowServiceMeetingJoin', () => {
  it('shows the button for online bookings even without a stored URL', () => {
    expect(canShowServiceMeetingJoin({ locationType: 'online', status: 'confirmed' })).toBe(true);
  });

  it('hides the button for pending bookings until a meeting exists', () => {
    expect(canShowServiceMeetingJoin({ locationType: 'online', status: 'pending' })).toBe(false);
  });

  it('hides the button for cancelled or on-site bookings', () => {
    expect(
      canShowServiceMeetingJoin({
        locationType: 'online',
        status: 'cancelled',
        meetingUrl: 'https://emarzona.daily.co/x',
      })
    ).toBe(false);
    expect(canShowServiceMeetingJoin({ locationType: 'on_site', status: 'confirmed' })).toBe(false);
  });
});

describe('resolveServiceBookingEmailJoinUrl', () => {
  const portal = 'https://www.emarzona.com/account/bookings';

  it('keeps the portal for Daily so the guest remints a fresh token', () => {
    expect(
      resolveServiceBookingEmailJoinUrl({
        meetingUrl: 'https://emarzona.daily.co/emz-abc?t=tok',
        meetingPlatform: 'daily',
        portalUrl: portal,
      })
    ).toBe(portal);
  });

  it('keeps a custom Zoom/Meet URL', () => {
    expect(
      resolveServiceBookingEmailJoinUrl({
        meetingUrl: 'https://zoom.us/j/123',
        meetingPlatform: 'zoom',
        portalUrl: portal,
      })
    ).toBe('https://zoom.us/j/123');
  });
});
