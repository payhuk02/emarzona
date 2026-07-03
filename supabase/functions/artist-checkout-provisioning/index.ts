import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const checkoutToken = req.headers.get('x-checkout-token');
    const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token && !checkoutToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing valid token or secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (token !== internalSecret && !checkoutToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, customerName, userId: existingUserId = null } = await req.json();

    if (!email && !existingUserId) {
      return new Response(
        JSON.stringify({ error: 'Email requis pour le provisionnement invité.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si on a déjà un utilisateur, rien à faire
    if (existingUserId) {
      return new Response(
        JSON.stringify({ success: true, user_id: existingUserId, is_new_user: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // On utilise la Service Role Key pour contourner le RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const randomPassword = crypto.randomUUID();
    const { data: userResponse, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true, // On confirme l'email pour éviter le flow par défaut
        user_metadata: { full_name: customerName || email.split('@')[0] },
      });

    if (createUserError) {
      // L'utilisateur existe peut-être déjà
      if (
        createUserError.message.toLowerCase().includes('already registered') ||
        createUserError.message.toLowerCase().includes('already exists')
      ) {
        return new Response(
          JSON.stringify({
            error: 'Un compte existe déjà avec cet email.',
            code: 'USER_ALREADY_EXISTS',
            message: 'Veuillez vous connecter pour finaliser cet achat.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw createUserError;
    }

    if (!userResponse.user?.id) {
      throw new Error("Impossible de créer l'utilisateur invité.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userResponse.user.id,
        is_new_user: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Artist checkout provisioning error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
