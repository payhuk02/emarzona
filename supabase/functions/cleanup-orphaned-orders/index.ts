/**
 * Edge Function: Nettoyage des commandes orphelines multi-stores
 * Date: 2025-01-31
 * Description: Nettoie automatiquement les commandes multi-stores orphelines
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le seuil d'heures depuis les paramètres (défaut: 24 heures)
    const url = new URL(req.url);
    const hoursThreshold = parseInt(url.searchParams.get('hours') || '24', 10);

    if (hoursThreshold < 1 || hoursThreshold > 168) {
      return new Response(
        JSON.stringify({ error: 'Invalid hours threshold. Must be between 1 and 168 (7 days)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting cleanup of orphaned multi-store orders (threshold: ${hoursThreshold} hours)...`);

    // 1. Nettoyer les commandes orphelines générales
    const { data: cleanupResult, error: cleanupError } = await supabase.rpc(
      'cleanup_orphaned_multi_store_orders',
      { p_hours_threshold: hoursThreshold }
    );

    if (cleanupError) {
      console.error('Error cleaning up orphaned orders:', cleanupError);
      throw cleanupError;
    }

    const cleanedOrders = cleanupResult?.[0]?.cleaned_orders_count || 0;
    const cleanedOrderItems = cleanupResult?.[0]?.cleaned_order_items_count || 0;
    const cleanedTransactions = cleanupResult?.[0]?.cleaned_transactions_count || 0;

    console.log(`Cleaned ${cleanedOrders} orphaned orders, ${cleanedOrderItems} order items, ${cleanedTransactions} transactions`);

    // 2. Vérifier et nettoyer les groupes incomplets
    const { data: incompleteGroupsResult, error: incompleteGroupsError } = await supabase.rpc(
      'check_and_cleanup_incomplete_groups'
    );

    if (incompleteGroupsError) {
      console.error('Error cleaning up incomplete groups:', incompleteGroupsError);
      // Ne pas throw, continuer
    }

    const cleanedGroups = incompleteGroupsResult?.[0]?.cleaned_groups_count || 0;
    const totalCleanedFromGroups = incompleteGroupsResult?.[0]?.total_cleaned_orders || 0;

    console.log(`Cleaned ${cleanedGroups} incomplete groups (${totalCleanedFromGroups} orders)`);

    const totalCleaned = cleanedOrders + totalCleanedFromGroups;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          orphaned_orders_cleaned: cleanedOrders,
          order_items_cleaned: cleanedOrderItems,
          transactions_cleaned: cleanedTransactions,
          incomplete_groups_cleaned: cleanedGroups,
          total_orders_cleaned: totalCleaned,
        },
        threshold_hours: hoursThreshold,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup-orphaned-orders:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});







