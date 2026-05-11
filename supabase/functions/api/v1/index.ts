/**
 * API Publique Emarzona - Edge Function
 * Date: 28 Janvier 2025
 * 
 * Point d'entrée principal de l'API publique
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.25.76';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    'Vary': 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}

const genericBodySchema = z.record(z.any());
const productBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(10000).optional(),
    sku: z.string().max(120).optional(),
    status: z.string().max(50).optional(),
    price: z.union([z.number(), z.string()]).optional(),
    compare_price: z.union([z.number(), z.string()]).optional(),
    quantity: z.union([z.number().int(), z.string()]).optional(),
    currency: z.string().max(10).optional(),
  })
  .catchall(z.any());

const orderBodySchema = z
  .object({
    customer_id: z.string().uuid().optional(),
    customer_email: z.string().email().optional(),
    status: z.string().max(50).optional(),
    payment_status: z.string().max(50).optional(),
    total_amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().max(10).optional(),
    notes: z.string().max(5000).optional(),
  })
  .catchall(z.any());

const customerBodySchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().max(255).optional(),
    full_name: z.string().max(255).optional(),
    phone: z.string().max(50).optional(),
  })
  .catchall(z.any());
const forbiddenFields = new Set([
  'id',
  'store_id',
  'user_id',
  'created_at',
  'updated_at',
  'deleted_at',
]);

const PRODUCT_PUBLIC_FIELDS =
  'id,store_id,name,description,sku,status,price,compare_price,quantity,currency,created_at,updated_at';
const CUSTOMER_PUBLIC_FIELDS =
  'id,store_id,email,name,full_name,phone,created_at,updated_at';

function sanitizeWritePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (forbiddenFields.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

async function parseAndSanitizeBody(
  req: Request,
  schema: z.ZodSchema<Record<string, unknown>> = genericBodySchema
): Promise<Record<string, unknown>> {
  const json = await req.json();
  const parsed = schema.parse(json);
  const sanitized = sanitizeWritePayload(parsed);
  if (Object.keys(sanitized).length === 0) {
    throw new Error('Empty or invalid payload');
  }
  return sanitized;
}

function parsePaginationParam(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function hasPermission(apiKeyInfo: { permissions: any }, permission: string): boolean {
  const rawPermissions = apiKeyInfo?.permissions;
  if (!rawPermissions) return false;
  if (rawPermissions === '*') return true;
  if (Array.isArray(rawPermissions)) {
    return rawPermissions.includes('*') || rawPermissions.includes(permission);
  }
  if (typeof rawPermissions === 'object') {
    if (rawPermissions['*'] === true) return true;
    return rawPermissions[permission] === true;
  }
  return false;
}

function ensurePermission(
  apiKeyInfo: { permissions: any },
  permission: string,
  corsHeaders: Record<string, string>
): Response | null {
  if (!hasPermission(apiKeyInfo, permission)) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: `Missing permission: ${permission}` }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer la clé API depuis les headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Vérifier la clé API via la fonction SQL
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .rpc('verify_api_key', { p_key: apiKey });

    if (apiKeyError || !apiKeyData || apiKeyData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKeyInfo = apiKeyData[0];

    // Parser l'URL pour déterminer l'endpoint
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/v1', '');
    const method = req.method;

    // Router vers les différents endpoints
    if (path.startsWith('/products')) {
      return handleProducts(req, method, apiKeyInfo, supabaseAdmin);
    } else if (path.startsWith('/orders')) {
      return handleOrders(req, method, apiKeyInfo, supabaseAdmin);
    } else if (path.startsWith('/customers')) {
      return handleCustomers(req, method, apiKeyInfo, supabaseAdmin);
    } else if (path.startsWith('/analytics')) {
      return handleAnalytics(req, method, apiKeyInfo, supabaseAdmin);
    } else if (path.startsWith('/webhooks')) {
      return handleWebhooks(req, method, apiKeyInfo, supabaseAdmin);
    } else if (path.startsWith('/export')) {
      return handleExport(req, method, apiKeyInfo, supabaseAdmin);
    } else if (path.startsWith('/import')) {
      return handleImport(req, method, apiKeyInfo, supabaseAdmin);
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler pour les produits
async function handleProducts(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/v1/products', '');
  const productId = path.replace('/', '');

  if (method === 'GET') {
    if (productId) {
      // GET /products/:id
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_PUBLIC_FIELDS)
        .eq('id', productId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // GET /products
      const page = parsePaginationParam(url.searchParams.get('page'), 1, 1000);
      const limit = parsePaginationParam(url.searchParams.get('limit'), 20, 100);
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('products')
        .select(PRODUCT_PUBLIC_FIELDS, { count: 'exact' })
        .eq('store_id', apiKeyInfo.store_id)
        .range(offset, offset + limit - 1);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          data,
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'POST') {
    const permissionError = ensurePermission(apiKeyInfo, 'products:write', corsHeaders);
    if (permissionError) return permissionError;

    // POST /products
    const body = await parseAndSanitizeBody(req, productBodySchema);
    const { data, error } = await supabase
      .from('products')
      .insert({ ...body, store_id: apiKeyInfo.store_id })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else if (method === 'PUT' && productId) {
    const permissionError = ensurePermission(apiKeyInfo, 'products:write', corsHeaders);
    if (permissionError) return permissionError;

    // PUT /products/:id
    const body = await parseAndSanitizeBody(req, productBodySchema);
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', productId)
      .eq('store_id', apiKeyInfo.store_id)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else if (method === 'DELETE' && productId) {
    const permissionError = ensurePermission(apiKeyInfo, 'products:delete', corsHeaders);
    if (permissionError) return permissionError;

    // DELETE /products/:id
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', apiKeyInfo.store_id);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler pour les commandes
async function handleOrders(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/v1/orders', '');
  const orderId = path.replace('/', '');

  if (method === 'GET') {
    if (orderId) {
      // GET /orders/:id
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), customers(*)')
        .eq('id', orderId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // GET /orders
      const page = parsePaginationParam(url.searchParams.get('page'), 1, 1000);
      const limit = parsePaginationParam(url.searchParams.get('limit'), 20, 100);
      const offset = (page - 1) * limit;
      const status = url.searchParams.get('status');

      let query = supabase
        .from('orders')
        .select('id,order_number,status,payment_status,total_amount,currency,created_at', { count: 'exact' })
        .eq('store_id', apiKeyInfo.store_id)
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          data,
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'POST') {
    const permissionError = ensurePermission(apiKeyInfo, 'orders:write', corsHeaders);
    if (permissionError) return permissionError;

    // POST /orders
    const body = await parseAndSanitizeBody(req, orderBodySchema);
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...body, store_id: apiKeyInfo.store_id })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler pour les clients
async function handleCustomers(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/v1/customers', '');
  const customerId = path.replace('/', '');

  if (method === 'GET') {
    if (customerId) {
      // GET /customers/:id
      const { data, error } = await supabase
        .from('customers')
        .select(CUSTOMER_PUBLIC_FIELDS)
        .eq('id', customerId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // GET /customers
      const page = parsePaginationParam(url.searchParams.get('page'), 1, 1000);
      const limit = parsePaginationParam(url.searchParams.get('limit'), 20, 100);
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('customers')
        .select(CUSTOMER_PUBLIC_FIELDS, { count: 'exact' })
        .eq('store_id', apiKeyInfo.store_id)
        .range(offset, offset + limit - 1);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          data,
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'POST') {
    const permissionError = ensurePermission(apiKeyInfo, 'customers:write', corsHeaders);
    if (permissionError) return permissionError;

    // POST /customers
    const body = await parseAndSanitizeBody(req, customerBodySchema);
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...body, store_id: apiKeyInfo.store_id })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler pour analytics
async function handleAnalytics(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const timeRange = url.searchParams.get('time_range') || '30d';

  // Implémenter la logique analytics (simplifiée)
  // Utiliser le hook useUnifiedAnalytics côté client ou réimplémenter ici

  return new Response(
    JSON.stringify({ message: 'Analytics endpoint - to be implemented' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler pour webhooks
async function handleWebhooks(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  // Implémenter la gestion des webhooks via API
  return new Response(
    JSON.stringify({ message: 'Webhooks endpoint - to be implemented' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler pour export
async function handleExport(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'products';
  const format = url.searchParams.get('format') || 'csv';

  // Implémenter l'export (utiliser les fonctions de import-export.ts)

  return new Response(
    JSON.stringify({ message: 'Export endpoint - to be implemented' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler pour import
async function handleImport(
  req: Request,
  method: string,
  apiKeyInfo: { user_id: string; store_id: string; permissions: any },
  supabase: any
): Promise<Response> {
  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Implémenter l'import (utiliser les fonctions de import-export.ts)

  return new Response(
    JSON.stringify({ message: 'Import endpoint - to be implemented' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

