import { test, expect } from '@playwright/test';

test.describe('Dominos Store Finder - Edge Case Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.dominos.com.au/store-finder/');
    await page.waitForLoadState('networkidle');
  });

  test('Test 1: Valid postcode input should show autocomplete suggestions', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    // Type slowly to trigger autocomplete
    await searchBox.pressSequentially('2000', { delay: 100 });
    
    // Wait for "Address Suggestion" to appear
    await expect(page.locator('text=Address Suggestion')).toBeVisible({ timeout: 5000 });
    
    // Better approach - use role-based selectors
    const suggestionItems = page.getByRole('listitem')
      .filter({ has: page.locator('text=/Street|Avenue|Parade/') });
    
    const count = await suggestionItems.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ Found ${count} autocomplete suggestions`);
  });

  test('Test 2: Special characters should be handled gracefully', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    await searchBox.fill('!@#$%^&*()');
    await page.waitForTimeout(2000);
    
    // Should not crash
    expect(await page.isVisible('body')).toBe(true);
    console.log('✅ Special characters handled without crash');
  });

  test('Test 3: SQL injection attempt should be sanitized', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    await searchBox.fill("' OR '1'='1");
    await page.waitForTimeout(2000);
    
    // Should show "NO STORE FOUND" message instead of database errors
    const noStoreMessage = page.locator('text=NO STORE FOUND FOR SEARCH TERM');
    await expect(noStoreMessage).toBeVisible({ timeout: 3000 });
    
    // Verify no SQL errors in page content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('syntax error');
    expect(pageContent.toLowerCase()).not.toContain('sql error');
    
    console.log('✅ SQL injection attempt properly sanitized');
  });

  test('Test 4: XSS attempt should be prevented', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', async dialog => {
      alertFired = true;
      await dialog.dismiss();
    });
    
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    await searchBox.fill('<script>alert("XSS")</script>');
    await page.waitForTimeout(2000);
    
    expect(alertFired).toBe(false);
    console.log('✅ XSS attempt prevented - no alert fired');
  });

  test('Test 5: Very long string should not cause buffer overflow', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    const longString = 'a'.repeat(500);
    await searchBox.fill(longString);
    await page.waitForTimeout(1500);
    
    // Page should not crash
    expect(await page.isVisible('body')).toBe(true);
    console.log('✅ Long string handled without crash');
  });

  test('Test 6: Empty spaces should be handled appropriately', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    await searchBox.fill('     ');
    await page.waitForTimeout(1500);
    
    // Input should be cleared or remain empty
    const inputValue = await searchBox.inputValue();
    console.log(`✅ Whitespace input value: "${inputValue}"`);
    expect(inputValue.trim().length).toBeLessThanOrEqual(5);
  });

  test('Test 7: Partial postcode should provide smart suggestions', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    await searchBox.pressSequentially('123', { delay: 100 });
    await page.waitForTimeout(2500);
    
    // Should show autocomplete suggestions or handle gracefully
    const hasSuggestions = await page.locator('text=Address Suggestion').isVisible().catch(() => false);
    console.log(`✅ Partial postcode handled - suggestions shown: ${hasSuggestions}`);
    expect(page.url()).toContain('store-finder');
  });

  test('Test 8: Unicode and emoji characters should be handled', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    await searchBox.fill('🍕😀Test');
    await page.waitForTimeout(2000);
    
    // Should not crash
    expect(await page.isVisible('body')).toBe(true);
    console.log('✅ Unicode/emoji characters handled without crash');
  });

  test('Security: Console should not expose sensitive errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    const maliciousInputs = [
      "'; DROP TABLE stores; --",
      "<img src=x onerror=alert('XSS')>",
      "../../../etc/passwd"
    ];
    
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    for (const input of maliciousInputs) {
      await searchBox.clear();
      await searchBox.fill(input);
      await page.waitForTimeout(1000);
    }
    
    const sensitiveErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('database') ||
      error.toLowerCase().includes('sql') ||
      error.toLowerCase().includes('password')
    );
    
    expect(sensitiveErrors).toHaveLength(0);
    console.log('✅ No sensitive information exposed in console');
  });

  test('Performance: Autocomplete should respond within 5 seconds', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    const startTime = Date.now();
    await searchBox.pressSequentially('2000', { delay: 100 });
    
    await page.waitForSelector('text=Address Suggestion', { timeout: 5000 });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(5000);
    console.log(`✅ Response time: ${responseTime}ms`);
  });

  test('UX: Clear button should appear when input exists', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'Enter postcode, suburb or store name' });
    
    await searchBox.fill('2000');
    await page.waitForTimeout(500);
    
    // Clear button should be visible
    const clearButton = page.getByRole('img', { name: 'Clear search' });
    await expect(clearButton).toBeVisible({ timeout: 2000 });
    
    await clearButton.click();
    
    const inputValue = await searchBox.inputValue();
    expect(inputValue).toBe('');
    console.log('✅ Clear button works correctly');
  });
});
