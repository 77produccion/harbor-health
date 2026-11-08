import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 }, video: { mode: 'on', size: { width: 1280, height: 800 } } });

test('recorrido grabado: documento, explicación y preparación', async ({ page }) => {
  await page.goto('/es/');
  await page.waitForTimeout(1400);
  const top = await page.locator('[data-journey]').evaluate(element => element.getBoundingClientRect().top + scrollY);
  for (const [offset, mode] of [[80, 'documents'], [430, 'levels'], [780, 'consultation']] as const) {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'smooth' }), top + offset);
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
