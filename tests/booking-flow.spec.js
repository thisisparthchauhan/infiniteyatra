import { test, expect } from '@playwright/test';

test.describe('End-to-End Booking Flow', () => {
  test('should complete full booking with upload and payment', async ({ page }) => {
    // Navigate to home page where packages are displayed
    await page.goto('/');

    // Wait for packages to load
    await page.waitForSelector('.group.cursor-pointer', { timeout: 10000 });

    // Click on the first package card
    await page.locator('.group.cursor-pointer').first().click();

    // Wait for package detail page to load
    await page.waitForURL(/\/package\/\d+/);

    // Look for book now button (might be different selector)
    const bookButton = page.locator('button, a').filter({ hasText: /book|Book|BOOK/ }).first();
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // Wait for booking page to load
    await page.waitForURL(/\/booking\/\d+/);

    // Fill booking details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+91-9876543210');

    // Add travelers
    await page.click('button.add-traveler');
    await page.fill('input[name="traveler[0].firstName"]', 'Jane');
    await page.fill('input[name="traveler[0].lastName"]', 'Doe');
    await page.selectOption('select[name="traveler[0].nationality"]', 'India');
    await page.selectOption('select[name="traveler[0].docType"]', 'aadhaar');

    // Upload documents
    const docInput = page.locator('input[type="file"]').first();
    await docInput.setInputFiles('./test-assets/sample-aadhaar.jpg');

    // Proceed to payment
    await page.click('button.next-step');
    await page.click('button.proceed-payment');

    // Mock payment (assuming Razorpay or similar)
    // This would need to be adjusted based on actual payment integration
    await page.waitForSelector('.payment-modal');
    await page.click('.mock-payment-success');

    // Verify booking confirmation
    await page.waitForURL('/booking/confirmation/**');
    await expect(page.locator('.booking-success')).toBeVisible();
    await expect(page.locator('.booking-id')).toBeVisible();
  });
});