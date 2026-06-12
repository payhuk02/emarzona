/**
 * Google Calendar API helpers (OAuth + freebusy + Meet events)
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface GoogleBusyBlock {
  external_id: string;
  calendar_id: string;
  start: string;
  end: string;
  title?: string;
  timezone?: string;
}

export function getGoogleOAuthConfig() {
  const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ?? '';
  const redirectUri = Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI') ?? '';
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google Calendar OAuth not configured');
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: CALENDAR_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function fetchGoogleCalendarList(
  accessToken: string
): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to list calendars: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    items?: Array<{ id: string; summary: string; primary?: boolean }>;
  };
  return data.items ?? [];
}

export async function fetchGoogleFreeBusy(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  timeZone = 'UTC'
): Promise<GoogleBusyBlock[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone,
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Google freebusy failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  };
  const busy = data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b, i) => ({
    external_id: `freebusy-${calendarId}-${b.start}-${i}`,
    calendar_id: calendarId,
    start: b.start,
    end: b.end,
    title: 'Occupé (Google Calendar)',
    timezone: timeZone,
  }));
}

export interface GoogleMeetCreateResult {
  eventId: string;
  meetingUrl: string;
  htmlLink?: string;
}

export async function createGoogleMeetEvent(
  accessToken: string,
  calendarId: string,
  opts: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone: string;
    attendeeEmail?: string;
  }
): Promise<GoogleMeetCreateResult> {
  const requestId = `meet-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const event = {
    summary: opts.summary,
    description: opts.description ?? '',
    start: { dateTime: opts.startTime, timeZone: opts.timeZone },
    end: { dateTime: opts.endTime, timeZone: opts.timeZone },
    attendees: opts.attendeeEmail ? [{ email: opts.attendeeEmail }] : [],
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Meet create failed: ${await res.text()}`);
  }

  const meeting = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  };

  let meetingUrl = meeting.hangoutLink ?? null;
  if (!meetingUrl && meeting.conferenceData?.entryPoints) {
    const video = meeting.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
    meetingUrl = video?.uri ?? null;
  }
  if (!meetingUrl) {
    throw new Error('Google Meet URL not returned');
  }

  return { eventId: meeting.id, meetingUrl, htmlLink: meeting.htmlLink };
}
