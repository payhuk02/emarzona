import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing get_user_id_by_email...');

  // We can fetch the definition of get_user_id_by_email from pg_proc
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `SELECT pg_get_functiondef(p.oid) 
          FROM pg_proc p 
          JOIN pg_namespace n ON n.oid = p.pronamespace 
          WHERE p.proname = 'get_user_id_by_email';`,
  });

  if (error) {
    console.error('Error fetching function def via RPC (maybe exec_sql doesnt exist):', error);
  } else {
    console.log('Function definition:', data);
  }

  // Let's directly test it with an email
  // First, get an email from auth.users
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (users?.users.length > 0) {
    const testEmail = users.users[0].email;
    const testId = users.users[0].id;
    console.log(`Testing with email ${testEmail} (expected ID: ${testId})`);

    const { data: idResult, error: idErr } = await supabase.rpc('get_user_id_by_email', {
      email_address: testEmail,
    });
    console.log('RPC Result:', idResult, 'Error:', idErr);
  } else {
    console.log('No users found to test');
  }
}

test();
