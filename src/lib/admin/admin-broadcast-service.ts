import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type BroadcastChannel = 'email' | 'in_app' | 'popup';
export type BroadcastAudience = 'all' | 'vendors' | 'customers' | 'emails';
export type PopupStyle = 'info' | 'warning' | 'success' | 'announcement';
export type PopupTargetAudience = 'all' | 'authenticated' | 'vendors' | 'customers';

export interface AdminBroadcastRecord {
  id: string;
  created_by: string | null;
  title: string;
  message: string;
  channels: string[];
  audience_type: BroadcastAudience;
  audience_filter: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  stats: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PlatformPopupMessage {
  id: string;
  broadcast_id: string | null;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  style: PopupStyle;
  target_audience: PopupTargetAudience;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  dismissible: boolean;
  show_once: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface SendAdminBroadcastPayload {
  title: string;
  message: string;
  channels: BroadcastChannel[];
  audience: BroadcastAudience;
  emails?: string[];
  popup_options?: {
    action_url?: string;
    action_label?: string;
    style?: PopupStyle;
    dismissible?: boolean;
    show_once?: boolean;
    starts_at?: string;
    ends_at?: string;
    target_audience?: PopupTargetAudience;
  };
}

export interface SendAdminBroadcastResult {
  success: boolean;
  broadcast_id?: string;
  popup_id?: string | null;
  stats?: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  errors?: string[];
  error?: string;
}

export async function sendAdminBroadcast(
  payload: SendAdminBroadcastPayload
): Promise<SendAdminBroadcastResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-admin-broadcast', {
      body: payload,
    });

    if (error) {
      logger.error('sendAdminBroadcast edge error', { error: error.message });
      return { success: false, error: error.message };
    }

    const result = data as SendAdminBroadcastResult & { error?: string };
    if (result?.error) {
      return { success: false, error: result.error };
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('sendAdminBroadcast unexpected error', { error: message });
    return { success: false, error: message };
  }
}

export async function fetchAdminBroadcasts(limit = 50): Promise<AdminBroadcastRecord[]> {
  const { data, error } = await supabase
    .from('admin_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('fetchAdminBroadcasts error', { error: error.message });
    return [];
  }

  return (data || []) as AdminBroadcastRecord[];
}

export async function fetchPlatformPopups(limit = 50): Promise<PlatformPopupMessage[]> {
  const { data, error } = await supabase
    .from('platform_popup_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('fetchPlatformPopups error', { error: error.message });
    return [];
  }

  return (data || []) as PlatformPopupMessage[];
}

export async function updatePlatformPopup(
  id: string,
  updates: Partial<Pick<PlatformPopupMessage, 'is_active' | 'ends_at' | 'title' | 'message'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('platform_popup_messages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error('updatePlatformPopup error', { error: error.message, id });
    return false;
  }

  return true;
}

export async function dismissPlatformPopup(popupId: string): Promise<void> {
  const { error } = await supabase.rpc('dismiss_platform_popup', { p_popup_id: popupId });
  if (error) {
    logger.warn('dismissPlatformPopup error', { error: error.message, popupId });
  }
}

export async function fetchActivePlatformPopups(userId?: string): Promise<PlatformPopupMessage[]> {
  const { data, error } = await supabase.rpc('get_active_platform_popups', {
    p_user_id: userId ?? null,
  });

  if (error) {
    logger.warn('fetchActivePlatformPopups error', { error: error.message });
    return [];
  }

  return (data || []) as PlatformPopupMessage[];
}

const LOCAL_DISMISS_KEY = 'emarzona_dismissed_popups';

export function getLocallyDismissedPopups(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function dismissPopupLocally(popupId: string): void {
  const current = new Set(getLocallyDismissedPopups());
  current.add(popupId);
  localStorage.setItem(LOCAL_DISMISS_KEY, JSON.stringify([...current]));
}
