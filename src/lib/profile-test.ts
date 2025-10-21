import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing');
  console.log('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testProfileConnection() {
  try {
    console.log('🔄 Testing profile connection...');
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return false;
    }
    
    if (!user) {
      console.log('ℹ️  No authenticated user');
      return false;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test profile table access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return false;
    }
    
    if (profile) {
      console.log('✅ Profile found:', profile);
    } else {
      console.log('ℹ️  No profile found, will create one');
      
      // Try to create a profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            display_name: user.email,
            first_name: null,
            last_name: null,
            bio: null,
            phone: null,
            location: null,
            website: null,
          },
        ])
        .select()
        .limit(1);
      
      if (createError) {
        console.error('❌ Create profile error:', createError.message);
        return false;
      }
      
      console.log('✅ Profile created:', newProfile);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Auto-run test if this is imported
if (typeof window !== 'undefined') {
  testProfileConnection();
}
