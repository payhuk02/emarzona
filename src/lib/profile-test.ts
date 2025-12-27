import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  logger.error('❌ Supabase configuration missing');
  logger.info(
    'Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabasePublishableKey);

export async function testProfileConnection() {
  try {
    logger.info('🔄 Testing profile connection...');

    // Test basic connection
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logger.error('❌ Auth error', { error: authError.message });
      return false;
    }

    if (!user) {
      logger.info('ℹ️  No authenticated user');
      return false;
    }

    logger.info('✅ User authenticated', { email: user.email });

    // Test profile table access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('❌ Profile error', { error: profileError.message });
      return false;
    }

    if (profile) {
      logger.info('✅ Profile found', { profile });
    } else {
      logger.info('ℹ️  No profile found, will create one');

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
        logger.error('❌ Create profile error', { error: createError.message });
        return false;
      }

      logger.info('✅ Profile created', { profile: newProfile });
    }

    return true;
  } catch (error) {
    logger.error('❌ Test error', { error });
    return false;
  }
}

// Auto-run test if this is imported
if (typeof window !== 'undefined') {
  // Ne jamais auto-exécuter en production: éviter effets de bord (network + écritures DB).
  // Activer uniquement en debug local via flag.
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PROFILE_TEST === 'true') {
    testProfileConnection();
  }
}






