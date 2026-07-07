/**
 * Utilitaires partagés : chargement et rendu des templates email (DB)
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DbEmailTemplate {
  id: string;
  slug: string;
  name: string;
  category?: string;
  subject: Record<string, string> | string;
  html_content: Record<string, string> | string;
  text_content?: Record<string, string> | string | null;
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

/** Legacy slug aliases → templates en base */
/** Fallback uniquement si le slug dédié n'existe pas en base */
export const EMAIL_TEMPLATE_SLUG_ALIASES: Record<string, string> = {
  'welcome-user': 'welcome',
};

export function resolveEmailTemplateSlug(slug: string): string {
  return EMAIL_TEMPLATE_SLUG_ALIASES[slug] ?? slug;
}

function isTruthyVariable(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false;
  if (value === '' || value === 'false' || value === '0') return false;
  return true;
}

/** Remplace {{var}} et évalue les blocs simples {{#if var}}...{{/if}} */
export function replaceVariables(content: string, variables: Record<string, unknown>): string {
  let result = content;

  result = result.replace(
    /\{\{#if\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, block: string) => (isTruthyVariable(variables[key]) ? block : '')
  );
  result = result.replace(
    /\{\{#unless\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key: string, block: string) => (!isTruthyVariable(variables[key]) ? block : '')
  );

  for (const [key, value] of Object.entries(variables)) {
    const safe = value === null || value === undefined ? '' : String(value);
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), safe);
  }

  return result.replace(/\{\{#[^}]+\}\}[\s\S]*?\{\{\/[^}]+\}\}/g, '');
}

export function pickLocalized(
  field: Record<string, string> | string | null | undefined,
  language: string
): string {
  if (!field) return '';
  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return pickLocalized(parsed as Record<string, string>, language);
        }
      } catch {
        /* plain text subject/body */
      }
    }
    return field;
  }
  if (typeof field !== 'object') return String(field);
  return field[language] || field['fr'] || field['en'] || Object.values(field)[0] || '';
}

export async function fetchEmailTemplate(
  supabase: SupabaseClient,
  slug: string,
  productType?: string | null
): Promise<DbEmailTemplate | null> {
  const resolvedSlug = resolveEmailTemplateSlug(slug);

  if (productType) {
    const { data } = await supabase
      .from('email_templates')
      .select(
        'id,slug,name,category,subject,html_content,text_content,from_email,from_name,product_type'
      )
      .eq('slug', resolvedSlug)
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
    .eq('slug', resolvedSlug)
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

  const subjectRaw = pickLocalized(template.subject, language);
  const htmlRaw = pickLocalized(template.html_content, language);

  // #region agent log
  fetch('http://127.0.0.1:7740/ingest/c21af8ec-02ef-48c9-95f8-23aa8fa2c366', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fed886' },
    body: JSON.stringify({
      sessionId: 'fed886',
      hypothesisId: 'H1-email-json-text',
      location: 'email-template-utils.ts:renderDbTemplate',
      message: 'Template localized preview',
      data: {
        slug,
        language,
        subjectType: typeof template.subject,
        subjectLooksJson: subjectRaw.trim().startsWith('{"'),
        subjectPreview: subjectRaw.slice(0, 100),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const subject = replaceVariables(subjectRaw, variables);
  const html = replaceVariables(htmlRaw, variables);
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
    provider_message_id?: string;
    status: string;
    error_message?: string;
    error_code?: string;
  }
): Promise<void> {
  const variables = log.variables ?? {};
  const metadata: Record<string, unknown> = {
    template_slug: log.template_slug,
    recipient_name: log.recipient_name,
    product_type: log.product_type,
    product_id: log.product_id,
    product_name: log.product_name,
    order_id: log.order_id,
    store_id: log.store_id,
    error_code: log.error_code,
    ...variables,
  };

  const { error } = await supabase.from('email_logs').insert({
    template_id: log.template_id,
    user_id: log.user_id,
    to_email: log.recipient_email,
    subject: log.subject,
    status: log.status,
    provider_message_id: log.provider_message_id,
    campaign_id: (variables.campaign_id as string) || null,
    sequence_id: (variables.sequence_id as string) || null,
    error_message: log.error_message,
    metadata,
    created_at: new Date().toISOString(),
  });
  if (error) {
    console.error(
      JSON.stringify({ level: 'error', message: 'Failed to log email', error: error.message })
    );
  }
}

/**
 * Convertit du HTML brut en texte brut simple pour améliorer la délivrabilité
 */
export function htmlToText(html: string): string {
  let text = html;
  
  // Supprimer les balises style et script
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  text = text.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  
  // Remplacer les retours à la ligne HTML par des sauts de ligne
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Insérer des sauts de ligne pour les balises de structure
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  
  // Supprimer toutes les autres balises HTML
  text = text.replace(/<[^>]+>/g, '');
  
  // Décoder les entités HTML courantes
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  
  // Nettoyer les espaces multiples et les sauts de ligne consécutifs
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  return text.trim();
}
