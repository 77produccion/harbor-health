import { expect, test } from '@playwright/test';
import content from '../../content/legal/account-deletion.json' with { type: 'json' };

test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });

for (const [locale, copy] of Object.entries(content.translations)) {
  test(`${locale}: account deletion request is available without signing in or using JavaScript`, async ({ page }) => {
    const route = `/${locale}/delete-account/`;
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page).toHaveTitle(copy.title);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: copy.title, level: 1 })).toBeVisible();
    const requestLink = main.getByRole('link', { name: copy.action });
    await expect(requestLink).toBeInViewport();
    const mailto = new URL((await requestLink.getAttribute('href'))!);
    expect(mailto.protocol).toBe('mailto:');
    expect(mailto.pathname).toBe('info@myharborliving.com');
    expect(mailto.searchParams.get('subject')).toBe(copy.subject);
    expect(mailto.searchParams.get('body')).toBe(copy.message);
    await expect(main.getByText('info@myharborliving.com', { exact: true })).toBeVisible();
    await expect(main.getByText(copy.subject, { exact: true })).toBeVisible();
    await expect(main.getByText(copy.retention)).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: copy.title })).toHaveAttribute('aria-current', 'page');
    await page.locator('.language-trigger').click();
    for (const translated of Object.keys(content.translations)) {
      await expect(page.locator(`#language-options a[hreflang="${translated}"]`))
        .toHaveAttribute('href', `/${translated}/delete-account/`);
    }
    await page.locator('.language-trigger').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

    await main.getByRole('link', { name: copy.terms }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/legal/harbor-health/#clause-10-3$`));
    await expect(page.locator('#clause-10-3')).toBeVisible();
  });
}

test('the Harbor Health homepage footer links directly to account deletion', async ({ page }) => {
  await page.goto('/en/');
  const link = page.locator('footer').getByRole('link', { name: content.translations.en.title });
  await expect(link).toHaveAttribute('href', '/en/delete-account/');
  await link.click();
  await expect(page).toHaveURL(/\/en\/delete-account\/$/);
});
