/**
 * API Publique Emarzona - Edge Function
 * Date: 28 Janvier 2025
 * 
 * Point d'entrée principal de l'API publique
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
        .select('*')
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
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
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
    // POST /products
    const body = await req.json();
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
    // PUT /products/:id
    const body = await req.json();
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
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const status = url.searchParams.get('status');

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
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
    // POST /orders
    const body = await req.json();
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...body, store_id: apiKeyData.store_id })
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
        .select('*')
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
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
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
    // POST /customers
    const body = await req.json();
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...body, store_id: apiKeyData.store_id })
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

