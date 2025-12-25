/**
 * Zoom Integration Service
 * Date: 30 Janvier 2025
 * 
 * Service d'intégration Zoom pour créer des réunions automatiquement
 */

export interface ZoomMeetingConfig {
  topic: string;
  type?: 1 | 2 | 3 | 8; // 1=Instant, 2=Scheduled, 3=Recurring, 8=Recurring with fixed time
  start_time?: string; // ISO 8601 format
  duration?: number; // minutes
  timezone?: string;
  password?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    approval_type?: 0 | 1 | 2; // 0=Automatically, 1=Manually, 2=No registration required
    registration_type?: 1 | 2 | 3; // 1=Attendees register once, 2=Attendees register each occurrence, 3=Attendees register once and can attend any occurrence
    audio?: 'both' | 'telephony' | 'voip';
    auto_recording?: 'local' | 'cloud' | 'none';
    waiting_room?: boolean;
  };
}

export interface ZoomMeeting {
  id: string;
  uuid: string;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password?: string;
  h323_password?: string;
  pstn_password?: string;
  encrypted_password?: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    jbh_time: number;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    registration_type: number;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    enforce_login_domains: string;
    alternative_hosts: string;
    alternative_hosts_email_notification: boolean;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room: boolean;
    global_dial_in_countries: string[];
    global_dial_in_numbers: Array<{
      country: string;
      country_name: string;
      city: string;
      number: string;
      type: string;
    }>;
    contact_name: string;
    contact_email: string;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    authentication_option: string;
    authentication_domains: string;
    additional_data_center_regions: string[];
  };
  recurrence?: {
    type: number;
    repeat_interval: number;
    weekly_days: string;
    monthly_day: number;
    monthly_week: number;
    monthly_week_day: number;
    end_times: number;
    end_date_time: string;
  };
  occurrences?: Array<{
    occurrence_id: string;
    start_time: string;
    duration: number;
    status: string;
  }>;
}

export interface ZoomError {
  code: number;
  message: string;
}

class ZoomService {
  private apiKey: string;
  private apiSecret: string;
  private accountId?: string;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(apiKey?: string, apiSecret?: string, accountId?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ZOOM_API_KEY || '';
    this.apiSecret = apiSecret || import.meta.env.VITE_ZOOM_API_SECRET || '';
    this.accountId = accountId || import.meta.env.VITE_ZOOM_ACCOUNT_ID;
    this.baseUrl = import.meta.env.VITE_ZOOM_API_URL || 'https://api.zoom.us/v2';
  }

  /**
   * Obtient un token d'accès OAuth
   */
  private async getAccessToken(): Promise<string> {
    // Si on a un token valide, le retourner
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Si on utilise OAuth (accountId présent), utiliser Server-to-Server OAuth
    if (this.accountId) {
      return await this.getServerToServerToken();
    }

    // Sinon, utiliser Basic Auth (deprecated mais fonctionne encore)
    return await this.getBasicAuthToken();
  }

  /**
   * Obtient un token Server-to-Server OAuth
   */
  private async getServerToServerToken(): Promise<string> {
    const credentials = btoa(`${this.apiKey}:${this.apiSecret}`);
    
    const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get Zoom token: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Token expire dans 1 heure, on le rafraîchit après 50 minutes
    this.tokenExpiresAt = Date.now() + (50 * 60 * 1000);
    
    return this.accessToken;
  }

  /**
   * Obtient un token Basic Auth (deprecated)
   */
  private async getBasicAuthToken(): Promise<string> {
    // Pour Basic Auth, on encode directement les credentials
    const credentials = btoa(`${this.apiKey}:${this.apiSecret}`);
    return credentials;
  }

  /**
   * Crée une réunion Zoom
   */
  async createMeeting(config: ZoomMeetingConfig): Promise<ZoomMeeting> {
    const token = await this.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Si on utilise OAuth, utiliser Bearer token
    if (this.accountId) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Sinon, utiliser Basic Auth
      headers['Authorization'] = `Basic ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topic: config.topic,
        type: config.type || 2, // Scheduled by default
        start_time: config.start_time,
        duration: config.duration || 60,
        timezone: config.timezone || 'UTC',
        password: config.password,
        agenda: config.agenda,
        settings: {
          host_video: config.settings?.host_video ?? true,
          participant_video: config.settings?.participant_video ?? true,
          join_before_host: config.settings?.join_before_host ?? false,
          mute_upon_entry: config.settings?.mute_upon_entry ?? false,
          watermark: config.settings?.watermark ?? false,
          use_pmi: config.settings?.use_pmi ?? false,
          approval_type: config.settings?.approval_type ?? 0,
          registration_type: config.settings?.registration_type ?? 1,
          audio: config.settings?.audio || 'both',
          auto_recording: config.settings?.auto_recording || 'none',
          waiting_room: config.settings?.waiting_room ?? false,
        },
      }),
    });

    if (!response.ok) {
      const error: ZoomError = await response.json();
      throw new Error(`Failed to create Zoom meeting: ${error.message || response.statusText}`);
    }

    const meeting: ZoomMeeting = await response.json();
    return meeting;
  }

  /**
   * Récupère les détails d'une réunion
   */
  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    const token = await this.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accountId) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Basic ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error: ZoomError = await response.json();
      throw new Error(`Failed to get Zoom meeting: ${error.message || response.statusText}`);
    }

    const meeting: ZoomMeeting = await response.json();
    return meeting;
  }

  /**
   * Met à jour une réunion
   */
  async updateMeeting(meetingId: string, config: Partial<ZoomMeetingConfig>): Promise<ZoomMeeting> {
    const token = await this.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accountId) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Basic ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error: ZoomError = await response.json();
      throw new Error(`Failed to update Zoom meeting: ${error.message || response.statusText}`);
    }

    const meeting: ZoomMeeting = await response.json();
    return meeting;
  }

  /**
   * Supprime une réunion
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    const token = await this.getAccessToken();
    
    const headers: HeadersInit = {};

    if (this.accountId) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Basic ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error: ZoomError = await response.json();
      throw new Error(`Failed to delete Zoom meeting: ${error.message || response.statusText}`);
    }
  }

  /**
   * Récupère les enregistrements d'une réunion
   */
  async getMeetingRecordings(meetingId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accountId) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Basic ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/recordings`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error: ZoomError = await response.json();
      throw new Error(`Failed to get recordings: ${error.message || response.statusText}`);
    }

    return await response.json();
  }
}

export default ZoomService;

