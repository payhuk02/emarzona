/**
 * Cron : clôture des enchères expirées + emails au gagnant (templates DB)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const defaultAllowedOrigin = SITE_URL;
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin':
      originHeader && allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin,
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface AuctionRow {
  id: string;
  auction_title: string;
  auction_slug: string;
  current_bid: number;
  store_id: string;
  winner_checkout_order_id: string | null;
  winner_payment_deadline: string | null;
  winning_bid_id: string | null;
}

function formatBidAmount(amount: number): string {
  return amount.toLocaleString('fr-FR');
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'sous 72 heures';
  try {
    return new Date(deadline).toLocaleString('fr-FR');
  } catch {
    return deadline;
  }
}

async function notifyAuctionWinner(
  supabase: ReturnType<typeof createClient>,
  auction: AuctionRow,
  bidderId: string,
  internalSecret: string
): Promise<{ sent: boolean; error?: string }> {
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(bidderId);
  if (userError || !userData.user?.email) {
    return { sent: false, error: userError?.message || 'Winner email not found' };
  }

  const meta = userData.user.user_metadata as Record<string, unknown> | undefined;
  const recipientName =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    userData.user.email.split('@')[0];

  const payUrl = `${SITE_URL.replace(/\/$/, '')}/auctions/${auction.auction_slug}`;
  const bidFormatted = formatBidAmount(Number(auction.current_bid));
  const deadlineText = formatDeadline(auction.winner_payment_deadline);

  const sendHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (internalSecret) sendHeaders['x-internal-secret'] = internalSecret;

  const { data: sendResult, error: sendError } = await supabase.functions.invoke(
    'send-notification-email',
    {
      body: {
        user_id: bidderId,
        type: 'auction_won',
        title: `Vous avez gagné l'enchère « ${auction.auction_title} »`,
        message: `Merci de régler ${bidFormatted} XOF avant le ${deadlineText} pour confirmer votre acquisition.`,
        action_url: payUrl,
        action_label: "Payer et finaliser l'achat",
        store_id: auction.store_id,
        recipient_email: userData.user.email,
        recipient_name: recipientName,
        language: 'fr',
        metadata: {
          auction_title: auction.auction_title,
          auction_slug: auction.auction_slug,
          current_bid: bidFormatted,
          winner_payment_deadline: deadlineText,
          store_id: auction.store_id,
        },
      },
      headers: sendHeaders,
    }
  );

  if (sendError) {
    return { sent: false, error: sendError.message };
  }

  const result = sendResult as { success?: boolean; error?: string } | null;
  if (result?.success === false) {
    return { sent: false, error: result.error || 'send-notification-email failed' };
  }

  await supabase
    .from('artist_product_auctions')
    .update({ winner_notified_at: new Date().toISOString() })
    .eq('id', auction.id);

  return { sent: true };
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cronSecret = req.headers.get('x-cron-secret');
    const internalSecret = req.headers.get('x-internal-secret') || '';
    const expectedCron = Deno.env.get('CRON_SECRET');
    const expectedInternal = Deno.env.get('EDGE_INTERNAL_SECRET') || '';

    const cronOk = !!expectedCron && cronSecret?.trim() === expectedCron.trim();
    const internalOk = !!expectedInternal && internalSecret.trim() === expectedInternal.trim();

    if (!cronOk && !internalOk) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: statusError } = await supabase.rpc('update_auction_statuses');
    if (statusError) {
      console.error('update_auction_statuses:', statusError);
    }

    const { data: pendingNotify, error: fetchError } = await supabase
      .from('artist_product_auctions')
      .select(
        'id, auction_title, auction_slug, current_bid, store_id, winner_checkout_order_id, winner_payment_deadline, winning_bid_id'
      )
      .eq('status', 'sold')
      .is('winner_notified_at', null)
      .not('winning_bid_id', 'is', null)
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    const emailResults: Array<{ auction_id: string; sent: boolean; error?: string }> = [];

    for (const auction of (pendingNotify || []) as AuctionRow[]) {
      let bidderId: string | null = null;

      if (auction.winning_bid_id) {
        const { data: bid } = await supabase
          .from('auction_bids')
          .select('bidder_id')
          .eq('id', auction.winning_bid_id)
          .single();
        bidderId = bid?.bidder_id ?? null;
      }

      if (!bidderId) continue;

      if (!auction.winner_checkout_order_id) {
        await supabase.rpc('create_auction_winner_order', { p_auction_id: auction.id });
      }

      const result = await notifyAuctionWinner(supabase, auction, bidderId, expectedInternal);
      emailResults.push({ auction_id: auction.id, ...result });
    }

    return new Response(
      JSON.stringify({
        success: true,
        statuses_updated: !statusError,
        notifications_attempted: emailResults.length,
        notifications_sent: emailResults.filter(r => r.sent).length,
        details: emailResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('process-auction-statuses:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
