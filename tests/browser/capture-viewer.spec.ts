import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`ampliación en la misma página, zoom y cierre accesible a ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/es/');
    const figure = page.locator('[data-product-capture="results"]');
    const opener = figure.locator('[data-capture-open]').first();
    await expect(opener).not.toHaveAttribute('target', '_blank');
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Your documents, organised by category.' });
    await expect(dialog).toBeVisible();
    expect(context.pages()).toHaveLength(1);
    await expect(dialog.locator('[data-capture-full]')).toHaveAttribute(
      'src',
      /results-1420.webp$/,
    );
    await expect
      .poll(() =>
        dialog
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    const zoom = dialog.getByRole('button', { name: 'Ampliar imagen' });
    await zoom.click();
    await expect(dialog.locator('[data-capture-zoom]')).toHaveAttribute('aria-pressed', 'true');
    expect(
      await dialog
        .locator('.capture-viewer-stage')
        .evaluate((el) => el.scrollWidth > el.clientWidth),
    ).toBe(true);
    await dialog.getByRole('button', { name: 'Ajustar imagen' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await figure.locator('figcaption [data-capture-open]').click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cerrar imagen' }).click();
    await expect(dialog).not.toBeVisible();
  });
}

test('el visor también funciona en páginas interiores y conserva la navegación sin JavaScript', async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto('/es/como-funciona/');
  await page.locator('[data-product-capture="upload"] [data-capture-open]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto(`${baseURL}/es/`);
  const link = plain.locator('[data-product-capture="results"] a').first();
  await expect(link).not.toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', '/images/product/results-1420.webp');
  await expect(plain.locator('dialog[open]')).toHaveCount(0);
  await context.close();
});
