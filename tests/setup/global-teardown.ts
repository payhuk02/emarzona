import { FullConfig } from '@playwright/test';

/**
 * Global Teardown
 * Runs once after all tests
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...');
  
  try {
    // Cleanup tasks:
    // - Remove test data
    // - Clean up test files
    // - Reset test database
    
    console.log('✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Don't throw - we don't want to fail the build on cleanup errors
  }
  
  console.log('✅ Global teardown completed!');
}

export default globalTeardown;

