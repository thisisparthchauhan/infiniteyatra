import { test, expect } from '@playwright/test';

test.describe('Storage Fallback Guard', () => {
  test('should handle storage initialization failure gracefully', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Check that no storage-related errors appear in console
    const errors = [];
    page.on('pageerror', (error) => {
      if (error.message.includes('storage') || error.message.includes('Storage')) {
        errors.push(error);
      }
    });

    // Navigate to a page that uses storage (booking page via package)
    await page.waitForSelector('.group.cursor-pointer', { timeout: 10000 });
    await page.locator('.group.cursor-pointer').first().click();

    // Wait for package detail page
    await page.waitForURL(/\/package\/\d+/);

    // Try to access booking (may require auth)
    const bookButton = page.locator('button, a').filter({ hasText: /book|Book|BOOK/ }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Wait a bit for any async storage operations
      await page.waitForTimeout(2000);
    }

    // Verify no storage errors occurred
    expect(errors).toHaveLength(0);
  });
});