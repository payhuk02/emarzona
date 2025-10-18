// Script pour appliquer la migration des champs de profil via l'API Supabase
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

async function applyProfileMigration() {
  try {
    console.log('🔄 Applying profile fields migration...');
    
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
    
    // Try to select the new fields to see if they exist
    const { data: fieldTest, error: fieldError } = await supabase
      .from('profiles')
      .select('bio, phone, location, website')
      .limit(1);
    
    if (fieldError) {
      console.log('❌ Fields do not exist yet:', fieldError.message);
      console.log('📋 Need to add fields: bio, phone, location, website');
      
      // Since we can't execute DDL via the client, we'll provide instructions
      console.log('\n🔧 Manual steps required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:');
      console.log(`
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;
      `);
      console.log('\n4. After running the SQL, the profile page should work correctly');
      
    } else {
      console.log('✅ All fields already exist!');
      console.log('📋 Available fields:', Object.keys(fieldTest?.[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the migration check
applyProfileMigration();
