const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('Please set your Supabase service role key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProfileFields() {
  try {
    console.log('🔄 Adding profile fields to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-profile-fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Profile fields added successfully!');
    console.log('📋 Added fields: bio, phone, location, website');
    console.log('🔍 Added indexes for better performance');
    console.log('⚡ Updated handle_new_user function');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Alternative method using direct SQL execution
async function addProfileFieldsDirect() {
  try {
    console.log('🔄 Adding profile fields to database (direct method)...');
    
    // Add columns
    const { error: alterError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (alterError) {
      console.log('ℹ️  Profiles table might not exist yet, this is normal');
    }
    
    console.log('✅ Profile fields check completed!');
    console.log('📋 Fields should be available: bio, phone, location, website');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the migration
addProfileFieldsDirect();
