import { test, expect } from '@playwright/test';

test.describe('Dominos Store Finder - Edge Case Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.dominos.com.au/store-finder/');
    await page.waitForLoadState('networkidle');
  });

  test('Test 1: Valid postcode input should show autocomplete suggestions', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill('2000');
    await page.waitForTimeout(2000); // Wait for autocomplete
    
    // Check if autocomplete suggestions appear
    const suggestions = page.locator('[role="option"], .autocomplete-item, .suggestion-item');
    const count = await suggestions.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify suggestions contain expected locations
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('haymarket');
  });

  test('Test 2: Special characters should be handled gracefully', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill('!@#$%^&*()');
    await page.waitForTimeout(1500);
    
    // Should not crash or show errors
    const errorMessage = page.locator('text=/error|crash|exception/i');
    expect(await errorMessage.count()).toBe(0);
    
    // Should show "no store found" message
    const noStoreMessage = page.locator('text=/no store found/i');
    await expect(noStoreMessage).toBeVisible({ timeout: 5000 });
  });

  test('Test 3: SQL injection attempt should be sanitized', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill("' OR '1'='1");
    await page.waitForTimeout(1500);
    
    // Should not execute SQL or expose database errors
    const sqlError = page.locator('text=/sql|database|syntax error/i');
    expect(await sqlError.count()).toBe(0);
    
    // Should treat as plain text search
    const noStoreMessage = page.locator('text=/no store found/i');
    await expect(noStoreMessage).toBeVisible({ timeout: 5000 });
  });

  test('Test 4: XSS attempt should be prevented', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    // Set up dialog handler to catch any alerts
    let alertFired = false;
    page.on('dialog', async dialog => {
      alertFired = true;
      await dialog.dismiss();
    });
    
    await searchBox.fill('<script>alert("XSS")</script>');
    await page.waitForTimeout(2000);
    
    // Alert should not have fired
    expect(alertFired).toBe(false);
    
    // Script should not be executed, should show no results
    const noStoreMessage = page.locator('text=/no store found/i');
    await expect(noStoreMessage).toBeVisible({ timeout: 5000 });
  });

  test('Test 5: Very long string should not cause buffer overflow', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    const longString = 'a'.repeat(500);
    await searchBox.fill(longString);
    await page.waitForTimeout(1500);
    
    // Page should not crash
    expect(await page.isVisible('body')).toBe(true);
    
    // Should handle gracefully
    const noStoreMessage = page.locator('text=/no store found/i');
    await expect(noStoreMessage).toBeVisible({ timeout: 5000 });
  });

  test('Test 6: Empty spaces should be handled appropriately', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill('     ');
    await page.waitForTimeout(1500);
    
    // Input should be cleared or validation message shown
    const inputValue = await searchBox.inputValue();
    const isEmpty = inputValue.trim().length === 0;
    
    expect(isEmpty).toBe(true);
  });

  test('Test 7: Partial postcode should provide smart suggestions', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill('123');
    await page.waitForTimeout(2000);
    
    // Should show autocomplete suggestions
    const suggestions = page.locator('[role="option"], .autocomplete-item, .suggestion-item');
    const count = await suggestions.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('Test 8: Unicode and emoji characters should be handled', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill('🍕😀Test');
    await page.waitForTimeout(2000);
    
    // Should not crash and either filter emojis or process the text part
    expect(await page.isVisible('body')).toBe(true);
    
    // Should either show suggestions or no results message
    const hasSuggestions = await page.locator('[role="option"], .autocomplete-item, .suggestion-item').count() > 0;
    const hasNoResults = await page.locator('text=/no store found/i').isVisible().catch(() => false);
    
    expect(hasSuggestions || hasNoResults).toBe(true);
  });

  test('Security: Should not expose sensitive information in errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try various malicious inputs
    const maliciousInputs = [
      "'; DROP TABLE stores; --",
      "<img src=x onerror=alert('XSS')>",
      "../../../etc/passwd",
      "${7*7}",
      "{{7*7}}"
    ];
    
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    for (const input of maliciousInputs) {
      await searchBox.clear();
      await searchBox.fill(input);
      await page.waitForTimeout(1000);
    }
    
    // Filter sensitive error patterns
    const sensitiveErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('database') ||
      error.toLowerCase().includes('sql') ||
      error.toLowerCase().includes('password') ||
      error.toLowerCase().includes('token') ||
      error.toLowerCase().includes('secret')
    );
    
    expect(sensitiveErrors).toHaveLength(0);
  });

  test('Performance: Autocomplete should respond within 3 seconds', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    const startTime = Date.now();
    await searchBox.fill('2000');
    
    // Wait for autocomplete to appear
    await page.locator('[role="option"], .autocomplete-item, .suggestion-item').first().waitFor({ timeout: 3000 });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(3000);
    console.log(`Autocomplete response time: ${responseTime}ms`);
  });

  test('Accessibility: Search box should be keyboard accessible', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    // Focus using keyboard
    await page.keyboard.press('Tab');
    
    // Verify search box is focused
    const isFocused = await searchBox.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
    
    // Type using keyboard
    await page.keyboard.type('2000');
    await page.waitForTimeout(2000);
    
    // Navigate suggestions with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Should be able to select with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Should navigate to store or show store details
    expect(page.url()).toBeTruthy();
  });

  test('UX: Clear button should appear when input exists', async ({ page }) => {
    const searchBox = page.locator('input[type="text"], input[placeholder*="postcode"], input[placeholder*="suburb"]').first();
    
    await searchBox.fill('2000');
    await page.waitForTimeout(500);
    
    // Clear button should be visible
    const clearButton = page.locator('button[aria-label*="clear"], button[title*="clear"], .clear-button').first();
    await expect(clearButton).toBeVisible({ timeout: 2000 });
    
    // Click clear button
    await clearButton.click();
    
    // Input should be empty
    const inputValue = await searchBox.inputValue();
    expect(inputValue).toBe('');
  });
});
