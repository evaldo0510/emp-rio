import { test, expect } from '@playwright/test';

test('vendedor page loads correctly', async ({ page }) => {
  // Increase timeout for initial load
  test.setTimeout(60000);
  
  await page.goto('/vendedor');
  
  // Check for common errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Page error: ${msg.text()}`);
    }
  });

  // Validate page title or heading
  await expect(page).toHaveTitle(/Painel do Vendedor/);
  
  // Check if main blocks are visible
  // Based on the code, if no profile, it shows "Torne-se um Vendedor"
  const registrationHeader = page.getByText('Torne-se um Vendedor');
  const dashboardHeader = page.getByText('Resumo do mês');
  
  await expect(registrationHeader.or(dashboardHeader)).toBeVisible();
  
  // Check for footer to ensure full render
  await expect(page.locator('footer')).toBeVisible();
});
