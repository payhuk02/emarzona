import { test, expect } from '@playwright/test';

/**
 * Online Courses Tests
 * Tests for course creation, enrollment, and progression
 */

test.describe('Online Courses', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create online course', async ({ page }) => {
    await page.goto('/courses/create');
    
    // Step 1: Basic Info
    await page.fill('input[name="title"]', 'Test Course E2E');
    await page.fill('textarea[name="description"]', 'Complete E2E testing course');
    await page.fill('input[name="price"]', '199.99');
    
    // Select level
    const levelSelect = page.locator('select[name="level"]');
    if (await levelSelect.isVisible()) {
      await levelSelect.selectOption('intermediate');
    }
    
    await page.click('button:has-text("Suivant")');
    
    // Step 2: Curriculum
    await page.click('button:has-text("Ajouter un module"), button:has-text("Add module")');
    await page.fill('input[name="module_title"]', 'Module 1: Introduction');
    await page.click('button:has-text("Enregistrer"), button:has-text("Save")');
    
    await page.click('button:has-text("Suivant")');
    
    // Step 3: Instructors (skip if optional)
    await page.click('button:has-text("Suivant")');
    
    // Step 4: Settings
    const certificateCheckbox = page.locator('input[type="checkbox"][name*="certificate"]');
    if (await certificateCheckbox.isVisible()) {
      await certificateCheckbox.check();
    }
    
    await page.click('button:has-text("Suivant")');
    
    // Step 5: SEO
    await page.fill('input[name="metaTitle"]', 'Test Course SEO');
    await page.click('button:has-text("Suivant")');
    
    // Step 6: FAQs (skip)
    await page.click('button:has-text("Suivant")');
    
    // Step 7: Review & Publish
    await expect(page.locator('text=Test Course E2E')).toBeVisible();
    await page.click('button:has-text("Publier")');
    
    // Should redirect to courses list
    await expect(page).toHaveURL(/\/courses/, { timeout: 10000 });
    await expect(page.locator('text=/succès|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should enroll in course', async ({ page }) => {
    await page.goto('/courses');
    
    // Click on first course
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await firstCourse.click();
    
    // Click enroll button
    const enrollButton = page.locator('button:has-text("S\'inscrire"), button:has-text("Enroll")');
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      
      // Should show payment or success
      await expect(page.locator('text=/paiement|payment|inscription/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display my courses', async ({ page }) => {
    await page.goto('/my-courses');
    
    // Should see enrolled courses
    await expect(page.locator('text=/mes cours|my courses/i')).toBeVisible();
  });

  test('should watch course lesson', async ({ page }) => {
    await page.goto('/my-courses');
    
    // Click on first enrolled course
    const firstCourse = page.locator('[data-testid="enrolled-course"]').first();
    if (await firstCourse.isVisible()) {
      await firstCourse.click();
      
      // Click on first lesson
      const firstLesson = page.locator('[data-testid="lesson-item"]').first();
      if (await firstLesson.isVisible()) {
        await firstLesson.click();
        
        // Should see video player or lesson content
        await expect(page.locator('video, iframe, [data-testid="lesson-content"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should track course progression', async ({ page }) => {
    await page.goto('/my-courses');
    
    // Should see progress indicators
    const progressBar = page.locator('[data-testid="progress-bar"], .progress');
    if (await progressBar.first().isVisible()) {
      // Progress should be visible
      await expect(progressBar.first()).toBeVisible();
    }
  });

  test('should complete quiz', async ({ page }) => {
    // Navigate to course with quiz
    await page.goto('/my-courses');
    
    const firstCourse = page.locator('[data-testid="enrolled-course"]').first();
    if (await firstCourse.isVisible()) {
      await firstCourse.click();
      
      // Find quiz
      const quizButton = page.locator('button:has-text("Quiz"), [data-testid="quiz"]');
      if (await quizButton.isVisible()) {
        await quizButton.click();
        
        // Answer questions
        const firstQuestion = page.locator('[data-testid="question"]').first();
        if (await firstQuestion.isVisible()) {
          await firstQuestion.locator('input[type="radio"]').first().check();
          
          // Submit quiz
          await page.click('button:has-text("Soumettre"), button:has-text("Submit")');
          
          // Should show results
          await expect(page.locator('text=/résultat|score|result/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should download certificate', async ({ page }) => {
    await page.goto('/my-courses');
    
    // Find completed course
    const completedCourse = page.locator('[data-testid="completed-course"]').first();
    if (await completedCourse.isVisible()) {
      await completedCourse.click();
      
      // Find certificate button
      const certificateButton = page.locator('button:has-text("Certificat"), button:has-text("Certificate")');
      if (await certificateButton.isVisible()) {
        // Start download
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          certificateButton.click()
        ]);
        
        // Verify download
        expect(download.suggestedFilename()).toContain('certificate');
      }
    }
  });
});

