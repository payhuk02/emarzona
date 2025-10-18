// Script de test complet pour le système de profil
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

async function testCompleteProfileSystem() {
  try {
    console.log('🔄 Testing complete profile system...');
    
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('ℹ️  No authenticated user, cannot test profile operations');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test 2: Check if profiles table exists and has correct structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Profiles table error:', tableError.message);
      return;
    }
    
    console.log('✅ Profiles table accessible');
    
    // Test 3: Check if profile exists for current user
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Profile check error:', profileError.message);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ Profile exists:', {
        id: existingProfile.id,
        display_name: existingProfile.display_name,
        first_name: existingProfile.first_name,
        last_name: existingProfile.last_name,
        bio: existingProfile.bio,
        phone: existingProfile.phone,
        location: existingProfile.location,
        website: existingProfile.website,
        created_at: existingProfile.created_at
      });
    } else {
      console.log('ℹ️  No profile found, attempting to create one...');
      
      // Test 4: Try to create a profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            display_name: user.email,
            first_name: 'Test',
            last_name: 'User',
            bio: 'Test bio',
            phone: '+1234567890',
            location: 'Test Location',
            website: 'https://example.com'
          },
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Profile creation failed:', createError.message);
        return;
      }
      
      console.log('✅ Profile created successfully:', newProfile);
    }
    
    // Test 5: Test profile update
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        display_name: 'Updated Name',
        bio: 'Updated bio',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message);
      return;
    }
    
    console.log('✅ Profile updated successfully');
    
    // Test 6: Check if storage bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage bucket error:', bucketError.message);
      return;
    }
    
    const avatarsBucket = buckets.find(bucket => bucket.id === 'avatars');
    if (avatarsBucket) {
      console.log('✅ Avatars storage bucket exists');
    } else {
      console.log('⚠️  Avatars storage bucket not found');
    }
    
    // Test 7: Check if user_roles table exists
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (rolesError) {
      console.error('❌ User roles error:', rolesError.message);
      return;
    }
    
    if (roles) {
      console.log('✅ User role found:', roles.role);
    } else {
      console.log('ℹ️  No user role found, creating default role...');
      
      const { data: newRole, error: roleCreateError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: user.id,
            role: 'user'
          }
        ])
        .select()
        .single();
      
      if (roleCreateError) {
        console.error('❌ Role creation failed:', roleCreateError.message);
        return;
      }
      
      console.log('✅ User role created:', newRole.role);
    }
    
    console.log('\n🎉 All profile system tests passed!');
    console.log('📋 Profile system is fully functional');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the complete test
testCompleteProfileSystem();
