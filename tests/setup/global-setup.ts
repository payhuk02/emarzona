import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup
 * Runs once before all tests
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for dev server to be ready
    console.log(`⏳ Waiting for ${baseURL} to be ready...`);
    await page.goto(baseURL || 'http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    console.log('✅ Dev server is ready!');
    
    // You can perform additional setup here:
    // - Create test users
    // - Seed test data
    // - Setup test database
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed!');
}

export default globalSetup;

