import { test, expect } from '@playwright/test';

test('las capturas siguen al capítulo y permiten ampliar sin cargar los originales', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  for (const [mode, capture] of [
    ['documents', 'results'],
    ['levels', 'laboratory'],
    ['consultation', 'questions'],
  ]) {
    await page.locator(`[data-product-mode="${mode}"]`).click();
    const figure = page.locator(`[data-product-capture="${capture}"]`);
    await expect(figure).toBeVisible();
    const image = figure.locator('img');
    await expect(image).toHaveAttribute('alt', /.+/);
    await expect(image).toHaveAttribute('srcset', /480w/);
    const href = await figure.locator('a').first().getAttribute('href');
    expect(href).toMatch(/^\/images\/product\/[^/]+\.webp$/);
    expect((await page.request.get(href!)).ok()).toBe(true);
    expect(await image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(
      true,
    );
  }
});

test('las capturas no desbordan en móvil y no se muestran avisos de prototipo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    '',
    'como-funciona/',
    'conocimiento-y-limites/',
    'profesionales/',
    'ejemplo/',
  ]) {
    await page.goto(`/es/${route}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    expect(await page.locator('body').innerText()).not.toMatch(
      /prototipo|versión 1|contenido comercial en revisión/i,
    );
    expect(await page.locator('[data-product-capture]').count()).toBeGreaterThan(0);
  }
});

test('las capturas y sus enlaces siguen disponibles sin JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/es/');
  for (const id of ['results', 'laboratory', 'questions', 'medical-proposal', 'mobile-questions']) {
    const figure = page.locator(`[data-product-capture="${id}"]`);
    await expect(figure).toBeVisible();
    await expect(figure.locator('a').first()).toHaveAttribute('href', /\.webp$/);
  }
  await context.close();
});

test('el recorrido fijo no recorta las capturas en ventanas de distinta altura', async ({
  page,
}) => {
  for (const height of [760, 900]) {
    await page.setViewportSize({ width: 1440, height });
    await page.goto('/es/');
    await page.evaluate(() => document.fonts.ready);
    for (const mode of ['documents', 'levels', 'consultation']) {
      await page.locator(`[data-product-mode="${mode}"]`).click();
      const journey = page.locator('[data-journey]');
      if ((await journey.getAttribute('class'))?.includes('is-live')) {
        const stage = await page.locator('.hw-journey-stage').boundingBox();
        expect(stage!.y + stage!.height).toBeLessThanOrEqual(height);
        expect(await journey.evaluate((el) => getComputedStyle(el).overflow)).toBe('visible');
      } else {
        expect(await journey.evaluate((el) => getComputedStyle(el).overflow)).not.toBe('hidden');
      }
    }
  }
});
