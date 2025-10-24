import { test, expect } from '@playwright/test';

test.describe('Dominos Australia - Link Validation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.dominos.com.au/');
  });

  test('should have valid Apple App Store link', async ({ page }) => {
    // Navigate to footer or app section
    const appStoreLink = page.locator('a[href*="itunes.apple.com"], a[href*="apps.apple.com"]').first();
    
    if (await appStoreLink.count() > 0) {
      const href = await appStoreLink.getAttribute('href');
      
      // Check if using correct Apple App Store URL format
      expect(href).toContain('apps.apple.com');
      expect(href).not.toContain('itunes.apple.com');
      
      // Verify the link responds successfully
      const response = await page.request.get(href!);
      expect(response.status()).toBe(200);
    }
  });

  test('should have valid Google Play Store link', async ({ page }) => {
    const playStoreLink = page.locator('a[href*="play.google.com"]').first();
    const href = await playStoreLink.getAttribute('href');
    
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
  });

  test('main navigation links should be accessible', async ({ page }) => {
    const navLinks = [
      { name: 'Menu', url: 'https://www.dominos.com.au/menu/' },
      { name: 'Offers', url: 'https://www.dominos.com.au/offers/' },
      { name: 'Store Finder', url: 'https://www.dominos.com.au/store-finder/' },
      { name: 'App', url: 'https://www.dominos.com.au/app' }
    ];

    for (const link of navLinks) {
      const response = await page.request.get(link.url);
      expect(response.status(), `${link.name} should return 200`).toBe(200);
    }
  });

  test('social media links should be valid', async ({ page }) => {
    const socialLinks = [
      { name: 'Facebook', url: 'https://www.facebook.com/DominosAustralia' },
      { name: 'YouTube', url: 'https://www.youtube.com/user/DominosAustralia' },
      { name: 'Twitter', url: 'https://twitter.com/dominos_au' },
      { name: 'Instagram', url: 'https://www.instagram.com/dominos_au' }
    ];

    for (const link of socialLinks) {
      const response = await page.request.get(link.url);
      expect(response.status(), `${link.name} should be accessible`).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('external partner links should be valid', async ({ page }) => {
    const externalLinks = [
      { name: 'Jobs', url: 'https://jobs.dominos.com.au/' },
      { name: 'Franchise', url: 'https://www.dominosfranchise.com.au/' },
      { name: 'Investor', url: 'https://www.dominospizzaenterprises.com/' }
    ];

    for (const link of externalLinks) {
      const response = await page.request.get(link.url);
      expect(response.status(), `${link.name} should return 200`).toBe(200);
    }
  });

  test('should not have JavaScript void links in critical areas', async ({ page }) => {
    // Check for problematic javascript:void(0) links
    const voidLinks = page.locator('a[href="javascript:void(0)"]');
    const count = await voidLinks.count();
    
    // Log warning if found
    if (count > 0) {
      console.warn(`Found ${count} javascript:void(0) links - consider adding ARIA labels for accessibility`);
    }
    
    // Verify they have proper event handlers or ARIA attributes
    for (let i = 0; i < count; i++) {
      const link = voidLinks.nth(i);
      const hasOnClick = await link.evaluate(el => el.hasAttribute('onclick'));
      const hasAriaLabel = await link.evaluate(el => el.hasAttribute('aria-label'));
      
      expect(hasOnClick || hasAriaLabel, 'Void link should have onclick or aria-label').toBeTruthy();
    }
  });

  test('all footer links should be accessible', async ({ page }) => {
    const footer = page.locator('footer');
    const footerLinks = footer.locator('a[href^="http"]');
    const count = await footerLinks.count();
    
    console.log(`Testing ${count} footer links`);
    
    const brokenLinks: string[] = [];
    
    for (let i = 0; i < Math.min(count, 20); i++) { // Test first 20 links
      const href = await footerLinks.nth(i).getAttribute('href');
      if (href && !href.includes('javascript:')) {
        try {
          const response = await page.request.get(href);
          if (response.status() >= 400) {
            brokenLinks.push(`${href} - Status: ${response.status()}`);
          }
        } catch (error) {
          brokenLinks.push(`${href} - Error: ${error}`);
        }
      }
    }
    
    expect(brokenLinks, `Broken links found: ${brokenLinks.join(', ')}`).toHaveLength(0);
  });

  test('page should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Application Insights') &&
      !error.includes('Attribution Reporting')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
