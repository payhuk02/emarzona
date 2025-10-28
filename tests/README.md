# 🧪 Payhula E2E Tests

This directory contains comprehensive End-to-End (E2E) tests for the Payhula SaaS platform using Playwright.

## 📁 Test Structure

```
tests/
├── auth/                          # Authentication tests
│   └── authentication.spec.ts
├── products/                      # Product creation tests
│   ├── digital-products.spec.ts
│   ├── physical-products.spec.ts
│   ├── service-products.spec.ts
│   └── online-courses.spec.ts
├── e2e/                          # Full E2E flows
│   ├── purchase-flow.spec.ts
│   ├── shipping-tracking.spec.ts
│   └── messaging-payments.spec.ts
└── fixtures/                     # Test fixtures
    └── auth.fixture.ts
```

## 🚀 Running Tests

### Install Dependencies

```bash
npm install
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test Suites

```bash
# Authentication tests only
npm run test:e2e:auth

# Product tests only
npm run test:e2e:products

# Full marketplace flow
npm run test:e2e:marketplace

# Cart and checkout
npm run test:e2e:cart
```

### Run Tests in Different Browsers

```bash
# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Debug Tests

```bash
npx playwright test --debug
```

## 📊 Test Coverage

### Authentication Tests ✅
- Landing page display
- Navigation to auth page
- Form validation
- Invalid credentials
- Successful login
- Logout functionality
- Session persistence
- Protected route redirection

### Digital Products Tests ✅
- Product creation wizard (6 steps)
- Field validation
- File upload
- License configuration
- SEO settings
- Product listing
- Product details view

### Physical Products Tests ✅
- Product creation with inventory
- Stock management
- Inventory dashboard
- Low stock filtering
- Stock quantity updates
- Product variants

### Service Products Tests ✅
- Service creation wizard
- Booking calendar
- Service booking flow
- Bookings list
- Booking cancellation

### Online Courses Tests ✅
- Course creation
- Course enrollment
- Course lessons viewing
- Progress tracking
- Quiz completion
- Certificate download

### Purchase Flow Tests ✅
- Complete digital product purchase
- Percentage payment
- Escrow payment
- Multi-item cart
- Order history
- Order details
- Invoice download

### Shipping & Tracking Tests ✅
- Shipping rate calculation
- Shipping method selection
- Label creation
- Shipment tracking
- Tracking timeline
- Label PDF download
- Delivery status updates

### Messaging & Payments Tests ✅
- Order messaging
- Media upload in chat
- Payment management
- Escrow release
- Dispute opening
- Dispute responses
- Second payment installment

## 🔧 Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:8080`
- **Test Timeout**: 30s per test
- **Retries on CI**: 2
- **Screenshots**: On failure
- **Videos**: On failure
- **Trace**: On first retry

## 📝 Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - login, navigate, etc.
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for navigation** with `page.waitForURL()`
3. **Check visibility** before interacting with elements
4. **Use meaningful test names** that describe what is being tested
5. **Keep tests isolated** - each test should be independent
6. **Clean up after tests** - reset state when needed

## 🎯 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

GitHub Actions workflow: `.github/workflows/playwright.yml`

## 📈 Test Reports

After running tests:

```bash
# View HTML report
npx playwright show-report
```

Reports are also generated in CI and available as artifacts.

## 🐛 Troubleshooting

### Tests timing out?
Increase timeout in `playwright.config.ts` or individual tests:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
});
```

### Elements not found?
Add explicit waits:

```typescript
await page.waitForSelector('[data-testid="element"]');
```

### Network issues?
Check if dev server is running:

```bash
npm run dev
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

## 🤝 Contributing

When adding new features:
1. Write E2E tests for the new functionality
2. Ensure all tests pass locally
3. Add test descriptions to this README
4. Update test coverage section

---

**Total Tests**: 50+  
**Coverage**: Authentication, Products (4 types), Purchase Flows, Shipping, Messaging, Payments  
**Last Updated**: October 2025

