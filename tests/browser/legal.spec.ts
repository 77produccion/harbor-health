import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import health from '../../content/legal/health.json' with { type: 'json' };
import living from '../../content/legal/living.json' with { type: 'json' };
import legalUI from '../../content/legal/ui.json' with { type: 'json' };
import site from '../../content/site.json' with { type: 'json' };

const locales = site.locales as (keyof typeof legalUI)[];

for (const [slug, document] of [['harbor-health', health], ['harbor-living', living]] as const) {
  test(`${slug}: texto completo, navegación e impresión sin JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
    });
    try {
      const page = await context.newPage();
      await page.goto(`/en/legal/${slug}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('heading', { name: document.title, level: 1 })).toBeVisible();
      await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
      for (const section of document.sections) {
        const article = page.locator(`#article-${section.number}`);
        await expect(article.getByRole('heading')).toHaveText(`Article ${section.number}. ${section.title}`);
        await expect(article.locator('p, li')).toHaveText(
          section.blocks.map((block) => new RegExp(
            (('label' in block ? block.label : '') ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '\\s*' + block.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          )),
        );
      }
      const last = document.sections.at(-1)!;
      await page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name: last.title }).click();
      await expect(page).toHaveURL(new RegExp(`#article-${last.number}$`));
      expect(await page.evaluate(() => window.document.documentElement.scrollWidth)).toBe(375);
      await page.emulateMedia({ media: 'print' });
      await expect(page.getByRole('navigation', { name: 'Contents' })).toBeHidden();
      await expect(page.locator(`#article-${last.number}`)).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test('Health y Living tienen accesos distintos y enlazan los términos aplicables', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/es\/harbor-living\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(livingHeading);

  await page.goto('/es/');
  await expect(page.locator('main h1')).toContainText('resultados de laboratorio');
  await page.getByRole('banner').getByRole('link', { name: 'Harbor Living', exact: true }).click();
  await expect(page).toHaveURL(/\/es\/harbor-living\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(livingHeading);
  await expect(page.getByRole('link', { name: 'Harbor Health', exact: true })).toHaveAttribute('href', '/es/');
  await page.getByRole('link', { name: /Términos y condiciones · Harbor Health/ }).click();
  await expect(page).toHaveURL(/\/es\/legal\/harbor-health\/$/);
  await page.getByRole('link', { name: 'artículo 16 de la Parte A' }).click();
  await expect(page).toHaveURL(/\/es\/legal\/harbor-living\/#article-16$/);
});

for (const locale of locales) {
  test(`${locale}: términos completos y selector compartido para ambos documentos`, async ({ page }) => {
    const documents = locale === 'en' ? { health, living } : JSON.parse(
      readFileSync(new URL(`../../content/legal/translations/${locale}.json`, import.meta.url), 'utf8'),
    ) as { health: typeof health; living: typeof living };
    for (const [slug, doc] of [['harbor-health', documents.health], ['harbor-living', documents.living]] as const) {
      await page.goto(`/${locale}/legal/${slug}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('navigation', { name: legalUI[locale].contents })).toBeVisible();
      await expect(page.getByRole('article')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('article').locator('section h2')).toHaveText(
        doc.sections.map((section) => `${legalUI[locale].article} ${section.number}. ${section.title}`),
      );
      if (locale !== 'en') {
        await expect(page.getByRole('link', { name: legalUI[locale].original }))
          .toHaveAttribute('href', `/en/legal/${slug}/`);
        await expect(page.getByRole('article')).not.toContainText('Who we are and what the words mean');
        for (const section of doc.sections) {
          const article = page.locator(`#article-${section.number}`);
          await expect(article.locator('p, li')).toHaveText(
            section.blocks.map((block) => new RegExp(block.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
          );
        }
      }
      await page.locator('.language-trigger').click();
      await expect(page.locator('#language-options a')).toHaveCount(locales.length);
      const next = locale === 'en' ? 'es' : 'en';
      await page.locator(`#language-options a[hreflang="${next}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${next}/legal/${slug}/$`));
    }
  });
}

const livingHeading = 'Vivir en casa con más tranquilidad.';
