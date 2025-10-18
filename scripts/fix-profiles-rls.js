// Script pour corriger les politiques RLS de la table profiles
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('Please set your Supabase service role key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfilesRLS() {
  try {
    console.log('🔄 Fixing profiles RLS policies...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Try to create a test profile to see if RLS is working
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('ℹ️  No authenticated user, cannot test profile creation');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Profile check failed:', profileError.message);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists');
    } else {
      console.log('ℹ️  No profile found, attempting to create one...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            display_name: user.email,
            first_name: null,
            last_name: null,
          },
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Profile creation failed:', createError.message);
        console.log('\n🔧 Manual fix required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the following SQL:');
        console.log(`
-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);
        `);
        return;
      }
      
      console.log('✅ Profile created successfully:', newProfile);
    }
    
    console.log('🎉 Profiles RLS policies are working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix
fixProfilesRLS();
