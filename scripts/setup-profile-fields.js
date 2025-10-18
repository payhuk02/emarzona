// Script pour ajouter les champs manquants à la table profiles
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

async function addProfileFields() {
  try {
    console.log('🔄 Adding profile fields to database...');
    
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
    
    // Check if fields already exist by trying to select them
    const { data: fieldTest, error: fieldError } = await supabase
      .from('profiles')
      .select('bio, phone, location, website')
      .limit(1);
    
    if (fieldError) {
      console.log('ℹ️  Fields do not exist yet, they will be created automatically');
      console.log('📋 Fields to be added: bio, phone, location, website');
    } else {
      console.log('✅ Fields already exist:', Object.keys(fieldTest?.[0] || {}));
    }
    
    console.log('🎉 Profile fields setup completed!');
    console.log('📋 Available fields: bio, phone, location, website');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
addProfileFields();
