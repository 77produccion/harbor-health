import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
const copy = {
  es: ['Tu próxima consulta empieza aquí.', 'como-funciona', 'conocimiento-y-limites'],
  en: ['Your next consultation starts here.', 'how-it-works', 'knowledge-and-limits'],
  nl: ['Je volgende consult begint hier.', 'hoe-het-werkt', 'kennis-en-grenzen'],
  fr: ['Votre prochaine consultation commence ici.', 'fonctionnement', 'connaissances-et-limites'],
  pt: ['Sua próxima consulta começa aqui.', 'como-funciona', 'conhecimento-e-limites'],
  de: ['Dein nächster Termin beginnt hier.', 'so-funktioniert-es', 'wissen-und-grenzen'],
  pap: ['Bo próksimo konsulta ta kuminsá aki.', 'kon-e-ta-funshona', 'konosementu-i-limitashonnan'],
};
for (const [locale, [title, how, trust]] of Object.entries(copy)) {
  test(`${locale}: home, contenido, selector y enlaces localizados`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('[data-home-scene]')).toHaveCount(8);
    await expect(page.locator('.language-trigger')).toHaveText(locale.toUpperCase());
    await page.locator('.language-trigger').click();
    await expect(page.locator('#language-options a')).toHaveCount(7);
    await expect(page.locator(`#language-options a[hreflang="${locale}"]`)).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('.hw-desktop-nav a').nth(0)).toHaveAttribute('href', `/${locale}/${how}/`);
    await expect(page.locator('.hw-desktop-nav a').nth(1)).toHaveAttribute('href', `/${locale}/${trust}/`);
    for (const link of await page.locator('.hw-desktop-nav a').all()) {
      expect(await link.getAttribute('href')).not.toContain('#');
    }
    await expect(page.locator('#knowledge [data-marketing-action="trust"]')).toHaveAttribute('href', `/${locale}/${trust}/`);
    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}');
    expect(graph['@graph'].find((item: Record<string, unknown>) => item['@type'] === 'WebPage').inLanguage).toBe(locale);
    expect((await request.get(`/${locale}/${how}/`)).status()).toBe(200);
    await page.goto(`/${locale}/${how}/`);
    for (const link of await page.locator('header a[href]').all()) {
      expect(await link.getAttribute('href')).not.toContain('#');
    }
    await page.locator('.language-trigger').click();
    await expect(page.locator('#language-options a[hreflang="en"]')).toHaveAttribute('href', '/en/how-it-works/');
    await page.locator('#language-options a[hreflang="en"]').click();
    await expect(page).toHaveURL(/\/en\/how-it-works\/$/);
    expect(errors).toEqual([]);
  });
  test(`${locale}: móvil, interacción, PDF y accesibilidad`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/`);
    await expect(page.locator('h1')).toHaveText(title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    const ui = JSON.parse(await readFile(`content/home-ui.${locale}.json`, 'utf8'));
    await page.locator('[data-chapter-choice="levels"]').click();
    await page.locator('[data-reading-level="l2"]').click();
    await expect(page.locator('[data-reading-panel="l2"]')).toBeVisible();
    await page.locator('[data-chapter-choice="consultation"]').click();
    const downloadEvent = page.waitForEvent('download');
    await page.locator('[data-download-pdf]').click();
    expect((await downloadEvent).suggestedFilename()).toBe(ui.product.pdfFile);
    await expect(page.locator('[data-download-pdf] span')).toHaveText(ui.product.download);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations).toEqual([]);
    await page.setViewportSize({ width: 320, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });
}
