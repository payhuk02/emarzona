/**
 * Isolation tenant GraphQL sans JWT legacy :
 * - injection de filtres store_id dans les requêtes pg_graphql
 * - validation des scopes et des mutations
 * - sanitization défensive des réponses JSON
 */

/** Collections pg_graphql (camelCase) → champ de filtre tenant */
export const TENANT_COLLECTIONS: Record<string, string> = {
  productsCollection: 'storeId',
  ordersCollection: 'storeId',
  customersCollection: 'storeId',
  subscriptionsCollection: 'storeId',
  aiCreditsCollection: 'storeId',
  aiProductGenerationsCollection: 'storeId',
  storeApiKeysCollection: 'storeId',
  productVolumePricingCollection: 'storeId',
  storesCollection: 'id',
};

/** Collections nécessitant un scope explicite (en plus de read_catalog si applicable) */
export const SCOPE_REQUIRED: Record<string, string> = {
  customersCollection: 'read_customers',
  ordersCollection: 'read_orders',
};

export class TenantGuardError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = 'TenantGuardError';
    this.status = status;
  }
}

function escapeGraphqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function findMatchingParen(source: string, openIndex: number): number {
  if (source[openIndex] !== '(') return -1;
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function mergeFilterArg(args: string, field: string, storeId: string): string {
  const tenantFilter = `${field}: { eq: "${escapeGraphqlString(storeId)}" }`;
  const filterRe = /filter\s*:\s*\{([^}]*)\}/i;
  const match = args.match(filterRe);

  if (match) {
    const inner = match[1].trim();
    const mergedInner = inner ? `${tenantFilter}, ${inner}` : tenantFilter;
    return args.replace(filterRe, `filter: { ${mergedInner} }`);
  }

  const trimmed = args.trim();
  if (!trimmed) return `filter: { ${tenantFilter} }`;
  return `filter: { ${tenantFilter} }, ${trimmed}`;
}

/** Injecte `filter: { field: { eq: storeId } }` sur chaque collection tenant-scoped. */
export function injectTenantFilters(query: string, storeId: string): string {
  let result = query;

  for (const collection of Object.keys(TENANT_COLLECTIONS)) {
    const field = TENANT_COLLECTIONS[collection];
    const callRe = new RegExp(`\\b${collection}\\s*\\(`, 'gi');
    const replacements: Array<{ start: number; end: number; text: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = callRe.exec(result)) !== null) {
      const openParen = match.index + match[0].length - 1;
      const closeParen = findMatchingParen(result, openParen);
      if (closeParen === -1) continue;

      const argsStart = openParen + 1;
      const args = result.slice(argsStart, closeParen);
      replacements.push({
        start: argsStart,
        end: closeParen,
        text: mergeFilterArg(args, field, storeId),
      });
    }

    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, text } = replacements[i];
      result = result.slice(0, start) + text + result.slice(end);
    }
  }

  return result;
}

function splitGraphqlObjects(block: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < block.length; i++) {
    if (block[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (block[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(block.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objects.length ? objects : [block.trim()];
}

function forceStoreIdInObject(obj: string, storeId: string): string {
  const withoutStoreId = obj
    .replace(/storeId\s*:\s*"[^"]*"/gi, '')
    .replace(/storeId\s*:\s*[^,}\s]+/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/\{\s*,/g, '{')
    .replace(/,\s*\}/g, '}');

  const inner = withoutStoreId
    .replace(/^\{\s*/, '')
    .replace(/\s*\}$/, '')
    .trim();
  return `{ storeId: "${escapeGraphqlString(storeId)}"${inner ? `, ${inner}` : ''} }`;
}

/** Force storeId sur les inserts et ré-injecte les filtres sur updates/deletes. */
export function enforceMutationTenantScope(query: string, storeId: string): string {
  let scoped = query;

  const insertRe = /insertInto(\w+)Collection\s*\(\s*objects\s*:\s*\[/gi;
  const insertReplacements: Array<{ start: number; end: number; text: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = insertRe.exec(scoped)) !== null) {
    const bracketStart = match.index + match[0].length;
    const bracketEnd = findMatchingBracket(scoped, bracketStart - 1);
    if (bracketEnd === -1) continue;

    const objectsBlock = scoped.slice(bracketStart, bracketEnd);
    const objects = splitGraphqlObjects(objectsBlock);
    const forced = objects.map(obj => forceStoreIdInObject(obj, storeId)).join(', ');
    insertReplacements.push({ start: bracketStart, end: bracketEnd, text: forced });
  }

  for (let i = insertReplacements.length - 1; i >= 0; i--) {
    const { start, end, text } = insertReplacements[i];
    scoped = scoped.slice(0, start) + text + scoped.slice(end);
  }

  return injectTenantFilters(scoped, storeId);
}

function findMatchingBracket(source: string, openIndex: number): number {
  if (source[openIndex] !== '[') return -1;
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function assertQueryAllowed(query: string, scopes: string[]): void {
  const normalized = query.replace(/\s+/g, ' ').trim();

  if (/\b__schema\b/i.test(normalized) && !/\b__typename\b/i.test(normalized)) {
    throw new TenantGuardError('Schema introspection is disabled on the headless API', 403);
  }

  const isMutation = normalized.toLowerCase().startsWith('mutation');
  if (isMutation && !scopes.includes('write_orders') && !scopes.includes('write_catalog')) {
    throw new TenantGuardError(
      'Your API key does not have write permissions. Required scope: write_orders or write_catalog',
      403
    );
  }

  for (const [collection, requiredScope] of Object.entries(SCOPE_REQUIRED)) {
    if (
      new RegExp(`\\b${collection}\\b`, 'i').test(normalized) &&
      !scopes.includes(requiredScope)
    ) {
      throw new TenantGuardError(
        `Missing required scope "${requiredScope}" for ${collection}`,
        403
      );
    }
  }
}

/** Applique isolation complète sur la requête GraphQL. */
export function scopeGraphqlQuery(query: string, storeId: string, scopes: string[]): string {
  assertQueryAllowed(query, scopes);
  if (/^\s*mutation/i.test(query)) {
    return enforceMutationTenantScope(query, storeId);
  }
  return injectTenantFilters(query, storeId);
}

/** Sanitize défensif : retire les nœuds dont storeId/id ne correspond pas au tenant. */
export function sanitizeGraphqlResponse(rawBody: string, storeId: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    return JSON.stringify(sanitizeValue(parsed, storeId));
  } catch {
    return rawBody;
  }
}

function sanitizeValue(value: unknown, storeId: string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, storeId)).filter(item => item !== null);
  }
  if (typeof value !== 'object') return value;

  const obj = value as Record<string, unknown>;

  if (typeof obj.storeId === 'string' && obj.storeId !== storeId) return null;
  if (typeof obj.store_id === 'string' && obj.store_id !== storeId) return null;

  if (typeof obj.id === 'string' && typeof obj.slug === 'string' && obj.id !== storeId) {
    return null;
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'edges' && Array.isArray(val)) {
      out[key] = val.map(edge => sanitizeValue(edge, storeId)).filter(edge => edge !== null);
      continue;
    }
    if (key === 'node') {
      const node = sanitizeValue(val, storeId);
      if (node === null) continue;
      out[key] = node;
      continue;
    }
    out[key] = sanitizeValue(val, storeId);
  }
  return out;
}
