import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 }, video: { mode: 'on', size: { width: 1280, height: 800 } } });

test('recorrido grabado: documento, explicación y preparación', async ({ page }) => {
  await page.goto('/es/');
  await page.waitForTimeout(1400);
  for (const mode of ['documents', 'levels', 'consultation'] as const) {
    await page.locator(`[data-journey-chapter="${mode}"]`).evaluate((el) => {
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 112, behavior: 'smooth' });
    });
    await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', mode);
    if (mode === 'documents') await page.getByRole('button', { name: 'Informe de radiología.pdf', exact: true }).click();
    if (mode === 'levels') await page.getByRole('button', { name: 'Lectura con fuentes', exact: true }).click();
    if (mode === 'consultation') await page.locator('[data-question-choice]').first().uncheck();
    await page.waitForTimeout(900);
    // Interactuar con la demo no debe devolver el scroll a otro capítulo.
    await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', mode);
  }
  await expect(page.locator('[data-selected-count]')).toHaveText('2');
  await page.locator('#knowledge').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.locator('#closing').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
});
