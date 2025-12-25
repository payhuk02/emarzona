/**
 * Google Meet Integration Service
 * Date: 31 Janvier 2025
 * 
 * Service d'intégration Google Meet pour créer des réunions automatiquement
 * Utilise Google Calendar API pour créer des événements avec Meet
 */

export interface GoogleMeetConfig {
  summary: string; // Titre de la réunion
  description?: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  timeZone?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    createRequest?: {
      requestId: string; // Unique ID for the request
      conferenceSolutionKey?: {
        type: 'hangoutsMeet' | 'eventHangout';
      };
    };
  };
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface GoogleMeetEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: 'video' | 'phone' | 'sip' | 'more';
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      key: {
        type: string;
      };
      name: string;
      iconUri: string;
    };
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  htmlLink?: string;
}

export interface GoogleMeetError {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

class GoogleMeetService {
  private accessToken: string;
  private calendarId: string; // 'primary' or specific calendar ID

  constructor(accessToken: string, calendarId: string = 'primary') {
    this.accessToken = accessToken;
    this.calendarId = calendarId;
  }

  /**
   * Crée un événement Google Calendar avec Google Meet
   */
  async createMeeting(config: GoogleMeetConfig): Promise<GoogleMeetEvent> {
    const requestId = config.conferenceData?.createRequest?.requestId || 
      `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const event = {
      summary: config.summary,
      description: config.description || '',
      start: {
        dateTime: config.startTime,
        timeZone: config.timeZone || 'UTC',
      },
      end: {
        dateTime: config.endTime,
        timeZone: config.timeZone || 'UTC',
      },
      attendees: config.attendees || [],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: config.reminders || {
        useDefault: true,
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error: GoogleMeetError = await response.json();
      throw new Error(
        `Failed to create Google Meet: ${error.error?.message || response.statusText}`
      );
    }

    const meeting: GoogleMeetEvent = await response.json();
    return meeting;
  }

  /**
   * Récupère les détails d'un événement
   */
  async getMeeting(eventId: string): Promise<GoogleMeetEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}?conferenceDataVersion=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error: GoogleMeetError = await response.json();
      throw new Error(
        `Failed to get Google Meet: ${error.error?.message || response.statusText}`
      );
    }

    const meeting: GoogleMeetEvent = await response.json();
    return meeting;
  }

  /**
   * Met à jour un événement
   */
  async updateMeeting(
    eventId: string,
    config: Partial<GoogleMeetConfig>
  ): Promise<GoogleMeetEvent> {
    // D'abord récupérer l'événement existant
    const existingEvent = await this.getMeeting(eventId);

    const updatedEvent = {
      ...existingEvent,
      summary: config.summary || existingEvent.summary,
      description: config.description !== undefined ? config.description : existingEvent.description,
      start: config.startTime
        ? {
            dateTime: config.startTime,
            timeZone: config.timeZone || existingEvent.start.timeZone,
          }
        : existingEvent.start,
      end: config.endTime
        ? {
            dateTime: config.endTime,
            timeZone: config.timeZone || existingEvent.end.timeZone,
          }
        : existingEvent.end,
      attendees: config.attendees || existingEvent.attendees,
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}?conferenceDataVersion=1`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      }
    );

    if (!response.ok) {
      const error: GoogleMeetError = await response.json();
      throw new Error(
        `Failed to update Google Meet: ${error.error?.message || response.statusText}`
      );
    }

    const meeting: GoogleMeetEvent = await response.json();
    return meeting;
  }

  /**
   * Supprime un événement
   */
  async deleteMeeting(eventId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error: GoogleMeetError = await response.json();
      throw new Error(
        `Failed to delete Google Meet: ${error.error?.message || response.statusText}`
      );
    }
  }

  /**
   * Récupère l'URL de la réunion depuis un événement
   */
  getMeetingUrl(event: GoogleMeetEvent): string | null {
    // Google Meet URL peut être dans hangoutLink ou dans conferenceData
    if (event.hangoutLink) {
      return event.hangoutLink;
    }

    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (ep) => ep.entryPointType === 'video'
      );
      if (videoEntry) {
        return videoEntry.uri;
      }
    }

    return null;
  }
}

export default GoogleMeetService;

