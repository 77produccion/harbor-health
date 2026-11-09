import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';

test('el proceso sigue el scroll y se recorre en ambos sentidos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/como-funciona/');
  const scene = page.locator('.sc-steps');
  await expect(scene).toHaveClass(/is-scroll-story/);
  const bounds = await scene.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    range: el.getBoundingClientRect().height - innerHeight,
  }));
  const last = scene.locator('.sc-step').last();
  const progress = () =>
    last.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--step-progress')));
  await page.evaluate(
    ({ top, range }) => window.scrollTo({ top: top + range, behavior: 'instant' }),
    bounds,
  );
  await expect.poll(progress).toBeGreaterThan(0.95);
  await page.evaluate(({ top }) => window.scrollTo({ top, behavior: 'instant' }), bounds);
  await expect.poll(progress).toBeLessThan(0.05);
  // The words themselves never wait for a reveal to become readable.
  await expect(last.locator('p')).toHaveCSS('opacity', '1');
  await page.setViewportSize({ width: 1440, height: 618 });
  await expect(scene).not.toHaveClass(/is-scroll-story/);
  await expect(scene.locator('.sc-step')).toHaveCount(4);
});

test('OS reduce no apaga la experiencia completa solicitada por el responsable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/es/');
  const hero = page.locator('[data-editorial-video="hero-workspace"]');
  await expect(hero).toHaveAttribute('data-playing', 'true');
  const photo = page.locator('.hw-knowledge-capture img');
  await expect(photo).toHaveCSS('clip-path', /inset/);
  await photo.scrollIntoViewIfNeeded();
  await photo.evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY + el.clientHeight / 2 - innerHeight / 2,
      behavior: 'instant',
    }),
  );
  await expect
    .poll(() =>
      photo.evaluate((el) => parseFloat(getComputedStyle(el).clipPath.replace('inset(', ''))),
    )
    .toBeLessThan(0.01);
  await expect(page.locator('.hw-faq-answers article').first()).toHaveCSS('opacity', '1');
});

test('todas las vistas mantienen contenido y navegación sin JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  for (const route of [
    '',
    'como-funciona/',
    'ejemplo/',
    'conocimiento-y-limites/',
    'profesionales/',
    'acceso/',
  ]) {
    await page.goto(`${baseURL}/es/${route}`);
    await expect(page.locator('h1')).toBeVisible();
    const items = page.locator('.sc-step, .sc-reference-list article, .hw-journey-chapter');
    for (const item of await items.all()) await expect(item).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }
  await context.close();
});

test('42 rutas: sin errores de script ni desborde a 390 y 1440 px', async ({ page }) => {
  test.setTimeout(120000);
  await page.route('**/videos/**', (route) => route.abort());
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let visited = 0;
  for (const locale of ['es', 'en', 'nl', 'fr', 'pt', 'de', 'pap']) {
    for (const file of await readdir(`content/pages/${locale}`)) {
      if (!file.endsWith('.mdx')) continue;
      const mdx = await readFile(`content/pages/${locale}/${file}`, 'utf8');
      const route = mdx.match(/^route: (.+)$/m)![1].trim();
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('h1')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), route).toBe(width);
        const heldStage = page.locator('.sc-steps.is-scroll-story .sc-steps-stage');
        if (await heldStage.count()) {
          expect(await heldStage.evaluate((el) => el.scrollHeight), route).toBeLessThanOrEqual(900);
        }
      }
      visited++;
    }
  }
  expect(visited).toBe(42);
  expect(errors).toEqual([]);
});

test('procedencia: títulos y párrafos no se superponen al retirar los iconos', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/es/');
    for (const node of await page.locator('[data-knowledge-node]').all()) {
      const heading = await node.locator('h3').boundingBox();
      const paragraph = await node.locator('p').boundingBox();
      expect(paragraph!.y, `knowledge a ${width}px`).toBeGreaterThanOrEqual(heading!.y + heading!.height);
    }
  }
});
