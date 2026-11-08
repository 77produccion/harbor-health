import { test, expect } from '@playwright/test';

for (const height of [618, 720, 759]) {
  test(`ventana baja ${height}px: demo completa y un solo relato sincronizado`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1865, height });
    await page.goto('/es/');
    const journey = page.locator('[data-journey]');
    await expect(journey).not.toHaveClass(/is-live/);
    for (const mode of ['documents', 'levels', 'consultation', 'documents']) {
      await page.locator(`[data-product-mode="${mode}"]`).click();
      await expect(page.locator('[data-journey-chapter]:visible')).toHaveCount(1);
      await expect(page.locator(`[data-journey-chapter="${mode}"]`)).toBeVisible();
      await expect(page.locator(`[data-product-panel="${mode}"]`)).toBeVisible();
      await expect
        .poll(() =>
          page.locator('.hw-product-body').evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBeLessThanOrEqual(1);
      expect(await journey.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(1200);
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
  await expect(page.locator('[data-journey-chapter]:visible')).toHaveCount(1);
  await expect(page.locator('[data-journey-chapter="documents"]')).toBeVisible();
});

test('redimensionar de escritorio alto a bajo conserva la sincronización', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  await page.locator('[data-product-mode="levels"]').click();
  await page.setViewportSize({ width: 1440, height: 618 });
  await expect(page.locator('[data-journey]')).not.toHaveClass(/is-live/);
  await expect(page.locator('[data-journey-chapter]:visible')).toHaveCount(1);
  await page.locator('[data-product-mode="consultation"]').click();
  await expect(page.locator('[data-journey-chapter="consultation"]')).toBeVisible();
});
