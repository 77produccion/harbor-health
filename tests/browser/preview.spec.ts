import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('la home se genera desde Scene MDX y enlaza los accesos documentados', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/es/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu próxima consulta empieza aquí.');
  await expect(page.locator('[data-home-scene]')).toHaveCount(8);
  await expect(page.locator('[data-product-window]')).toHaveCount(1);
  await expect(page.locator('[data-home-scene="hero"] a[data-marketing-action="access"]')).toHaveAttribute('href', 'https://harbor-web-rho.vercel.app/health/login');
  await expect(page.locator('.hw-nav-action a[data-marketing-action="app"]')).toHaveAttribute('href', 'https://harbor-app-beta.vercel.app/');
  await expect(page.locator('#hero .hw-actions a')).toHaveCount(1);
  await expect(page.locator('#hero .hw-app-frame, #hero .hw-hero-atmosphere')).toHaveCount(0);
  await expect(page.locator('#hero picture img')).toBeVisible();
  // ™ es parte del eslogan original, no un emoji ni un icono decorativo.
  const publicText = (await page.locator('body').innerText()).replaceAll('™', '');
  expect(publicText).not.toMatch(/[\u2190-\u21ff]|\p{Extended_Pictographic}/u);
  expect(await page.content()).not.toContain('docs-state-november');
  expect(errors).toEqual([]);
});

test('la navegación usa solo el símbolo y el eslogan se lee fuera del logo', async ({ page }) => {
  for (const route of ['/es/', '/es/como-funciona/']) {
    await page.goto(route);
    const logo = page.locator('header img');
    await expect(logo).toHaveAttribute('src', '/images/harbor-health-symbol.webp');
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(192);
    await expect(page.locator('header .brand-wordmark-name')).toHaveText('Harbor');
    await expect(page.locator('header .brand-wordmark-product span')).toHaveText(['H', 'e', 'a', 'l', 't', 'h']);
    await expect(page.getByRole('link', { name: 'Harbor Health, inicio', exact: true })).toBeVisible();
    const slogan = page.locator('footer .hw-brand-slogan[lang="en"], footer .brand-slogan[lang="en"]');
    await expect(slogan).toContainText('Understanding your Health.');
    await expect(slogan).toContainText('Understanding Why.™');
    await expect(page.locator('header')).not.toContainText('Understanding');
  }
});

test('selector flotante: solo idiomas existentes, teclado y cierre exterior', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/es/');
    const trigger = page.getByRole('button', { name: 'Seleccionar idioma. Actual: español' });
    const list = page.getByRole('navigation', { name: 'Idiomas disponibles' });
    await expect(trigger).toHaveText('ES');
    await expect(list).not.toBeVisible();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await expect(list.getByRole('link')).toHaveCount(7);
    await expect(list.locator('a[hreflang="es"]')).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(list).not.toBeVisible();
    await trigger.click();
    await page.locator('h1').click();
    await expect(list).not.toBeVisible();
  }
  await page.goto('/es/como-funciona/');
  await page.getByRole('button', { name: /Seleccionar idioma/ }).click();
  await expect(page.locator('#language-options a[hreflang="es"]')).toHaveAttribute('href', '/es/como-funciona/');
  await expect(page.locator('#language-options a[hreflang="en"]')).toHaveAttribute('href', '/en/how-it-works/');
});

test('las imágenes aportadas cargan con recortes propios y originales conservados', async ({ page, request }) => {
  await page.goto('/es/');
  const hero = page.locator('[data-hero-image]');
  await expect(hero).toHaveAttribute('src', '/images/home-workspace-poster-1600.webp');
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  for (const selector of ['.hw-professional-portrait img', '.hw-closing-atmosphere img']) {
    const image = page.locator(selector);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  }
  expect((await request.get('/images/9c56b27b-189b-4bf5-b585-020fa04d786f.png')).status()).toBe(200);
});

test('el producto conserva selección y cambia categoría, explicación y preguntas', async ({ page }) => {
  await page.goto('/es/');
  const frame = page.locator('[data-product-window]');
  await frame.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Informe de radiología.pdf', exact: true }).click();
  await expect(page.locator('[data-category-panel="radiology"]')).toBeVisible();
  await page.getByRole('button', { name: 'Explicación', exact: true }).click();
  await page.getByRole('button', { name: 'Lectura con fuentes', exact: true }).click();
  await expect(page.locator('[data-reading-panel="l2"]')).toBeVisible();
  await page.getByRole('button', { name: 'Consulta', exact: true }).click();
  await page.locator('[data-question-choice]').first().uncheck();
  await expect(page.locator('[data-selected-count]')).toHaveText('2');
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await expect(page.locator('[data-category-panel="radiology"]')).toBeVisible();
  await page.getByRole('button', { name: 'Explicación', exact: true }).click();
  await expect(page.locator('[data-reading-panel="l2"]')).toBeVisible();
});

test('el PDF de ejemplo se descarga y respeta que haya preguntas seleccionadas', async ({ page }) => {
  await page.goto('/es/');
  await page.locator('[data-product-window]').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Consulta', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PDF de ejemplo', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('harbor-preguntas-ejemplo.pdf');
  const file = await download.path();
  expect((await readFile(file!)).subarray(0, 4).toString()).toBe('%PDF');
  for (const input of await page.locator('[data-question-choice]').all()) await input.uncheck();
  await expect(page.getByRole('button', { name: 'Descargar PDF de ejemplo', exact: true })).toBeDisabled();
});

for (const width of [320, 390, 768, 820, 1024, 1440]) {
  test(`sin desborde horizontal a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width >= 768 && width < 1000 ? 1024 : 900 });
    await page.goto('/es/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width < 1000) {
      await page.locator('.hw-mobile-menu summary').click();
      await expect(page.getByRole('navigation', { name: 'Navegación móvil' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.hw-mobile-menu')).not.toHaveAttribute('open');
    }
  });
}

test('metadatos, schema y endpoints GEO no filtran borradores ni inventan canonical', async ({ page, request }) => {
  await page.goto('/es/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-health\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}');
  const faq = graph['@graph'].find((item: Record<string, unknown>) => item['@type'] === 'FAQPage');
  const visibleQuestions = await page.locator('.hw-faq-answers h3').allTextContents();
  expect(faq.mainEntity.map((item: {name: string}) => item.name)).toEqual(visibleQuestions.map(item => item.trim()));
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  expect(await (await request.get('/llms-full.txt')).text()).not.toContain('docs-state-november');
  expect(await (await request.get('/llms-full.txt')).text()).not.toContain('Tu próxima consulta empieza aquí.');
  expect((await request.get('/images/og-health.png')).status()).toBe(200);
});

test('sin consentimiento no se mide; aceptar emite una sola página y solo datos permitidos', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { events: unknown[] }).events = [];
    window.addEventListener('harbor:measurement', event => (window as unknown as { events: unknown[] }).events.push((event as CustomEvent).detail));
  });
  const external: string[] = [];
  page.on('request', request => { if (/googletagmanager|google-analytics|facebook/.test(request.url())) external.push(request.url()); });
  await page.goto('/es/?utm_source=google&utm_campaign=patient-name&patient=secret');
  await page.locator('[data-product-window]').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Informe de radiología.pdf', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { events: unknown[] }).events)).toEqual([]);
  await page.getByRole('button', { name: 'Preferencias de medición', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar medición', exact: true }).click();
  await page.getByRole('button', { name: 'Preferencias de medición', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar medición', exact: true }).click();
  const events = await page.evaluate(() => (window as unknown as { events: Record<string, unknown>[] }).events);
  expect(events.filter(item => item.event === 'page_view')).toHaveLength(1);
  expect(JSON.stringify(events)).not.toContain('secret');
  expect(JSON.stringify(events)).not.toContain('patient-name');
  expect(external).toEqual([]);
  await page.getByRole('button', { name: 'Preferencias de medición', exact: true }).click();
  await page.getByRole('button', { name: 'Solo necesarias', exact: true }).click();
  const before = (await page.evaluate(() => (window as unknown as { events: unknown[] }).events)).length;
  await page.locator('[data-product-window]').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.getByRole('button', { name: 'Informe de laboratorio.pdf', exact: true }).click();
  expect((await page.evaluate(() => (window as unknown as { events: unknown[] }).events)).length).toBe(before);
});

test('la preferencia de privacidad del navegador impide activar medición', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
  await page.goto('/es/');
  await page.getByRole('button', { name: 'Preferencias de medición', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aceptar medición', exact: true })).toBeDisabled();
});

test('contenido y acceso siguen disponibles sin JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/es/`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.hw-faq-answers article')).toHaveCount(5);
  await expect(page.locator('[data-home-scene]')).toHaveCount(8);
  await context.close();
});

test('comprobación automatizada de accesibilidad del home', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es/');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('el scroll real hace avanzar la única escena de producto', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/');
  const journey = page.locator('[data-journey]');
  await expect(journey).toHaveClass(/is-live/);
  const top = await journey.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top + 430);
  await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', 'levels');
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top + 780);
  await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', 'consultation');
  await expect(page.locator('[data-product-panel="consultation"]')).toBeVisible();
});

test('móvil selecciona un capítulo sin apilar tres relatos antes del producto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/es/');
  await page.locator('[data-chapter-choice="levels"]').click();
  await expect(page.locator('[data-journey-chapter="levels"]')).toBeVisible();
  await expect(page.locator('[data-journey-chapter="documents"]')).not.toBeVisible();
  await expect(page.locator('[data-product-window]')).toHaveAttribute('data-mode', 'levels');
  await page.locator('[data-chapter-choice="consultation"]').click();
  await page.locator('[data-question-choice]').first().uncheck();
  await expect(page.locator('[data-selected-count]')).toHaveText('2');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PDF de ejemplo', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('harbor-preguntas-ejemplo.pdf');
});
