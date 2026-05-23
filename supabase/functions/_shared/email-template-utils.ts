/**
 * Utilitaires partagés : chargement et rendu des templates email (DB)
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface DbEmailTemplate {
  id: string;
  slug: string;
  name: string;
  category?: string;
  subject: Record<string, string>;
  html_content: Record<string, string>;
  text_content?: Record<string, string> | null;
  from_email?: string;
  from_name?: string;
  product_type?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text?: string;
  templateId: string;
  templateSlug: string;
  category: string;
  fromEmail?: string;
  fromName?: string;
}

export function replaceVariables(content: string, variables: Record<string, unknown>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const safe = value === null || value === undefined ? '' : String(value);
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), safe);
  }
  return result;
}

export function pickLocalized(
  field: Record<string, string> | null | undefined,
  language: string
): string {
  if (!field || typeof field !== 'object') return '';
  return field[language] || field['fr'] || field['en'] || Object.values(field)[0] || '';
}

export async function fetchEmailTemplate(
  supabase: SupabaseClient,
  slug: string,
  productType?: string | null
): Promise<DbEmailTemplate | null> {
  if (productType) {
    const { data } = await supabase
      .from('email_templates')
      .select(
        'id,slug,name,category,subject,html_content,text_content,from_email,from_name,product_type'
      )
      .eq('slug', slug)
      .eq('product_type', productType)
      .eq('is_active', true)
      .maybeSingle();
    if (data) return data as DbEmailTemplate;
  }

  const { data, error } = await supabase
    .from('email_templates')
    .select(
      'id,slug,name,category,subject,html_content,text_content,from_email,from_name,product_type'
    )
    .eq('slug', slug)
    .is('product_type', null)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as DbEmailTemplate;
}

export async function resolveUserLanguage(
  supabase: SupabaseClient,
  userId?: string
): Promise<string> {
  if (!userId) return 'fr';
  const { data } = await supabase
    .from('email_preferences')
    .select('preferred_language')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.preferred_language || 'fr';
}

export async function renderDbTemplate(
  supabase: SupabaseClient,
  slug: string,
  variables: Record<string, unknown>,
  options?: {
    productType?: string | null;
    language?: string;
    userId?: string;
  }
): Promise<RenderedEmail | null> {
  const template = await fetchEmailTemplate(supabase, slug, options?.productType);
  if (!template) return null;

  const language =
    options?.language || (await resolveUserLanguage(supabase, options?.userId)) || 'fr';

  const subject = replaceVariables(pickLocalized(template.subject, language), variables);
  const html = replaceVariables(pickLocalized(template.html_content, language), variables);
  const textRaw = pickLocalized(template.text_content ?? undefined, language);
  const text = textRaw ? replaceVariables(textRaw, variables) : undefined;

  return {
    subject,
    html,
    text,
    templateId: template.id,
    templateSlug: template.slug,
    category: template.category || 'transactional',
    fromEmail: template.from_email,
    fromName: template.from_name,
  };
}

export async function logEmailSend(
  supabase: SupabaseClient,
  log: {
    template_id?: string;
    template_slug: string;
    recipient_email: string;
    recipient_name?: string;
    user_id?: string;
    subject: string;
    html_content?: string;
    product_type?: string;
    product_id?: string;
    product_name?: string;
    order_id?: string;
    store_id?: string;
    variables?: Record<string, unknown>;
    sendgrid_message_id?: string;
    sendgrid_status: string;
    error_message?: string;
    error_code?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('email_logs').insert({
    ...log,
    variables: log.variables ?? {},
    sent_at: new Date().toISOString(),
  });
  if (error) {
    console.error(
      JSON.stringify({ level: 'error', message: 'Failed to log email', error: error.message })
    );
  }
}
