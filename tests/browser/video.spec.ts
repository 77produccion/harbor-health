import { test, expect } from '@playwright/test';

test('vídeo editorial en escritorio: reproducción, pausa persistente y segundo vídeo diferido', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  const hero = page.locator('[data-editorial-video="hero-workspace"]');
  const professional = page.locator('[data-editorial-video="professional-workspace"]');
  const box = await hero.boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(16 / 9, 2);
  await expect(hero.locator('video')).toHaveCSS('object-fit', 'contain');
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await expect(professional.locator('video')).not.toHaveAttribute('src');
  expect(await hero.locator('video').evaluate((video) => (video as HTMLVideoElement).muted)).toBe(
    true,
  );
  await hero.getByRole('button', { name: 'Pausar vídeo' }).click();
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await professional.scrollIntoViewIfNeeded();
  await expect(professional).toHaveAttribute('data-playing', 'true');
  const professionalBox = await professional.boundingBox();
  expect(professionalBox!.width / professionalBox!.height).toBeCloseTo(16 / 9, 2);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(professional).toHaveAttribute('data-playing', 'false');
  await expect(hero.getByRole('button')).toHaveAttribute('aria-label', 'Reproducir vídeo');
  await hero.getByRole('button').click();
  await expect(hero).toHaveAttribute('data-playing', 'true');
});

test('móvil reproduce al entrar en escena y conserva pausa y fotografía de respaldo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('.mp4')) requests.push(request.url());
  });
  await page.goto('/en/');
  const hero = page.locator('[data-editorial-video="hero-workspace"]');
  await expect(hero.locator('img')).toBeVisible();
  const box = await hero.boundingBox();
  const text = await page.locator('[data-hero-copy]').boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(16 / 9, 2);
  expect(box!.y).toBeGreaterThan(text!.y + text!.height);
  await expect(hero.locator('video')).toHaveCSS('object-fit', 'contain');
  await expect(hero).toHaveAttribute('data-playing', 'true');
  expect(requests.length).toBeGreaterThan(0);
  await expect(
    page.locator('[data-editorial-video="professional-workspace"] video'),
  ).not.toHaveAttribute('src');
  await hero.getByRole('button', { name: 'Pause video' }).click();
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await hero.getByRole('button', { name: 'Play video' }).click();
  await expect(hero).toHaveAttribute('data-playing', 'true');
});

test('ahorro de datos evita autoplay también en escritorio', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', {
      value: new (class extends EventTarget {
        saveData = true;
        effectiveType = '4g';
      })(),
    }),
  );
  await page.goto('/es/');
  await expect(page.locator('[data-video-control]').first()).toBeVisible();
  await expect(page.locator('video[src]')).toHaveCount(0);
});

test('si el vídeo falla, la foto y el CTA permanecen visibles', async ({ page }) => {
  await page.route('**/videos/**', (route) => route.abort());
  await page.goto('/es/');
  const hero = page.locator('[data-editorial-video="hero-workspace"]');
  await expect(hero).not.toHaveClass(/has-video-frame/);
  await expect(hero.locator('img')).toBeVisible();
  await expect(page.locator('#hero a[data-marketing-action="access"]')).toBeVisible();
});
