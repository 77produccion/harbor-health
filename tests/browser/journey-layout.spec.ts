import { test, expect } from '@playwright/test';

for (const height of [618, 720, 759, 900]) {
  test(`sticky y scroll sincronizados incluso con fotografías a ${height}px`, async ({ page }) => {
    await page.setViewportSize({ width: 1865, height });
    await page.goto('/es/');
    const journey = page.locator('[data-journey]');
    await expect(journey).toHaveClass(/is-live/);
    await expect(page.locator('.hw-journey-stage')).toHaveCSS('position', 'sticky');
    for (const mode of ['documents', 'levels', 'consultation', 'documents']) {
      await page.locator(`[data-product-mode="${mode}"]`).click();
      await expect(page.locator(`[data-journey-chapter="${mode}"]`)).toBeVisible();
      await expect(page.locator(`[data-product-panel="${mode}"]`)).toBeVisible();
      const bounds = await page.locator('.hw-journey-stage').boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(110);
      expect(bounds!.y).toBeLessThanOrEqual(122);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    }
    await expect(page.locator('.hw-app-note')).toBeVisible();
  });
}

test('clic y scroll comparten un solo estado, incluso al volver al primer capítulo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  const journey = page.locator('[data-journey]');
  const top = await journey.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y + 50, behavior: 'instant' }), top);
  await page.locator('[data-product-mode="consultation"]').click();
  await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', 'consultation');
  await page.evaluate((y) => window.scrollTo({ top: y + 50, behavior: 'instant' }), top);
  await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', 'documents');
  await expect(page.locator('[data-journey-chapter]:visible')).toHaveCount(3);
  await expect(page.locator('[data-journey-chapter="documents"]')).toBeVisible();
});

test('redimensionar de escritorio alto a bajo conserva la sincronización', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  await page.locator('[data-product-mode="levels"]').click();
  await page.setViewportSize({ width: 1440, height: 540 });
  await expect(page.locator('[data-journey]')).not.toHaveClass(/is-live/);
  await expect(page.locator('[data-journey-chapter]:visible')).toHaveCount(1);
  await page.locator('[data-product-mode="consultation"]').click();
  await expect(page.locator('[data-journey-chapter="consultation"]')).toBeVisible();
});

test('el panel permanece fijo mientras el scroll cambia los tres capítulos en ambos sentidos', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1902, height: 801 });
  await page.goto('/es/');
  await expect(page.locator('[data-journey]')).toHaveClass(/is-live/);
  for (const mode of ['documents', 'levels', 'consultation', 'levels', 'documents']) {
    await page.locator(`[data-journey-chapter="${mode}"]`).evaluate((el) => {
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 112, behavior: 'instant' });
    });
    await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', mode);
    await expect(page.locator(`[data-product-mode="${mode}"]`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const bounds = await page.locator('.hw-journey-stage').boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(110);
    expect(bounds!.y).toBeLessThanOrEqual(114);
  }
});
