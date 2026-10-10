/**
 * Lightweight admin unread helpers — keep out of app-core (no upload / compression deps).
 */
import { supabase } from '@/integrations/supabase/client';

const rpc = supabase.rpc.bind(supabase) as (
  fn: string,
  args?: Record<string, unknown>
) => ReturnType<typeof supabase.rpc>;

const fromTable = (table: string) =>
  (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(table);

export async function fetchAdminContactUnreadTotal(): Promise<number> {
  const { data, error } = await rpc('platform_contact_admin_unread_total');
  if (error) {
    // Fallback if RPC not yet applied
    const { data: rows, error: listErr } = await fromTable('platform_contact_threads')
      .select('admin_unread_count')
      .gt('admin_unread_count', 0);
    if (listErr) throw error;
    const sum = ((rows as { admin_unread_count: number }[]) ?? []).reduce(
      (acc, r) => acc + (r.admin_unread_count || 0),
      0
    );
    return sum;
  }
  return typeof data === 'number' ? data : Number(data) || 0;
}
