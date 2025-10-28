#!/usr/bin/env node

/**
 * Script pour insérer les données de test PayBalance
 * Usage: node scripts/fix-paybalance-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CUSTOMER_ID = '33333333-3333-3333-3333-333333333333';
const ORDER_ID = '44444444-4444-4444-4444-444444444444';
const STORE_ID = '55555555-5555-5555-5555-555555555555';
const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';

async function fixPayBalanceData() {
  console.log('🔧 Insertion des données de test PayBalance...\n');

  try {
    // 1. Upsert Customer
    console.log('👤 Création customer...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        id: CUSTOMER_ID,
        name: 'Jean Test',
        email: 'jean.test@example.com',
        phone: '+22612345678',
      })
      .select()
      .single();

    if (customerError) {
      console.error('❌ Erreur customer:', customerError.message);
      throw customerError;
    }
    console.log('✅ Customer créé:', customer.name);

    // 2. Upsert Order
    console.log('\n📦 Création order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: ORDER_ID,
        customer_id: CUSTOMER_ID,
        store_id: STORE_ID,
        order_number: 'ORD-2025-001',
        total_amount: 100000,
        percentage_paid: 30000,
        remaining_amount: 70000,
        status: 'pending',
        payment_status: 'partial',
        currency: 'XOF',
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Erreur order:', orderError.message);
      throw orderError;
    }
    console.log('✅ Order créée:', order.order_number);

    // 3. Insert Order Item (si n'existe pas)
    console.log('\n🛍️  Création order item...');
    const { data: existingItem } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', ORDER_ID)
      .eq('product_id', PRODUCT_ID)
      .single();

    if (!existingItem) {
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: ORDER_ID,
          product_id: PRODUCT_ID,
          product_name: 'T-Shirt Premium Payhuk',
          quantity: 2,
          unit_price: 50000,
          total_price: 100000,
        })
        .select()
        .single();

      if (itemError) {
        console.error('❌ Erreur order item:', itemError.message);
        throw itemError;
      }
      console.log('✅ Order item créé:', orderItem.product_name);
    } else {
      console.log('⏭️  Order item existe déjà');
    }

    // 4. Vérification finale
    console.log('\n📊 Vérification...');
    const { data: finalOrder } = await supabase
      .from('orders')
      .select(`
        *,
        customers (name, email, phone),
        order_items (product_name, quantity, total_price)
      `)
      .eq('id', ORDER_ID)
      .single();

    console.log('\n✅ DONNÉES CRÉÉES AVEC SUCCÈS!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Order:', finalOrder.order_number);
    console.log('Total:', finalOrder.total_amount, 'XOF');
    console.log('Acompte payé:', finalOrder.percentage_paid, 'XOF (30%)');
    console.log('Solde restant:', finalOrder.remaining_amount, 'XOF');
    console.log('Status:', finalOrder.status);
    console.log('Payment Status:', finalOrder.payment_status);
    console.log('Customer:', finalOrder.customers.name);
    console.log('Items:', finalOrder.order_items.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🧪 Testez maintenant:');
    console.log(`http://localhost:8080/payments/${ORDER_ID}/balance\n`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  }
}

fixPayBalanceData();

