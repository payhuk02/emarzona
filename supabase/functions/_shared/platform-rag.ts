/**
 * RAG plateforme — chunking, embeddings (1536D) et retrieval via match_platform_content.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_EMBEDDINGS_URL = 'https://ai.gateway.lovable.dev/v1/embeddings';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 120;

export type ContentSourceType = 'blog' | 'faq' | 'product';

export interface RagSettings {
  enabled?: boolean;
  embeddingModel?: string;
  matchCount?: number;
  matchThreshold?: number;
  sourceTypes?: ContentSourceType[];
  locale?: string;
}

export interface ContentChunkInput {
  sourceType: ContentSourceType;
  sourceId: string;
  locale: string;
  chunkIndex: number;
  chunkText: string;
  metadata?: Record<string, unknown>;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const normalized = text.trim();
  if (!normalized) return [];
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) {
      const slice = normalized.slice(start, end);
      const lastSpace = slice.lastIndexOf(' ');
      if (lastSpace > chunkSize * 0.45) {
        end = start + lastSpace;
      }
    }

    const piece = normalized.slice(start, end).trim();
    if (piece) chunks.push(piece);

    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createEmbedding(
  text: string,
  apiKey: string,
  model = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const response = await fetch(LOVABLE_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding API ${response.status}: ${body.slice(0, 300)}`);
  }

  const json = await response.json();
  const embedding = json?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== 1536) {
    throw new Error(`Embedding invalide (attendu 1536 dimensions, reçu ${embedding?.length ?? 0})`);
  }
  return embedding as number[];
}

export async function upsertContentChunks(
  supabase: SupabaseClient,
  chunks: ContentChunkInput[],
  apiKey: string,
  embeddingModel = DEFAULT_EMBEDDING_MODEL
): Promise<{ inserted: number; sourceKey: string }> {
  if (chunks.length === 0) {
    return { inserted: 0, sourceKey: '' };
  }

  const { sourceType, sourceId, locale } = chunks[0];
  const sourceKey = `${sourceType}:${sourceId}:${locale}`;

  await supabase
    .from('content_embeddings')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('locale', locale);

  const rows = [];
  for (const chunk of chunks) {
    const contentHash = await hashText(chunk.chunkText);
    const embedding = await createEmbedding(chunk.chunkText, apiKey, embeddingModel);
    rows.push({
      source_type: chunk.sourceType,
      source_id: chunk.sourceId,
      locale: chunk.locale,
      chunk_index: chunk.chunkIndex,
      chunk_text: chunk.chunkText,
      content_hash: contentHash,
      metadata: chunk.metadata ?? {},
      embedding,
    });
  }

  const { error } = await supabase.from('content_embeddings').insert(rows);
  if (error) throw error;

  return { inserted: rows.length, sourceKey };
}

export async function retrievePlatformRagContext(
  supabase: SupabaseClient,
  query: string,
  apiKey: string,
  settings: RagSettings = {}
): Promise<string> {
  if (settings.enabled === false || !query.trim()) return '';

  const embedding = await createEmbedding(
    query,
    apiKey,
    settings.embeddingModel ?? DEFAULT_EMBEDDING_MODEL
  );

  const { data, error } = await supabase.rpc('match_platform_content', {
    query_embedding: embedding,
    match_threshold: settings.matchThreshold ?? 0.55,
    match_count: settings.matchCount ?? 8,
    filter_locale: settings.locale ?? null,
    filter_source_types: settings.sourceTypes?.length ? settings.sourceTypes : null,
  });

  if (error) {
    console.warn('match_platform_content error', error);
    return '';
  }

  const matches = (data ?? []) as Array<{
    source_type: string;
    chunk_text: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>;

  if (matches.length === 0) return '';

  return matches
    .map((m, i) => {
      const title = (m.metadata?.title as string) || m.source_type;
      const url = m.metadata?.url ? ` (${m.metadata.url})` : '';
      return `[${i + 1}] (${m.source_type}, score ${m.similarity.toFixed(2)}) ${title}${url}\n${m.chunk_text}`;
    })
    .join('\n\n');
}

export async function indexBlogPosts(
  supabase: SupabaseClient,
  apiKey: string,
  embeddingModel: string,
  locale: 'fr' | 'en' = 'fr'
): Promise<number> {
  const { data: posts, error } = await supabase
    .from('platform_blog_posts')
    .select('id, slug, title, excerpt, content, tags, status, translations')
    .eq('status', 'published');

  if (error) throw error;

  let total = 0;
  for (const post of posts ?? []) {
    const tr = (post.translations as Record<string, Record<string, string>> | null)?.[locale];
    const title = tr?.title?.trim() || post.title;
    const excerpt = tr?.excerpt?.trim() || post.excerpt;
    const content = stripHtml(tr?.content?.trim() || post.content || '');
    const body = [`Titre: ${title}`, excerpt ? `Extrait: ${excerpt}` : '', content]
      .filter(Boolean)
      .join('\n\n');

    const pieces = chunkText(body);
    if (pieces.length === 0) continue;

    const chunks: ContentChunkInput[] = pieces.map((piece, index) => ({
      sourceType: 'blog',
      sourceId: post.id,
      locale,
      chunkIndex: index,
      chunkText: piece,
      metadata: {
        title,
        slug: post.slug,
        url: `/blog/${post.slug}`,
        tags: post.tags,
      },
    }));

    const result = await upsertContentChunks(supabase, chunks, apiKey, embeddingModel);
    total += result.inserted;
  }

  return total;
}

export async function indexFaqItems(
  supabase: SupabaseClient,
  apiKey: string,
  embeddingModel: string,
  locale: 'fr' | 'en' = 'fr'
): Promise<number> {
  const [{ data: items, error: itemsError }, { data: categories, error: catError }] =
    await Promise.all([
      supabase
        .from('platform_faq_items')
        .select('id, question, answer, keywords, translations, category_id, is_active')
        .eq('is_active', true),
      supabase.from('platform_faq_categories').select('id, title, slug').eq('is_active', true),
    ]);

  if (itemsError) throw itemsError;
  if (catError) throw catError;

  const catMap = new Map((categories ?? []).map(c => [c.id, c]));
  let total = 0;

  for (const item of items ?? []) {
    const tr = (item.translations as Record<string, Record<string, string>> | null)?.[locale];
    const question = tr?.question?.trim() || item.question;
    const answer = stripHtml(tr?.answer?.trim() || item.answer || '');
    const cat = item.category_id ? catMap.get(item.category_id) : null;
    const body = `Question: ${question}\n\nRéponse: ${answer}`;
    const pieces = chunkText(body);
    if (pieces.length === 0) continue;

    const chunks: ContentChunkInput[] = pieces.map((piece, index) => ({
      sourceType: 'faq',
      sourceId: item.id,
      locale,
      chunkIndex: index,
      chunkText: piece,
      metadata: {
        title: question,
        category: cat?.title,
        url: '/faq',
        keywords: item.keywords,
      },
    }));

    const result = await upsertContentChunks(supabase, chunks, apiKey, embeddingModel);
    total += result.inserted;
  }

  return total;
}

export async function indexProducts(
  supabase: SupabaseClient,
  apiKey: string,
  embeddingModel: string,
  locale = 'fr'
): Promise<number> {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, short_description, category, tags, slug, is_active')
    .eq('is_active', true)
    .limit(5000);

  if (error) throw error;

  let total = 0;
  for (const product of products ?? []) {
    const body = [
      `Produit: ${product.name}`,
      product.short_description ? `Résumé: ${product.short_description}` : '',
      product.description ? `Description: ${stripHtml(product.description)}` : '',
      product.category ? `Catégorie: ${product.category}` : '',
      product.tags?.length ? `Tags: ${product.tags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const pieces = chunkText(body);
    if (pieces.length === 0) continue;

    const chunks: ContentChunkInput[] = pieces.map((piece, index) => ({
      sourceType: 'product',
      sourceId: product.id,
      locale,
      chunkIndex: index,
      chunkText: piece,
      metadata: {
        title: product.name,
        url: product.slug ? `/product/${product.slug}` : undefined,
        category: product.category,
      },
    }));

    const result = await upsertContentChunks(supabase, chunks, apiKey, embeddingModel);
    total += result.inserted;
  }

  return total;
}
