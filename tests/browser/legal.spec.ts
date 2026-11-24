import { test, expect } from '@playwright/test';
import health from '../../content/legal/health.json' with { type: 'json' };
import living from '../../content/legal/living.json' with { type: 'json' };

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
      await page.getByRole('navigation', { name: 'Articles' }).getByRole('link', { name: last.title }).click();
      await expect(page).toHaveURL(new RegExp(`#article-${last.number}$`));
      expect(await page.evaluate(() => window.document.documentElement.scrollWidth)).toBe(375);
      await page.emulateMedia({ media: 'print' });
      await expect(page.getByRole('navigation', { name: 'Articles' })).toBeHidden();
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
  await page.getByRole('link', { name: 'Article 16 of Part A' }).click();
  await expect(page).toHaveURL(/\/en\/legal\/harbor-living\/#article-16$/);
});

const livingHeading = 'Vivir en casa con más tranquilidad.';
