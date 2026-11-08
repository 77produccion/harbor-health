import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const route of ['como-funciona', 'conocimiento-y-limites', 'profesionales', 'ejemplo', 'acceso']) {
  test(`${route}: escenas fotográficas, enlaces reales y lectura sin desborde`, async ({ page }) => {
    await page.route('**/videos/**', route => route.abort());
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/es/${route}/`);
    await expect(page.locator('[data-editorial-page]')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.sc-hero img')).toBeVisible();
    expect(await page.locator('[data-visual-scene]').count()).toBeGreaterThan(2);
    await expect(page.locator('.editorial-page')).toHaveCount(0);
    for (const link of await page.locator('header a[href]').all()) expect(await link.getAttribute('href')).not.toContain('#');
    await page.locator('[data-visual-scene]').first().scrollIntoViewIfNeeded();
    await expect(page.locator('[data-visual-scene] img').first()).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/es/${route}/`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.locator('.mobile-navigation summary').click();
    await expect(page.getByRole('navigation', { name: 'Navegación móvil' })).toBeVisible();
    await page.keyboard.press('Escape');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations).toEqual([]);
  });
}

test('la demo móvil permanece visible incluso antes de su entrada por scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/es/');
  await page.locator('[data-chapter-choice="levels"]').click();
  await expect(page.locator('.hw-journey-stage')).toHaveCSS('visibility', 'visible');
  await page.locator('[data-reading-level="l2"]').click();
  await expect(page.locator('[data-reading-panel="l2"]')).toBeVisible();
});
