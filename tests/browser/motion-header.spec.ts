import { test, expect } from '@playwright/test';

test('la cabecera mantiene geometría y navegación entre home e interiores', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    let reference: unknown;
    for (const route of [
      '/es/',
      '/es/como-funciona/',
      '/es/conocimiento-y-limites/',
      '/es/profesionales/',
    ]) {
      await page.goto(route);
      const header = page.locator('.harbor-header');
      const snapshot = () =>
        header.evaluate((element) => {
          const style = getComputedStyle(element);
          const logo = element.querySelector('img')!.getBoundingClientRect();
          return {
            height: element.getBoundingClientRect().height,
            top: style.top,
            left: style.left,
            background: style.backgroundColor,
            radius: style.borderRadius,
            logoWidth: logo.width,
            links: [...element.querySelectorAll('.hw-desktop-nav a')].map((link) =>
              link.textContent?.trim(),
            ),
            action: element.querySelector('.hw-nav-action a')?.textContent?.trim(),
          };
        });
      const initial = await snapshot();
      reference ??= initial;
      expect(initial).toEqual(reference);
      await page.evaluate(() => window.scrollTo(0, 250));
      await expect(header).toHaveClass(/is-scrolled/);
      expect(await snapshot()).toEqual(reference);
    }
  }
});

test('la primera escena del recorrido tiene entrada sin ocultar sus controles', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  const title = page.locator('#documents-title');
  // La existencia del estado inicial comprueba que hay animación real,
  // no solo un atributo de capítulo actualizado.
  await expect(title).toHaveCSS('clip-path', /inset/);
  const journeyTop = await page
    .locator('[data-journey]')
    .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), journeyTop - 200);
  await expect(title).toHaveCSS('clip-path', 'none');
  await expect(page.locator('.hw-journey-stage')).toHaveCSS('visibility', 'visible');
  await page.locator('[data-journey-chapter="levels"]').evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 112, behavior: 'instant' });
  });
  await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', 'levels');
  await expect(page.locator('[data-product-panel="levels"]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-product-mode="consultation"]')).toBeEnabled();
});
