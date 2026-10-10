/**
 * Client helpers for platform contact chat (user ↔ admin) + media attachments.
 */
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToStorage } from '@/services/fileUploadService';
import { ATTACHMENTS_BUCKET } from '@/lib/attachments/storage-ref';

export type PlatformContactThread = {
  id: string;
  user_id: string;
  full_name: string;
  status: 'open' | 'closed';
  user_unread_count: number;
  admin_unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformContactAttachment = {
  id: string;
  message_id: string;
  kind: 'image' | 'audio' | 'file';
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  /** Resolved signed URL (client-side). */
  signedUrl?: string | null;
};

export type PlatformContactMessage = {
  id: string;
  thread_id: string;
  sender_type: 'user' | 'admin';
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  attachments?: PlatformContactAttachment[];
};

export type PendingContactMedia = {
  id: string;
  file: File;
  kind: 'image' | 'audio' | 'file';
  previewUrl?: string;
};

const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const rpc = supabase.rpc.bind(supabase) as (
  fn: string,
  args?: Record<string, unknown>
) => ReturnType<typeof supabase.rpc>;

const fromTable = (table: string) =>
  (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(table);

export function detectContactMediaKind(file: File): 'image' | 'audio' | 'file' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
}

export async function fetchMyContactThread(userId: string): Promise<PlatformContactThread | null> {
  const { data, error } = await fromTable('platform_contact_threads')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as PlatformContactThread | null) ?? null;
}

async function signAttachmentPaths(
  rows: PlatformContactAttachment[]
): Promise<PlatformContactAttachment[]> {
  return Promise.all(
    rows.map(async row => {
      const { data, error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      return {
        ...row,
        signedUrl: error ? null : (data?.signedUrl ?? null),
      };
    })
  );
}

export async function fetchContactMessages(threadId: string): Promise<PlatformContactMessage[]> {
  const { data, error } = await fromTable('platform_contact_messages')
    .select('*, attachments:platform_contact_attachments(*)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const messages = (data as PlatformContactMessage[]) ?? [];
  return Promise.all(
    messages.map(async msg => {
      const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
      return {
        ...msg,
        attachments: await signAttachmentPaths(attachments),
      };
    })
  );
}

async function ensureUserThread(userId: string, fullName: string): Promise<PlatformContactThread> {
  const name = fullName.trim();
  let thread = await fetchMyContactThread(userId);

  if (!thread) {
    const { data, error } = await fromTable('platform_contact_threads')
      .insert({
        user_id: userId,
        full_name: name,
        status: 'open',
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as PlatformContactThread;
  }

  if (thread.full_name !== name) {
    await fromTable('platform_contact_threads')
      .update({ full_name: name, updated_at: new Date().toISOString() })
      .eq('id', thread.id);
    thread = { ...thread, full_name: name };
  }

  return thread;
}

async function uploadAndLinkAttachments(
  messageId: string,
  userId: string,
  files: PendingContactMedia[]
): Promise<void> {
  for (const item of files.slice(0, MAX_ATTACHMENTS)) {
    if (item.file.size > MAX_FILE_BYTES) {
      throw new Error(`« ${item.file.name} » dépasse 10 Mo`);
    }
    const upload = await uploadFileToStorage(item.file, {
      bucket: ATTACHMENTS_BUCKET,
      folder: `platform-contact/${userId}`,
      maxSize: MAX_FILE_BYTES,
      compressImages: item.kind === 'image',
    });

    const { error } = await fromTable('platform_contact_attachments').insert({
      message_id: messageId,
      kind: item.kind,
      file_name: upload.fileName || item.file.name,
      file_type: upload.mimeType || item.file.type || 'application/octet-stream',
      file_size: upload.size || item.file.size,
      storage_path: upload.path,
    });
    if (error) throw error;
  }
}

export async function sendUserContactMessage(input: {
  userId: string;
  fullName: string;
  content: string;
  media?: PendingContactMedia[];
}): Promise<{ threadId: string; messageId: string }> {
  const name = input.fullName.trim();
  const content = input.content.trim();
  const media = input.media ?? [];

  if (!name) throw new Error('Le nom et prénom sont requis');
  if (!content && media.length === 0) {
    throw new Error('Écrivez un message ou ajoutez une pièce jointe');
  }
  if (media.length > MAX_ATTACHMENTS) {
    throw new Error(`Maximum ${MAX_ATTACHMENTS} pièces jointes`);
  }

  const thread = await ensureUserThread(input.userId, name);

  const { data: msg, error: msgError } = await fromTable('platform_contact_messages')
    .insert({
      thread_id: thread.id,
      sender_type: 'user',
      sender_id: input.userId,
      content,
    })
    .select('id')
    .single();
  if (msgError) throw msgError;

  const messageId = (msg as { id: string }).id;
  if (media.length > 0) {
    try {
      await uploadAndLinkAttachments(messageId, input.userId, media);
    } catch (uploadErr) {
      // Roll back empty media-only messages; keep text if present
      if (!content) {
        await fromTable('platform_contact_messages').delete().eq('id', messageId);
      }
      throw uploadErr instanceof Error
        ? uploadErr
        : new Error("Échec de l'envoi des pièces jointes");
    }
  }

  return { threadId: thread.id, messageId };
}

export async function markUserRepliesRead(threadId: string): Promise<void> {
  const { error } = await rpc('mark_platform_contact_replies_read', {
    p_thread_id: threadId,
  });
  if (error) throw error;
}

export async function fetchAdminContactThreads(): Promise<PlatformContactThread[]> {
  const { data, error } = await fromTable('platform_contact_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data as PlatformContactThread[]) ?? [];
}

export async function sendAdminContactReply(input: {
  threadId: string;
  threadUserId: string;
  adminUserId: string;
  content: string;
  media?: PendingContactMedia[];
}): Promise<void> {
  const content = input.content.trim();
  const media = input.media ?? [];
  if (!content && media.length === 0) {
    throw new Error('Écrivez une réponse ou ajoutez une pièce jointe');
  }
  if (media.length > MAX_ATTACHMENTS) {
    throw new Error(`Maximum ${MAX_ATTACHMENTS} pièces jointes`);
  }

  const { data: msg, error } = await fromTable('platform_contact_messages')
    .insert({
      thread_id: input.threadId,
      sender_type: 'admin',
      sender_id: input.adminUserId,
      content,
    })
    .select('id')
    .single();
  if (error) throw error;

  const messageId = (msg as { id: string }).id;
  if (media.length > 0) {
    try {
      // Store under thread owner's folder so the user can read signed URLs
      await uploadAndLinkAttachments(messageId, input.threadUserId, media);
    } catch (uploadErr) {
      if (!content) {
        await fromTable('platform_contact_messages').delete().eq('id', messageId);
      }
      throw uploadErr instanceof Error
        ? uploadErr
        : new Error("Échec de l'envoi des pièces jointes");
    }
  }
}

export async function markAdminThreadRead(threadId: string): Promise<void> {
  const { error } = await rpc('mark_platform_contact_admin_read', {
    p_thread_id: threadId,
  });
  if (error) throw error;
}

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
