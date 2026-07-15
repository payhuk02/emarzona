import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('MISSING ENV VARS');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Starting test...');
  const { data: users, error: errList } = await supabase.auth.admin.listUsers();
  if (errList) console.log('List error:', errList);
  
  if (users?.users && users.users.length > 0) {
    const testEmail = users.users[0].email;
    const authId = users.users[0].id;
    console.log(`Testing with email ${testEmail} (auth.uid: ${authId})`);
    
    const { data: idResult, error: idErr } = await supabase.rpc('get_user_id_by_email', {
      email_address: testEmail
    });
    console.log('RPC get_user_id_by_email Result:', idResult, idErr);
    
    // Also let's check what ID is in profiles for this user
    const { data: profile } = await supabase.from('profiles').select('id, user_id').eq('email', testEmail).single();
    console.log('Profile:', profile);
    
    if (idResult === profile?.id && idResult !== profile?.user_id) {
      console.log('BUG DETECTED: get_user_id_by_email returns profiles.id instead of auth.users.id (user_id)!');
    }
  } else {
    console.log('No users found.');
  }
}

test().catch(console.error);
