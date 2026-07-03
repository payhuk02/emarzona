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

    const {
      email,
      customerName,
      productId,
      staffId = null,
      bookingDate,
      bookingStartTime,
      bookingEndTime,
      durationMinutes,
      timezone = 'UTC',
      numberOfParticipants = 1,
      notes = null,
      userId: existingUserId = null,
    } = await req.json();

    if (!productId || !bookingDate || !bookingStartTime || !bookingEndTime) {
      return new Response(JSON.stringify({ error: 'Paramètres de réservation manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ⚠️ On utilise la Service Role Key pour contourner le RLS
    // Car l'utilisateur invité n'est pas encore connecté/créé, ou on veut appeler le RPC protégé
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let userId = existingUserId;

    // 1. Auto-provisioning : Création du compte utilisateur silencieuse (si Guest)
    if (!userId) {
      if (!email) {
        throw new Error("L'email est requis pour un achat invité.");
      }

      const randomPassword = crypto.randomUUID();
      const { data: userResponse, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: randomPassword,
          email_confirm: true, // On confirme l'email pour éviter l'envoi de l'email de signup par défaut
          user_metadata: { full_name: customerName || email.split('@')[0] },
        });

      if (createUserError) {
        // Si l'utilisateur existe déjà, l'API retourne souvent un message spécifique
        if (
          createUserError.message.toLowerCase().includes('already registered') ||
          createUserError.message.toLowerCase().includes('already exists')
        ) {
          return new Response(
            JSON.stringify({
              error: 'Un compte existe déjà avec cet email.',
              code: 'USER_ALREADY_EXISTS',
              message: 'Veuillez vous connecter pour réserver ce service.',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw createUserError;
      }

      if (!userResponse.user?.id) {
        throw new Error("Impossible de créer l'utilisateur invité.");
      }

      userId = userResponse.user.id;
    }

    // 2. Réservation Atomique (Pessimistic Locking)
    // On appelle la fonction RPC qui utilise pg_advisory_xact_lock
    const { data: bookingResult, error: bookingError } = await supabaseAdmin.rpc(
      'reserve_service_booking',
      {
        p_product_id: productId,
        p_user_id: userId,
        p_staff_member_id: staffId,
        p_scheduled_date: bookingDate,
        p_scheduled_start_time: bookingStartTime,
        p_scheduled_end_time: bookingEndTime,
        p_timezone: timezone,
        p_duration_minutes: durationMinutes,
        p_participants_count: numberOfParticipants,
        p_customer_notes: notes,
      }
    );

    if (bookingError) {
      console.error('Service booking RPC error:', bookingError);
      throw new Error('Erreur système lors de la réservation');
    }

    // La RPC retourne un tableau (booking_id, error_message)
    const result = bookingResult?.[0];

    if (!result) {
      throw new Error('Erreur inattendue lors de la réservation.');
    }

    if (result.error_message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error_message,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bookingId = result.booking_id;

    if (!bookingId) {
      throw new Error("Impossible de récupérer l'ID de la réservation.");
    }

    // 3. Succès: On retourne l'ID de la réservation et l'ID de l'utilisateur
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        booking_id: bookingId,
        is_new_user: !existingUserId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Service checkout provisioning error:', error);
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
