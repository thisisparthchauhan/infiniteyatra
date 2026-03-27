import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('should serve homepage HTML', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Wait for any content to load
    await page.waitForTimeout(5000);

    // Just check that we have some HTML content
    const content = await page.content();
    expect(content).toContain('<html');
    expect(content).toContain('Infinite Yatra');
  });

  test('should handle admin route', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(200);

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check that page loads
    const content = await page.content();
    expect(content).toContain('<html');
  });

  test('should handle package route', async ({ page }) => {
    const response = await page.goto('/package/1');
    expect(response?.status()).toBe(200);

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check that page loads
    const content = await page.content();
    expect(content).toContain('<html');
  });

  test('should handle booking route', async ({ page }) => {
    const response = await page.goto('/booking/1');
    expect(response?.status()).toBe(200);

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check that page loads
    const content = await page.content();
    expect(content).toContain('<html');
  });
});